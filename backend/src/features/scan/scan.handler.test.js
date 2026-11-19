jest.mock('../../config/env', () => ({ idempotencySecret: 'test-idempotency-secret' }));
jest.mock('../customers/customer.model', () => ({ findOne: jest.fn(), findById: jest.fn() }));
jest.mock('../stores/store.model', () => ({ updateOne: jest.fn() }));
jest.mock('../memberships/membership.model', () => ({ findOne: jest.fn(), create: jest.fn(), updateOne: jest.fn() }));
jest.mock('../transactions/transaction.model', () => ({ findOne: jest.fn(), create: jest.fn() }));
jest.mock('../redemptions/redemption.model', () => ({ findOne: jest.fn(), findOneAndUpdate: jest.fn() }));
jest.mock('../billing/billing.service', () => ({ assertCanServeCustomer: jest.fn() }));
jest.mock('../billing/billing.notifications', () => ({ notifyIfLimitJustReached: jest.fn() }));
jest.mock('./scan.notifications', () => ({ notifyPointsEarned: jest.fn() }));
jest.mock('../../shared/services/writeAuditLog', () => jest.fn());

const mongoose = require('mongoose');
const AppError = require('../../shared/utils/AppError');
const Customer = require('../customers/customer.model');
const Store = require('../stores/store.model');
const Membership = require('../memberships/membership.model');
const PointTransaction = require('../transactions/transaction.model');
const Redemption = require('../redemptions/redemption.model');
const { assertCanServeCustomer } = require('../billing/billing.service');
const { notifyIfLimitJustReached } = require('../billing/billing.notifications');
const { notifyPointsEarned } = require('./scan.notifications');
const { issueIdempotencyKey } = require('../../shared/services/issueIdempotencyKey');
const { IDEMPOTENCY_KEY_MAX_AGE_MS } = require('../../shared/services/validateIdempotencyKey');
const { earn, redeem } = require('./scan.handler');
const { query, fakeSession, invoke } = require('../../test-utils/handlerHarness');

const STORE_ID = 'store-1';
const CUSTOMER_ID = 'customer-1';
const PIN = '1234';

function makeStore(loyaltyProgram = {}) {
  return {
    _id: STORE_ID,
    status: 'active',
    tillPins: [{ pin: PIN, active: true }, { pin: '9999', active: false }],
    loyaltyProgram: { mode: 'per_currency', pointsPerUnit: 1, minPurchase: 0, ...loyaltyProgram },
    onboardingCompleted: { tillModeTested: true }
  };
}

function earnRequest(body = {}, store = makeStore()) {
  return {
    store,
    auth: { id: 'owner-1' },
    body: {
      customerId: CUSTOMER_ID,
      purchaseAmount: 7.5,
      tillPin: PIN,
      idempotencyKey: issueIdempotencyKey({ customerId: CUSTOMER_ID, storeId: STORE_ID }),
      verificationMethod: 'qr_scan',
      ...body
    }
  };
}

beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(mongoose, 'startSession').mockResolvedValue(fakeSession());
  Customer.findById.mockResolvedValue({ _id: CUSTOMER_ID, name: 'Alex' });
  PointTransaction.findOne.mockResolvedValue(null);
  PointTransaction.create.mockResolvedValue([{}]);
  Membership.findOne.mockReturnValue(query({ _id: 'membership-1', pointsBalance: 10 }));
  Membership.updateOne.mockResolvedValue({});
  assertCanServeCustomer.mockResolvedValue({ addsActiveCustomer: false });
});

afterEach(() => jest.restoreAllMocks());

