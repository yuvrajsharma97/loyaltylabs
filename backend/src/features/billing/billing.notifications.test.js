jest.mock('../../shared/services/sendEmail', () => jest.fn());
jest.mock('../stores/store.model', () => ({ findById: jest.fn() }));
jest.mock('../auth/auth.model', () => ({ findById: jest.fn() }));
jest.mock('./billing.model', () => ({
  StoreBilling: { findOne: jest.fn(), find: jest.fn(), findOneAndUpdate: jest.fn(), updateOne: jest.fn() }
}));
// Every real plan is unlimited, so the limit machinery is tested against a
// stand-in capped plan.
jest.mock('./billing.plans', () => {
  const PLANS = {
    capped: { id: 'capped', name: 'Capped', price: 1, interval: 'month', customerLimit: 50 },
    open: { id: 'open', name: 'Open', price: 1, interval: 'month', customerLimit: null }
  };
  return { PLANS, getPlan: (planId) => PLANS[planId] || null };
});
jest.mock('./billing.service', () => ({ countActiveCustomers: jest.fn() }));

const cron = require('node-cron');
const sendEmail = require('../../shared/services/sendEmail');
const Store = require('../stores/store.model');
const User = require('../auth/auth.model');
const { StoreBilling } = require('./billing.model');
const { countActiveCustomers } = require('./billing.service');
const { notifyIfLimitJustReached, sendScheduledLimitReminders } = require('./billing.notifications');
const { PLAN_LIMIT_REMINDER_CRON, TIME_ZONE } = require('../../jobs/scheduler');

const billing = (overrides = {}) => ({
  _id: 'billing-1',
  storeId: 'store-1',
  plan: 'capped',
  status: 'active',
  activeWindowDays: 90,
  limitReachedAt: null,
  ...overrides
});

beforeEach(() => {
  jest.resetAllMocks();
  Store.findById.mockResolvedValue({ name: 'Rye & Co.', ownerUserId: 'owner-1' });
  User.findById.mockResolvedValue({ name: 'Sam', email: 'sam@example.test' });
  StoreBilling.updateOne.mockResolvedValue({});
});

describe('notifyIfLimitJustReached (immediate email)', () => {
  it('emails the owner the moment the store hits its limit', async () => {
    StoreBilling.findOne.mockResolvedValue(billing());
    countActiveCustomers.mockResolvedValue(50);
    StoreBilling.findOneAndUpdate.mockResolvedValue(billing({ limitReachedAt: new Date() }));

    await notifyIfLimitJustReached('store-1');

    expect(StoreBilling.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'billing-1', limitReachedAt: null },
      expect.anything(),
      expect.anything()
    );
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail.mock.calls[0][0]).toMatchObject({
      to: 'sam@example.test',
      subject: 'Rye & Co. has reached its 50 customer limit'
    });
  });

  it('does not email again if the limit was already reached and notified', async () => {
    StoreBilling.findOne.mockResolvedValue(billing({ limitReachedAt: new Date() }));
    countActiveCustomers.mockResolvedValue(50);
    StoreBilling.findOneAndUpdate.mockResolvedValue(null);

    await notifyIfLimitJustReached('store-1');

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('does nothing below the limit', async () => {
    StoreBilling.findOne.mockResolvedValue(billing());
    countActiveCustomers.mockResolvedValue(49);

    await notifyIfLimitJustReached('store-1');

    expect(StoreBilling.findOneAndUpdate).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('never throws, even when the email fails', async () => {
    StoreBilling.findOne.mockResolvedValue(billing());
    countActiveCustomers.mockResolvedValue(50);
    StoreBilling.findOneAndUpdate.mockResolvedValue(billing());
    sendEmail.mockRejectedValue(new Error('Resend down'));
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(notifyIfLimitJustReached('store-1')).resolves.toBeUndefined();
  });
});

describe('sendScheduledLimitReminders (9:30 / 21:30 run)', () => {
  it('emails stores at the limit and clears stores back under it', async () => {
    StoreBilling.find.mockResolvedValue([
      billing({ _id: 'at-limit', storeId: 'store-a', limitReachedAt: new Date() }),
      billing({ _id: 'recovered', storeId: 'store-b', limitReachedAt: new Date() }),
      billing({ _id: 'fine', storeId: 'store-c' })
    ]);
    countActiveCustomers.mockImplementation(async (storeId) => ({ 'store-a': 52, 'store-b': 40, 'store-c': 10 })[storeId]);

    const summary = await sendScheduledLimitReminders();

    expect(summary).toEqual({ checked: 3, emailed: 1, cleared: 1 });
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(StoreBilling.updateOne).toHaveBeenCalledWith({ _id: 'recovered' }, { $set: { limitReachedAt: null } });
  });

  it('only looks at limited plans on stores that can scan', async () => {
    StoreBilling.find.mockResolvedValue([]);

    await sendScheduledLimitReminders();

    expect(StoreBilling.find).toHaveBeenCalledWith({
      plan: { $in: ['capped'] },
      status: { $in: ['trialing', 'active', 'past_due'] }
    });
  });
});

describe('schedule', () => {
  it('runs at 09:30 and 21:30 UK time', () => {
    expect(PLAN_LIMIT_REMINDER_CRON).toBe('30 9,21 * * *');
    expect(cron.validate(PLAN_LIMIT_REMINDER_CRON)).toBe(true);
    expect(TIME_ZONE).toBe('Europe/London');
  });
});
