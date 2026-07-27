const AppError = require('../../shared/utils/AppError');
const asyncHandler = require('../../shared/utils/asyncHandler');
const { isValidObjectId } = require('../../shared/utils/objectId');

const { StoreBilling, UsageSnapshot } = require('./billing.model');
const Store = require('../stores/store.model');
const Membership = require('../memberships/membership.model');

// storeId travels as a query param on both billing routes (neither is
// nested under /stores/:id) - loaded + ownership-checked here rather than
// via the storeScope middleware, which only reads from params/body.
async function loadOwnedStoreBilling(req) {
  const { storeId } = req.query;

  if (!isValidObjectId(storeId)) {
    throw new AppError('STORE_NOT_FOUND', 'Store not found', 404);
  }

  const store = await Store.findById(storeId);
  if (!store) {
    throw new AppError('STORE_NOT_FOUND', 'Store not found', 404);
  }
  if (store.ownerUserId.toString() !== req.auth.id) {
    throw new AppError('FORBIDDEN', "You don't have permission to do that", 403);
  }

  const billing = await StoreBilling.findOne({ storeId });
  if (!billing) {
    throw new AppError('BILLING_NOT_SETUP', 'No billing record exists for this store', 404);
  }

  return { store, billing };
}

/**
 * Live-computed usage for the current billing period. Read-only - actual
 * metering (BullMQ job) and invoicing (Stripe) are not built here, only the
 * two GET endpoints documented in the plan's API surface.
 * @route GET /billing/usage
 * @access Private (store_owner, owner of this store)
 * @query {string} storeId
 */
const getUsage = asyncHandler(async (req, res) => {
  const { store, billing } = await loadOwnedStoreBilling(req);

  const cutoff = new Date(Date.now() - billing.activeWindowDays * 24 * 60 * 60 * 1000);
  const activeCustomerCount = await Membership.countDocuments({
    storeId: store._id,
    lastActivityAt: { $ne: null, $gte: cutoff }
  });
  const billableCount = Math.max(activeCustomerCount - billing.freeUserLimit, 0);
  const amountDue = billableCount * billing.pricePerExtraUser;

  res.json({
    success: true,
    data: {
      status: billing.status,
      currentBillingPeriodStart: billing.currentBillingPeriodStart,
      currentBillingPeriodEnd: billing.currentBillingPeriodEnd,
      freeUserLimit: billing.freeUserLimit,
      pricePerExtraUser: billing.pricePerExtraUser,
      activeCustomerCount,
      billableCount,
      amountDue
    }
  });
});

/**
 * Past billing periods for this store, newest first.
 * @route GET /billing/history
 * @access Private (store_owner, owner of this store)
 * @query {string} storeId
 * @query {number} [limit=20]
 */
const getHistory = asyncHandler(async (req, res) => {
  const { store } = await loadOwnedStoreBilling(req);

  const parsedLimit = parseInt(req.query.limit, 10);
  const limit = Math.min(Number.isNaN(parsedLimit) || parsedLimit <= 0 ? 20 : parsedLimit, 100);

  const snapshots = await UsageSnapshot.find({ storeId: store._id }).sort({ periodStart: -1 }).limit(limit);

  res.json({ success: true, data: { snapshots } });
});

module.exports = { getUsage, getHistory };
