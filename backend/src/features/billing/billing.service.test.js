jest.mock('../memberships/membership.model', () => ({ countDocuments: jest.fn() }));
jest.mock('./billing.model', () => ({ StoreBilling: { findOne: jest.fn() } }));

const Membership = require('../memberships/membership.model');
const { StoreBilling } = require('./billing.model');
const { assertCanServeCustomer, describeBilling, newTrialBilling } = require('./billing.service');
const { PLANS, TRIAL_DAYS, DAY_MS, getPlan } = require('./billing.plans');

// Mongoose queries are chained with .session(); resolve to `value` from it.
const query = (value) => ({ session: () => Promise.resolve(value) });

function givenBilling(billing) {
  StoreBilling.findOne.mockReturnValue(query(billing));
}

function givenActiveCount(count) {
  Membership.countDocuments.mockReturnValue(query(count));
}

const STORE_ID = 'store-1';
const longAgo = () => new Date(Date.now() - 200 * DAY_MS);

beforeEach(() => jest.resetAllMocks());

describe('assertCanServeCustomer (every plan is unlimited)', () => {
  it.each(['one_shop', 'three_shops', 'five_shops'])('never refuses a new customer on %s', async (plan) => {
    givenBilling({ plan, activeWindowDays: 90 });
    givenActiveCount(5000);

    await expect(assertCanServeCustomer(STORE_ID, null)).resolves.toEqual({ addsActiveCustomer: false });
  });

  it.each(['weekly', 'monthly', 'unlimited'])('treats the retired %s plan as unlimited', async (plan) => {
    givenBilling({ plan, activeWindowDays: 90 });
    givenActiveCount(5000);

    await expect(assertCanServeCustomer(STORE_ID, { lastActivityAt: longAgo() })).resolves.toEqual({ addsActiveCustomer: false });
  });

  it('does not limit stores with no billing record', async () => {
    givenBilling(null);

    await expect(assertCanServeCustomer(STORE_ID, null)).resolves.toEqual({ addsActiveCustomer: false });
  });
});

describe('plans', () => {
  it('prices the three tiers by number of shops, all monthly and unlimited', () => {
    expect(Object.values(PLANS).map(({ id, price, interval, shopLimit, customerLimit }) => ({ id, price, interval, shopLimit, customerLimit }))).toEqual([
      { id: 'one_shop', price: 5.99, interval: 'month', shopLimit: 1, customerLimit: null },
      { id: 'three_shops', price: 15.99, interval: 'month', shopLimit: 3, customerLimit: null },
      { id: 'five_shops', price: 25.99, interval: 'month', shopLimit: 5, customerLimit: null }
    ]);
  });

  it('maps retired plan ids to the 1-shop plan', () => {
    expect(getPlan('monthly').id).toBe('one_shop');
    expect(getPlan('nope')).toBeNull();
  });
});

describe('newTrialBilling', () => {
  it('starts a six-week trial on the chosen plan', () => {
    const now = new Date('2026-11-16T09:00:00Z');
    const billing = newTrialBilling(STORE_ID, 'three_shops', now);

    expect(billing).toMatchObject({ storeId: STORE_ID, plan: 'three_shops', status: 'trialing' });
    expect(TRIAL_DAYS).toBe(42);
    expect(billing.trialEndsAt.getTime() - now.getTime()).toBe(42 * DAY_MS);
    expect(billing.currentBillingPeriodEnd).toEqual(billing.trialEndsAt);
  });
});

describe('describeBilling', () => {
  const trialEndsAt = new Date('2026-12-28T09:00:00Z');

  it('charges nothing during the trial and never reports a limit', async () => {
    givenActiveCount(5000);
    const usage = await describeBilling({ storeId: STORE_ID, plan: 'one_shop', status: 'trialing', trialEndsAt, activeWindowDays: 90 });

    expect(usage).toMatchObject({ price: 5.99, amountDue: 0, shopLimit: 1, customerLimit: null, limitReached: false, nextChargeAt: trialEndsAt });
  });

  it('charges the flat plan price once active', async () => {
    givenActiveCount(12);
    const periodEnd = new Date('2026-12-01T00:00:00Z');
    const usage = await describeBilling({
      storeId: STORE_ID,
      plan: 'five_shops',
      status: 'active',
      trialEndsAt,
      activeWindowDays: 90,
      currentBillingPeriodEnd: periodEnd
    });

    expect(usage).toMatchObject({ price: 25.99, interval: 'month', shopLimit: 5, amountDue: 25.99, limitReached: false, nextChargeAt: periodEnd });
  });
});
