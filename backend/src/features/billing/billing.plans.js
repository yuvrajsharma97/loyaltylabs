// Single source of truth for what each plan costs and allows. Prices are GBP
// excluding VAT. Plans differ by how many shops they cover; every plan has
// unlimited customers. customerLimit counts *active* customers (see
// ACTIVE_WINDOW_DAYS); null means unlimited. It is null on every plan today,
// so the limit checks in billing.service / billing.notifications never fire.
const PLANS = {
  one_shop: { id: 'one_shop', name: '1 Shop', price: 5.99, interval: 'month', shopLimit: 1, customerLimit: null },
  three_shops: { id: 'three_shops', name: '3 Shops', price: 15.99, interval: 'month', shopLimit: 3, customerLimit: null },
  five_shops: { id: 'five_shops', name: '5 Shops', price: 25.99, interval: 'month', shopLimit: 5, customerLimit: null }
};

// Plans an owner can pick today.
const PLAN_IDS = Object.keys(PLANS);

// Retired plan ids that may still be stored on older billing records. They
// resolve to the 1-shop plan, so those shops are now unlimited at £5.99.
const LEGACY_PLAN_ALIASES = { weekly: 'one_shop', monthly: 'one_shop', unlimited: 'one_shop' };

// Every id a billing record may hold (current plus retired).
const STORED_PLAN_IDS = [...PLAN_IDS, ...Object.keys(LEGACY_PLAN_ALIASES)];

const DEFAULT_PLAN_ID = 'one_shop';

// Every new shop gets six weeks free on the plan it picked at sign-up.
const TRIAL_DAYS = 42;

// A customer is "active" if they earned or redeemed at the shop within this
// many days (Membership.lastActivityAt).
const ACTIVE_WINDOW_DAYS = 90;

const DAY_MS = 24 * 60 * 60 * 1000;

function getPlan(planId) {
  return PLANS[planId] || PLANS[LEGACY_PLAN_ALIASES[planId]] || null;
}

/** End of a billing period that starts at `start`, for the plan's interval. */
function addInterval(start, interval) {
  const end = new Date(start);
  if (interval === 'week') {
    end.setDate(end.getDate() + 7);
  } else {
    end.setMonth(end.getMonth() + 1);
  }
  return end;
}

module.exports = {
  PLANS,
  PLAN_IDS,
  STORED_PLAN_IDS,
  LEGACY_PLAN_ALIASES,
  DEFAULT_PLAN_ID,
  TRIAL_DAYS,
  ACTIVE_WINDOW_DAYS,
  DAY_MS,
  getPlan,
  addInterval
};
