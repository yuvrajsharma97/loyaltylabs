const mongoose = require('mongoose');
const AppError = require('../../shared/utils/AppError');
const asyncHandler = require('../../shared/utils/asyncHandler');
const { isValidObjectId } = require('../../shared/utils/objectId');
const writeAuditLog = require('../../shared/services/writeAuditLog');

const Store = require('../stores/store.model');
const Customer = require('../customers/customer.model');
const Membership = require('../memberships/membership.model');
const PointTransaction = require('../transactions/transaction.model');
const Redemption = require('../redemptions/redemption.model');
const Dispute = require('../disputes/dispute.model');
const { StoreBilling, UsageSnapshot } = require('../billing/billing.model');
const ReconciliationLog = require('./reconciliationLog.model');

const DEFAULT_LIST_LIMIT = 50;
const MAX_LIST_LIMIT = 200;

function parseLimit(value) {
  const parsed = parseInt(value, 10);
  return Math.min(Number.isNaN(parsed) || parsed <= 0 ? DEFAULT_LIST_LIMIT : parsed, MAX_LIST_LIMIT);
}

/**
 * All stores platform-wide, regardless of discoverable/status (unlike the
 * public directory).
 * @route GET /admin/stores
 * @access Private (super_admin)
 * @query {'active'|'suspended'} [status]
 * @query {number} [limit=50]
 */
const listStores = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status === 'active' || req.query.status === 'suspended') {
    filter.status = req.query.status;
  }

  const stores = await Store.find(filter).sort({ createdAt: -1 }).limit(parseLimit(req.query.limit));
  res.json({ success: true, data: { stores } });
});

/**
 * Triggers the full suspension/reactivation flow (plan section 3.6).
 * Suspension: every pending redemption is cancelled and its points restored
 * via a 'suspension_reversal' ledger entry (a platform action, safe to
 * auto-restore); the current billing period is closed out as pro-rated, if a
 * StoreBilling record exists. Directory visibility and the customer-facing
 * "unavailable" message aren't separate steps - both already derive from
 * store.status everywhere else in the codebase. Reactivation only flips
 * status back - cancelled redemption codes are never reinstated.
 * @route PATCH /admin/stores/:id/status
 * @access Private (super_admin)
 * @body {'active'|'suspended'} status
 */
const updateStoreStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!isValidObjectId(id)) {
    throw new AppError('STORE_NOT_FOUND', 'Store not found', 404);
  }

  const store = await Store.findById(id);
  if (!store) {
    throw new AppError('STORE_NOT_FOUND', 'Store not found', 404);
  }

  const previousStatus = store.status;
  if (previousStatus === status) {
    return res.json({ success: true, data: { id: store._id, status: store.status } });
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      if (status === 'suspended') {
        const pendingRedemptions = await Redemption.find({ storeId: store._id, status: 'pending' }).session(
          session
        );

        for (const redemption of pendingRedemptions) {
          const cancelled = await Redemption.findOneAndUpdate(
            { _id: redemption._id, status: 'pending' },
            { $set: { status: 'cancelled' } },
            { session, new: true }
          );
          if (!cancelled) continue; // fulfilled/cancelled elsewhere already - don't double-restore

          await Membership.updateOne(
            { customerId: cancelled.customerId, storeId: cancelled.storeId },
            { $inc: { pointsBalance: cancelled.pointsSpent } },
            { session }
          );
          await PointTransaction.create(
            [{
              storeId: cancelled.storeId,
              customerId: cancelled.customerId,
              type: 'suspension_reversal',
              points: cancelled.pointsSpent,
              relatedRedemptionId: cancelled._id
            }],
            { session }
          );
        }

        const billing = await StoreBilling.findOne({ storeId: store._id }).session(session);
        if (billing) {
          const cutoff = new Date(Date.now() - billing.activeWindowDays * 24 * 60 * 60 * 1000);
          const activeCustomerCount = await Membership.countDocuments({
            storeId: store._id,
            lastActivityAt: { $ne: null, $gte: cutoff }
          }).session(session);
          const billableCount = Math.max(activeCustomerCount - billing.freeUserLimit, 0);
          const amountDue = billableCount * billing.pricePerExtraUser;

          await UsageSnapshot.create(
            [{
              storeId: store._id,
              periodStart: billing.currentBillingPeriodStart,
              periodEnd: new Date(),
              activeCustomerCount,
              billableCount,
              amountDue,
              proRated: true,
              status: 'invoiced'
            }],
            { session }
          );
        }
      }

      store.status = status;
      await store.save({ session });
    });
  } finally {
    session.endSession();
  }

  await writeAuditLog({
    actorUserId: req.auth.id,
    storeId: store._id,
    action: status === 'suspended' ? 'admin.store.suspend' : 'admin.store.reactivate',
    target: String(store._id),
    metadata: { previousStatus, newStatus: status }
  });

  res.json({ success: true, data: { id: store._id, status: store.status } });
});

/**
 * Platform-wide aggregate metrics.
 * @route GET /admin/metrics
 * @access Private (super_admin)
 */
