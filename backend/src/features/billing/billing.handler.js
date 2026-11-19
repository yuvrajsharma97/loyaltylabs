const AppError = require('../../shared/utils/AppError');
const asyncHandler = require('../../shared/utils/asyncHandler');
const { isValidObjectId } = require('../../shared/utils/objectId');
const { parsePagination, paginateQuery } = require('../../shared/utils/pagination');
const writeAuditLog = require('../../shared/services/writeAuditLog');

const { StoreBilling, UsageSnapshot } = require('./billing.model');
const { getPlan } = require('./billing.plans');
const { countActiveCustomers, describeBilling, newTrialBilling } = require('./billing.service');
const Store = require('../stores/store.model');

// storeId travels as a query param on every billing route (none is nested
// under /stores/:id) - loaded + ownership-checked here rather than via the
// storeScope middleware, which only reads from params/body.
async function loadOwnedStore(req) {
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

  return store;
}

async function loadOwnedStoreBilling(req) {
  const store = await loadOwnedStore(req);
  const billing = await StoreBilling.findOne({ storeId: store._id });
  // Records from the old per-customer billing model have no plan: treat them
  // as not set up so the owner is asked to pick one.
  if (!billing || !billing.plan) {
    throw new AppError('BILLING_NOT_SETUP', 'No billing record exists for this store', 404);
  }
  return { store, billing };
}

/**
 * The store's plan, trial state and live active-customer count against the
 * plan's limit. Read-only - invoicing (Stripe) is not built yet.
 * @route GET /billing/usage
 * @access Private (store_owner, owner of this store)
 * @query {string} storeId
 */
const getUsage = asyncHandler(async (req, res) => {
  const { billing } = await loadOwnedStoreBilling(req);
  res.json({ success: true, data: await describeBilling(billing) });
});

/**
 * Past billing periods for this store, newest first.
 * @route GET /billing/history
 * @access Private (store_owner, owner of this store)
 * @query {string} storeId
 * @query {number} [page=1]
 * @query {number} [limit=10]
 */
const getHistory = asyncHandler(async (req, res) => {
  const { store } = await loadOwnedStoreBilling(req);

  const { items: snapshots, pagination } = await paginateQuery(
    UsageSnapshot,
    { storeId: store._id },
    parsePagination(req.query),
    { sort: { periodStart: -1, _id: -1 } }
  );

  res.json({ success: true, data: { snapshots, pagination } });
});

/**
 * Switch plan. Takes effect immediately; during the trial the trial dates are
 * kept. A store with no billing record yet (registered before plans existed)
 * gets one here, starting its free trial. Moving to a plan whose limit is
 * below the current active-customer count is refused.
 * @route PATCH /billing/plan
 * @access Private (store_owner, owner of this store)
 * @query {string} storeId
 * @body {'one_shop'|'three_shops'|'five_shops'} plan
 */
const changePlan = asyncHandler(async (req, res) => {
  const store = await loadOwnedStore(req);
  const nextPlan = getPlan(req.body.plan);

  let billing = await StoreBilling.findOne({ storeId: store._id });
  const previousPlan = billing ? billing.plan : null;

  if (billing && billing.plan === nextPlan.id) {
    return res.json({ success: true, data: await describeBilling(billing) });
  }

  if (billing && billing.plan && nextPlan.customerLimit !== null) {
    const activeCustomerCount = await countActiveCustomers(store._id, billing.activeWindowDays);
    if (activeCustomerCount > nextPlan.customerLimit) {
      throw new AppError(
        'PLAN_TOO_SMALL',
        `You have ${activeCustomerCount} active customers. The ${nextPlan.name} plan allows ${nextPlan.customerLimit}.`,
        409,
        { activeCustomerCount, customerLimit: nextPlan.customerLimit }
      );
    }
  }

  if (billing) {
    billing.plan = nextPlan.id;
    // Re-armed for the new plan: the next time its limit is hit, the owner
    // gets an immediate email again. The scheduled run re-sets it if the
    // store is still at the new plan's limit.
    billing.limitReachedAt = null;
    await billing.save();
  } else {
    billing = await StoreBilling.create(newTrialBilling(store._id, nextPlan.id));
  }

  await writeAuditLog({
    actorUserId: req.auth.id,
    storeId: store._id,
    action: 'billing.change_plan',
    target: String(store._id),
    metadata: { from: previousPlan, to: nextPlan.id }
  });

  res.json({ success: true, data: await describeBilling(billing) });
});

module.exports = { getUsage, getHistory, changePlan };