describe('POST /scan/earn', () => {
  it('adds points for the purchase and records them in the ledger', async () => {
    const req = earnRequest({ purchaseAmount: 7.5 });
    const { body } = await invoke(earn, req);

    expect(body.data).toEqual({ newBalance: 17, pointsAwarded: 7 });
    expect(Membership.updateOne).toHaveBeenCalledWith(
      { _id: 'membership-1' },
      { $set: { pointsBalance: 17, lastActivityAt: expect.any(Date) } },
      expect.anything()
    );
    expect(PointTransaction.create.mock.calls[0][0][0]).toMatchObject({
      storeId: STORE_ID,
      customerId: CUSTOMER_ID,
      type: 'earn',
      points: 7,
      purchaseAmount: 7.5,
      tillPin: PIN,
      idempotencyKey: req.body.idempotencyKey
    });
  });

  it('gives a flat award on per-visit programmes', async () => {
    const { body } = await invoke(earn, earnRequest({ purchaseAmount: 42 }, makeStore({ mode: 'per_visit', fixedPointsPerVisit: 1 })));

    expect(body.data).toMatchObject({ pointsAwarded: 1, newBalance: 11 });
  });

  it('never caps a balance, however large it gets', async () => {
    Membership.findOne.mockReturnValue(query({ _id: 'membership-1', pointsBalance: 999_995 }));

    const { body } = await invoke(earn, earnRequest({ purchaseAmount: 20 }));

    expect(body.data).toEqual({ newBalance: 1_000_015, pointsAwarded: 20 });
  });

  it('creates the membership on a first visit', async () => {
    Membership.findOne.mockReturnValue(query(null));
    Membership.create.mockResolvedValue([{ _id: 'membership-new', pointsBalance: 0 }]);

    const { body } = await invoke(earn, earnRequest({ purchaseAmount: 3 }));

    expect(Membership.create).toHaveBeenCalledWith([{ customerId: CUSTOMER_ID, storeId: STORE_ID }], expect.anything());
    expect(body.data.newBalance).toBe(3);
  });

  it('returns the original result for a retried tap instead of paying out twice', async () => {
    PointTransaction.findOne.mockResolvedValue({ points: 7 });
    Membership.findOne.mockResolvedValue({ pointsBalance: 17 });

    const { body } = await invoke(earn, earnRequest());

    expect(body).toMatchObject({ code: 'DUPLICATE_TRANSACTION', data: { newBalance: 17, pointsAwarded: 7, duplicate: true } });
    expect(Membership.updateOne).not.toHaveBeenCalled();
    expect(PointTransaction.create).not.toHaveBeenCalled();
  });

  it('refuses a forged or mismatched key', async () => {
    const otherCustomersKey = issueIdempotencyKey({ customerId: 'customer-2', storeId: STORE_ID });

    await expect(invoke(earn, earnRequest({ idempotencyKey: otherCustomersKey }))).rejects.toMatchObject({
      code: 'IDEMPOTENCY_KEY_INVALID'
    });
    expect(Membership.updateOne).not.toHaveBeenCalled();
  });

  it('refuses a key older than 24 hours', async () => {
    jest.spyOn(Date, 'now').mockReturnValueOnce(Date.now() - IDEMPOTENCY_KEY_MAX_AGE_MS - 1000);
    const staleKey = issueIdempotencyKey({ customerId: CUSTOMER_ID, storeId: STORE_ID });

    await expect(invoke(earn, earnRequest({ idempotencyKey: staleKey }))).rejects.toMatchObject({
      code: 'IDEMPOTENCY_KEY_EXPIRED'
    });
  });

  it('refuses purchases under the minimum spend', async () => {
    await expect(invoke(earn, earnRequest({ purchaseAmount: 1 }, makeStore({ minPurchase: 3 })))).rejects.toMatchObject({
      code: 'BELOW_MINIMUM_PURCHASE'
    });
    expect(Membership.updateOne).not.toHaveBeenCalled();
  });

  it('refuses a missing, unknown or deactivated employee code', async () => {
    await expect(invoke(earn, earnRequest({ tillPin: undefined }))).rejects.toMatchObject({ code: 'TILL_PIN_REQUIRED' });
    await expect(invoke(earn, earnRequest({ tillPin: '0000' }))).rejects.toMatchObject({ code: 'TILL_PIN_INVALID' });
    await expect(invoke(earn, earnRequest({ tillPin: '9999' }))).rejects.toMatchObject({ code: 'TILL_PIN_INVALID' });
  });

  it('refuses scans at a suspended shop', async () => {
    const store = { ...makeStore(), status: 'suspended' };

    await expect(invoke(earn, earnRequest({}, store))).rejects.toMatchObject({ code: 'STORE_NOT_ACTIVE' });
  });

  it('awards nothing when the shop is at its plan limit', async () => {
    assertCanServeCustomer.mockRejectedValue(new AppError('PLAN_LIMIT_REACHED', 'limit', 403));

    await expect(invoke(earn, earnRequest())).rejects.toMatchObject({ code: 'PLAN_LIMIT_REACHED' });
    expect(Membership.updateOne).not.toHaveBeenCalled();
    expect(PointTransaction.create).not.toHaveBeenCalled();
  });

  it('checks whether the limit was just reached only when a new active customer was added', async () => {
    assertCanServeCustomer.mockResolvedValue({ addsActiveCustomer: true });
    await invoke(earn, earnRequest());
    expect(notifyIfLimitJustReached).toHaveBeenCalledWith(STORE_ID);

    notifyIfLimitJustReached.mockClear();
    assertCanServeCustomer.mockResolvedValue({ addsActiveCustomer: false });
    await invoke(earn, earnRequest());
    expect(notifyIfLimitJustReached).not.toHaveBeenCalled();
  });

  it('emails the customer what they earned, but not on a retried tap', async () => {
    await invoke(earn, earnRequest({ purchaseAmount: 7.5 }));
    expect(notifyPointsEarned).toHaveBeenCalledWith({
      customer: expect.objectContaining({ _id: CUSTOMER_ID }),
      store: expect.objectContaining({ _id: STORE_ID }),
      newBalance: 17,
      pointsAwarded: 7
    });

    notifyPointsEarned.mockClear();
    PointTransaction.findOne.mockResolvedValue({ points: 7 });
    Membership.findOne.mockResolvedValue({ pointsBalance: 17 });
    await invoke(earn, earnRequest());
    expect(notifyPointsEarned).not.toHaveBeenCalled();
  });

  it('marks till mode as tested on the first real scan', async () => {
    const store = { ...makeStore(), onboardingCompleted: { tillModeTested: false } };
    await invoke(earn, earnRequest({}, store));

    expect(Store.updateOne).toHaveBeenCalledWith(
      { _id: STORE_ID },
      { $set: { 'onboardingCompleted.tillModeTested': true } },
      expect.anything()
    );
  });
});