const getMetrics = asyncHandler(async (req, res) => {
  const [
    totalStores,
    activeStores,
    suspendedStores,
    totalCustomers,
    totalMemberships,
    activeMemberships,
    openDisputes
  ] = await Promise.all([
    Store.countDocuments({}),
    Store.countDocuments({ status: 'active' }),
    Store.countDocuments({ status: 'suspended' }),
    Customer.countDocuments({}),
    Membership.countDocuments({}),
    Membership.countDocuments({ lastActivityAt: { $ne: null } }),
    Dispute.countDocuments({ status: 'open' })
  ]);

  const [pointsAgg] = await PointTransaction.aggregate([
    {
      $group: {
        _id: null,
        totalPointsIssued: { $sum: { $cond: [{ $gt: ['$points', 0] }, '$points', 0] } },
        totalPointsRedeemed: { $sum: { $cond: [{ $lt: ['$points', 0] }, { $abs: '$points' }, 0] } }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      totalStores,
      activeStores,
      suspendedStores,
      totalCustomers,
      totalMemberships,
      activeMemberships,
      openDisputes,
      totalPointsIssued: pointsAgg ? pointsAgg.totalPointsIssued : 0,
      totalPointsRedeemed: pointsAgg ? pointsAgg.totalPointsRedeemed : 0
    }
  });
});

/**
 * All disputes platform-wide - defaults to unresolved only ("Super admin
 * sees all unresolved disputes platform-wide", plan section 3.5); pass
 * ?status=all or ?status=resolved to see others.
 * @route GET /admin/disputes
 * @access Private (super_admin)
 * @query {'open'|'resolved'|'all'} [status=open]
 * @query {number} [limit=50]
 */
const listDisputes = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status === 'open' || req.query.status === 'resolved') {
    filter.status = req.query.status;
  } else if (req.query.status !== 'all') {
    filter.status = 'open';
  }

  const disputes = await Dispute.find(filter).sort({ createdAt: -1 }).limit(parseLimit(req.query.limit));
  res.json({ success: true, data: { disputes } });
});

/**
 * Two-step reconciliation. Without `confirm`, computes expectedBalance (sum
 * of pointTransactions) vs actualBalance (membership.pointsBalance) per
 * customer, writes a reconciliationLog for every discrepancy found
 * (corrected:false), and returns them for review - no correction applied.
 * With `confirm:true`, applies an 'adjust' ledger entry to fix every
 * currently-uncorrected log for this store and marks them corrected.
 * @route POST /admin/stores/:id/reconcile
 * @access Private (super_admin)
 * @body {boolean} [confirm=false]
 */
const reconcile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { confirm } = req.body;

  if (!isValidObjectId(id)) {
    throw new AppError('STORE_NOT_FOUND', 'Store not found', 404);
  }
  const store = await Store.findById(id);
  if (!store) {
    throw new AppError('STORE_NOT_FOUND', 'Store not found', 404);
  }

  if (!confirm) {
    const memberships = await Membership.find({ storeId: store._id });
    const discrepancies = [];

    for (const membership of memberships) {
      const [agg] = await PointTransaction.aggregate([
        { $match: { storeId: store._id, customerId: membership.customerId } },
        { $group: { _id: null, expectedBalance: { $sum: '$points' } } }
      ]);
      const expectedBalance = agg ? agg.expectedBalance : 0;
      const actualBalance = membership.pointsBalance;
      const discrepancy = actualBalance - expectedBalance;

      if (discrepancy !== 0) {
        const log = await ReconciliationLog.create({
          storeId: store._id,
          customerId: membership.customerId,
          expectedBalance,
          actualBalance,
          discrepancy,
          corrected: false
        });
        discrepancies.push(log);
      }
    }

    return res.json({ success: true, data: { discrepancies, requiresConfirm: discrepancies.length > 0 } });
  }

  const pendingLogs = await ReconciliationLog.find({ storeId: store._id, corrected: false });
  const correctedIds = [];

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const log of pendingLogs) {
        await Membership.updateOne(
          { customerId: log.customerId, storeId: store._id },
          { $set: { pointsBalance: log.expectedBalance } },
          { session }
        );
        await PointTransaction.create(
          [{
            storeId: store._id,
            customerId: log.customerId,
            performedByUserId: req.auth.id,
            type: 'adjust',
            points: log.expectedBalance - log.actualBalance
          }],
          { session }
        );
        await ReconciliationLog.updateOne({ _id: log._id }, { $set: { corrected: true } }, { session });
        correctedIds.push(log._id);
      }
    });
  } finally {
    session.endSession();
  }

  await writeAuditLog({
    actorUserId: req.auth.id,
    storeId: store._id,
    action: 'admin.store.reconcile',
    target: String(store._id),
    metadata: { correctedCount: correctedIds.length }
  });

  res.json({ success: true, data: { corrected: correctedIds.length } });
});

module.exports = { listStores, updateStoreStatus, getMetrics, listDisputes, reconcile };
