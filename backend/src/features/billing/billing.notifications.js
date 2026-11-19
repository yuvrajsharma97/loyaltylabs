const env = require('../../config/env');
const sendEmail = require('../../shared/services/sendEmail');
const Store = require('../stores/store.model');
const User = require('../auth/auth.model');
const { StoreBilling } = require('./billing.model');
const { PLANS, getPlan } = require('./billing.plans');
const { countActiveCustomers } = require('./billing.service');
const { planLimitReachedEmail } = require('./billing.emailTemplates');

const LIMITED_PLAN_IDS = Object.values(PLANS)
  .filter((plan) => plan.customerLimit !== null)
  .map((plan) => plan.id);

// Suspended stores can't scan, so there's nothing to warn them about.
const NOTIFIABLE_STATUSES = ['trialing', 'active', 'past_due'];

async function sendLimitEmail(billing, activeCustomerCount) {
  const plan = getPlan(billing.plan);
  const store = await Store.findById(billing.storeId);
  const owner = store && (await User.findById(store.ownerUserId));
  if (!owner) return false;

  await sendEmail({
    to: owner.email,
    ...planLimitReachedEmail({
      ownerName: owner.name,
      storeName: store.name,
      planName: plan.name,
      customerLimit: plan.customerLimit,
      activeCustomerCount,
      upgradeUrl: `${env.appUrl}/store/settings?section=billing`
    })
  });
  await StoreBilling.updateOne({ _id: billing._id }, { $set: { lastLimitEmailAt: new Date() } });
  return true;
}

/**
 * Called right after a scan adds an active customer. If that took the store
 * to its limit, email the owner straight away. The conditional update on
 * limitReachedAt makes this fire once per time the limit is reached, even if
 * two tills scan at the same moment. Never throws - a failed email must not
 * fail the scan that triggered it.
 */
async function notifyIfLimitJustReached(storeId) {
  try {
    const billing = await StoreBilling.findOne({ storeId });
    const plan = billing && getPlan(billing.plan);
    if (!plan || plan.customerLimit === null || !NOTIFIABLE_STATUSES.includes(billing.status)) return;

    const activeCustomerCount = await countActiveCustomers(storeId, billing.activeWindowDays);
    if (activeCustomerCount < plan.customerLimit) return;

    const claimed = await StoreBilling.findOneAndUpdate(
      { _id: billing._id, limitReachedAt: null },
      { $set: { limitReachedAt: new Date() } },
      { new: true }
    );
    if (!claimed) return; // already at the limit and notified

    await sendLimitEmail(claimed, activeCustomerCount);
  } catch (err) {
    console.error('notifyIfLimitJustReached failed:', { storeId: String(storeId) }, err);
  }
}

/**
 * Scheduled run (9:30 and 21:30 UK time): email every store that is at its
 * limit, and clear the flag on stores that have dropped back under it (an
 * upgrade, or customers ageing out of the active window). One store's
 * failure doesn't stop the rest.
 * @returns {{ checked: number, emailed: number, cleared: number }}
 */
async function sendScheduledLimitReminders() {
  const billings = await StoreBilling.find({ plan: { $in: LIMITED_PLAN_IDS }, status: { $in: NOTIFIABLE_STATUSES } });
  const summary = { checked: billings.length, emailed: 0, cleared: 0 };

  for (const billing of billings) {
    try {
      const plan = getPlan(billing.plan);
      const activeCustomerCount = await countActiveCustomers(billing.storeId, billing.activeWindowDays);

      if (activeCustomerCount >= plan.customerLimit) {
        if (!billing.limitReachedAt) {
          await StoreBilling.updateOne({ _id: billing._id }, { $set: { limitReachedAt: new Date() } });
        }
        if (await sendLimitEmail(billing, activeCustomerCount)) summary.emailed += 1;
      } else if (billing.limitReachedAt) {
        await StoreBilling.updateOne({ _id: billing._id }, { $set: { limitReachedAt: null } });
        summary.cleared += 1;
      }
    } catch (err) {
      console.error('Plan limit reminder failed:', { storeId: String(billing.storeId) }, err);
    }
  }

  return summary;
}

module.exports = { notifyIfLimitJustReached, sendScheduledLimitReminders };