describe('POST /scan/redeem', () => {
  const redeemRequest = (body = {}) => ({
    store: makeStore(),
    auth: { id: 'owner-1' },
    body: { redemptionCode: 'CODE-1', tillPin: PIN, ...body }
  });
  const pending = (overrides = {}) => ({
    _id: 'redemption-1',
    status: 'pending',
    expiresAt: new Date(Date.now() + 60_000),
    rewardId: 'reward-1',
    pointsSpent: 50,
    ...overrides
  });

  it('fulfils a pending code once', async () => {
    Redemption.findOne.mockResolvedValue(pending());
    Redemption.findOneAndUpdate.mockResolvedValue({ ...pending(), status: 'fulfilled' });

    const { body } = await invoke(redeem, redeemRequest());

    expect(body.data).toEqual({ redemptionId: 'redemption-1', rewardId: 'reward-1', pointsSpent: 50 });
    expect(Redemption.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'redemption-1', status: 'pending', expiresAt: { $gt: expect.any(Date) } },
      { $set: expect.objectContaining({ status: 'fulfilled', tillPin: PIN }) },
      { new: true }
    );
  });

  it('only looks up codes issued by this shop', async () => {
    Redemption.findOne.mockResolvedValue(null);

    await expect(invoke(redeem, redeemRequest())).rejects.toMatchObject({ code: 'REDEMPTION_NOT_FOUND' });
    expect(Redemption.findOne).toHaveBeenCalledWith({ redemptionCode: 'CODE-1', storeId: STORE_ID });
  });

  it.each([
    ['fulfilled', 'REDEMPTION_ALREADY_USED'],
    ['cancelled', 'REDEMPTION_CANCELLED']
  ])('refuses a %s code', async (status, code) => {
    Redemption.findOne.mockResolvedValue(pending({ status }));

    await expect(invoke(redeem, redeemRequest())).rejects.toMatchObject({ code });
    expect(Redemption.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('refuses an expired code', async () => {
    Redemption.findOne.mockResolvedValue(pending({ expiresAt: new Date(Date.now() - 1000) }));

    await expect(invoke(redeem, redeemRequest())).rejects.toMatchObject({ code: 'REDEMPTION_EXPIRED' });
  });

  it('refuses the second of two simultaneous redemptions', async () => {
    Redemption.findOne.mockResolvedValue(pending());
    Redemption.findOneAndUpdate.mockResolvedValue(null);

    await expect(invoke(redeem, redeemRequest())).rejects.toMatchObject({ code: 'REDEMPTION_ALREADY_USED' });
  });

  it('needs a valid employee code', async () => {
    await expect(invoke(redeem, redeemRequest({ tillPin: '0000' }))).rejects.toMatchObject({ code: 'TILL_PIN_INVALID' });
    expect(Redemption.findOne).not.toHaveBeenCalled();
  });
});
