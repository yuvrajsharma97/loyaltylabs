// Mirrors backend/src/features/billing/billing.plans.js - keep the two in step.
// Prices are GBP excluding VAT. Plans differ by how many shops they cover;
// every plan has unlimited customers (customerLimit null).
export const PLANS = [
  { id: 'one_shop', name: '1 Shop', price: 5.99, interval: 'month', shopLimit: 1, customerLimit: null },
  { id: 'three_shops', name: '3 Shops', price: 15.99, interval: 'month', shopLimit: 3, customerLimit: null },
  { id: 'five_shops', name: '5 Shops', price: 25.99, interval: 'month', shopLimit: 5, customerLimit: null },
];

// Retired plan ids still found on older billing history.
const LEGACY_PLAN_ALIASES = { weekly: 'one_shop', monthly: 'one_shop', unlimited: 'one_shop' };

export const TRIAL_WEEKS = 6;

export const DEFAULT_PLAN_ID = 'one_shop';

export function findPlan(planId) {
  const id = LEGACY_PLAN_ALIASES[planId] || planId;
  return PLANS.find((plan) => plan.id === id) || null;
}

export function formatPlanPrice(plan) {
  return `£${Number.isInteger(plan.price) ? plan.price : plan.price.toFixed(2)} / ${plan.interval}`;
}

export function formatPlanShops(plan) {
  return plan.shopLimit === 1 ? '1 shop' : `Up to ${plan.shopLimit} shops`;
}

export function formatPlanLimit(plan) {
  const customers = plan.customerLimit === null ? 'unlimited customers' : `up to ${plan.customerLimit} active customers`;
  return `${formatPlanShops(plan)}, ${customers}`;
}
