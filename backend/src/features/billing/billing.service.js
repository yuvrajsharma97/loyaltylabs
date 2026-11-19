const AppError = require('../../shared/utils/AppError');
const Membership = require('../memberships/membership.model');
const { StoreBilling } = require('./billing.model');
const { getPlan, TRIAL_DAYS, DAY_MS } = require('./billing.plans');

function activeCutoff(activeWindowDays) {
  return new Date(Date.now() - activeWindowDays * DAY_MS);
}

function isMembershipActive(membership, activeWindowDays) {
  return Boolean(membership && membership.lastActivityAt && membership.lastActivityAt >= activeCutoff(activeWindowDays));
}

async function countActiveCustomers(storeId, activeWindowDays, session = null) {
  return Membership.countDocuments({
    storeId,
    lastActivityAt: { $ne: null, $gte: activeCutoff(activeWindowDays) }
  }).session(session);
}

/** Billing fields for a brand-new store: TRIAL_DAYS free on the chosen plan. */
function newTrialBilling(storeId, planId, now = new Date()) {
  const trialEndsAt = new Date(now.getTime() + TRIAL_DAYS * DAY_MS);
  return {
    storeId,
    plan: planId,
    trialEndsAt,
    currentBillingPeriodStart: now,
    currentBillingPeriodEnd: trialEndsAt,
    status: 'trialing'
  };
}

/** Plan details plus live usage, as returned by GET /billing/usage. */
async function describeBilling(billing, session = null) {
  const plan = getPlan(billing.plan);
  const activeCustomerCount = await countActiveCustomers(billing.storeId, billing.activeWindowDays, session);
  const limitReached = plan.customerLimit !== null && activeCustomerCount >= plan.customerLimit;
  const isTrialing = billing.status === 'trialing';

  return {
    plan: plan.id,
    planName: plan.name,
    price: plan.price,
    interval: plan.interval,
    shopLimit: plan.shopLimit,
    customerLimit: plan.customerLimit,
    status: billing.status,
    trialEndsAt: billing.trialEndsAt,
    currentBillingPeriodStart: billing.currentBillingPeriodStart,
    currentBillingPeriodEnd: billing.currentBillingPeriodEnd,
    activeWindowDays: billing.activeWindowDays,
    activeCustomerCount,
    limitReached,
    // What the current period costs: nothing while trialing.
    amountDue: isTrialing ? 0 : plan.price,
    nextChargeAt: isTrialing ? billing.trialEndsAt : billing.currentBillingPeriodEnd
  };
}

/**
 * Hard stop at the plan's customer limit. Customers who are already active
 * keep earning; a customer who would become a new active customer is refused
 * once the shop is at its limit. Stores with no billing record (registered
 * before plans existed) are not limited.
 * Resolves { addsActiveCustomer }: true when serving this customer adds one
 * to a limited plan's active count, so the caller can check whether that
 * scan took the shop to its limit.
 */
async function assertCanServeCustomer(storeId, membership, session = null) {
  const allowed = { addsActiveCustomer: false };
  const billing = await StoreBilling.findOne({ storeId }).session(session);
  if (!billing) return allowed;

  const plan = getPlan(billing.plan);
  if (!plan || plan.customerLimit === null) return allowed;
  if (isMembershipActive(membership, billing.activeWindowDays)) return allowed;

  const activeCustomerCount = await countActiveCustomers(storeId, billing.activeWindowDays, session);
  if (activeCustomerCount >= plan.customerLimit) {
    throw new AppError(
      'PLAN_LIMIT_REACHED',
      `This shop has reached its ${plan.customerLimit} active customer limit. Upgrade the plan to add new customers.`,
      403,
      { customerLimit: plan.customerLimit, activeCustomerCount }
    );
  }
  return { addsActiveCustomer: true };
}

module.exports = {
  countActiveCustomers,
  newTrialBilling,
  describeBilling,
  assertCanServeCustomer
};
