jest.mock('./redemption.model', () => ({ findById: jest.fn(), findOneAndUpdate: jest.fn(), create: jest.fn() }));
jest.mock('../rewards/reward.model', () => ({ findById: jest.fn() }));
jest.mock('../stores/store.model', () => ({ findById: jest.fn() }));
jest.mock('../memberships/membership.model', () => ({ findOne: jest.fn(), findOneAndUpdate: jest.fn(), updateOne: jest.fn() }));
jest.mock('../transactions/transaction.model', () => ({ create: jest.fn() }));
jest.mock('../customers/customer.model', () => ({ findById: jest.fn() }));

const mongoose = require('mongoose');
const Redemption = require('./redemption.model');
const Reward = require('../rewards/reward.model');
const Store = require('../stores/store.model');
const Membership = require('../memberships/membership.model');
const PointTransaction = require('../transactions/transaction.model');
const Customer = require('../customers/customer.model');
const { initiate, cancel } = require('./redemption.handler');
const { fakeSession, invoke } = require('../../test-utils/handlerHarness');

const REWARD_ID = new mongoose.Types.ObjectId().toString();
const REDEMPTION_ID = new mongoose.Types.ObjectId().toString();
const STORE_ID = 'store-1';
const CUSTOMER_ID = 'customer-1';
const OWNER_ID = 'owner-1';

const reward = (overrides = {}) => ({
  _id: REWARD_ID,
  storeId: STORE_ID,
  pointsRequired: 50,
  active: true,
  deleted: false,
  validFrom: new Date(Date.now() - 60_000),
  validTo: null,
  ...overrides
});

beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(mongoose, 'startSession').mockResolvedValue(fakeSession());
  Customer.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ emailVerified: true }) });
  Reward.findById.mockResolvedValue(reward());
  Store.findById.mockResolvedValue({ _id: STORE_ID, status: 'active', ownerUserId: OWNER_ID });
  Membership.findOne.mockResolvedValue({ _id: 'membership-1', pointsBalance: 80 });
  Membership.findOneAndUpdate.mockResolvedValue({ _id: 'membership-1', pointsBalance: 30 });
  Redemption.create.mockImplementation(async ([doc]) => [{ _id: REDEMPTION_ID, ...doc }]);
  PointTransaction.create.mockResolvedValue([{}]);
});

afterEach(() => jest.restoreAllMocks());

describe('POST /redeem/initiate', () => {
  const request = () => ({ auth: { id: CUSTOMER_ID }, body: { rewardId: REWARD_ID } });

  it('takes the points and issues a code valid for a year', async () => {
    const { status, body } = await invoke(initiate, request());

    expect(status).toBe(201);
    expect(body.data.pointsSpent).toBe(50);
    expect(body.data.expiresAt.getTime() - Date.now()).toBeGreaterThan(364 * 24 * 60 * 60 * 1000);
    expect(Membership.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'membership-1', pointsBalance: { $gte: 50 } },
      { $inc: { pointsBalance: -50 }, $set: { lastActivityAt: expect.any(Date) } },
      expect.anything()
    );
    expect(PointTransaction.create.mock.calls[0][0][0]).toMatchObject({
      type: 'redeem',
      points: -50,
      relatedRedemptionId: REDEMPTION_ID
    });
  });

  it('refuses customers who have not verified their email, without taking points', async () => {
    Customer.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ emailVerified: false }) });

    await expect(invoke(initiate, request())).rejects.toMatchObject({ code: 'EMAIL_NOT_VERIFIED' });
    expect(Membership.findOneAndUpdate).not.toHaveBeenCalled();
    expect(Redemption.create).not.toHaveBeenCalled();
  });

  it('refuses when the customer has too few points', async () => {
    Membership.findOne.mockResolvedValue({ _id: 'membership-1', pointsBalance: 49 });

    await expect(invoke(initiate, request())).rejects.toMatchObject({ code: 'INSUFFICIENT_POINTS' });
    expect(Membership.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('refuses customers who have never visited the shop', async () => {
    Membership.findOne.mockResolvedValue(null);

    await expect(invoke(initiate, request())).rejects.toMatchObject({ code: 'INSUFFICIENT_POINTS' });
  });

  it('never lets two simultaneous spends take the balance below zero', async () => {
    Membership.findOneAndUpdate.mockResolvedValue(null);

    await expect(invoke(initiate, request())).rejects.toMatchObject({ code: 'INSUFFICIENT_POINTS' });
    expect(Redemption.create).not.toHaveBeenCalled();
    expect(PointTransaction.create).not.toHaveBeenCalled();
  });

  it.each([
    ['deleted', { deleted: true }, 'REWARD_NOT_FOUND'],
    ['switched off', { active: false }, 'REWARD_NOT_ACTIVE'],
    ['past its end date', { validTo: new Date(Date.now() - 1000) }, 'REWARD_NOT_ACTIVE'],
    ['not started yet', { validFrom: new Date(Date.now() + 60_000) }, 'REWARD_NOT_YET_VALID']
  ])('refuses a reward that is %s', async (_label, overrides, code) => {
    Reward.findById.mockResolvedValue(reward(overrides));

    await expect(invoke(initiate, request())).rejects.toMatchObject({ code });
    expect(Membership.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('refuses rewards from a suspended shop', async () => {
    Store.findById.mockResolvedValue({ _id: STORE_ID, status: 'suspended' });

    await expect(invoke(initiate, request())).rejects.toMatchObject({ code: 'STORE_SUSPENDED' });
  });

  it('treats a malformed reward id as not found', async () => {
    await expect(invoke(initiate, { auth: { id: CUSTOMER_ID }, body: { rewardId: 'nope' } })).rejects.toMatchObject({
      code: 'REWARD_NOT_FOUND'
    });
    expect(Reward.findById).not.toHaveBeenCalled();
  });
});

describe('POST /redeem/:id/cancel', () => {
  const request = (ownerId = OWNER_ID) => ({ auth: { id: ownerId }, params: { id: REDEMPTION_ID } });
  const pending = (overrides = {}) => ({
    _id: REDEMPTION_ID,
    storeId: STORE_ID,
    customerId: CUSTOMER_ID,
    status: 'pending',
    pointsSpent: 50,
    ...overrides
  });

  beforeEach(() => {
    Redemption.findById.mockResolvedValue(pending());
    Redemption.findOneAndUpdate.mockResolvedValue(pending({ status: 'cancelled' }));
    Membership.updateOne.mockResolvedValue({});
  });

  it("gives the points back and records a reversal", async () => {
    const { body } = await invoke(cancel, request());

    expect(body.data).toEqual({ cancelled: true, pointsRestored: 50 });
    expect(Membership.updateOne).toHaveBeenCalledWith(
      { customerId: CUSTOMER_ID, storeId: STORE_ID },
      { $inc: { pointsBalance: 50 } },
      expect.anything()
    );
    expect(PointTransaction.create.mock.calls[0][0][0]).toMatchObject({ type: 'reversal', points: 50 });
  });

  it("only lets the shop's owner cancel", async () => {
    await expect(invoke(cancel, request('someone-else'))).rejects.toMatchObject({ code: 'CANCEL_NOT_AUTHORISED' });
    expect(Membership.updateOne).not.toHaveBeenCalled();
  });

  it('refuses to cancel a code already used at the till', async () => {
    Redemption.findById.mockResolvedValue(pending({ status: 'fulfilled' }));

    await expect(invoke(cancel, request())).rejects.toMatchObject({ code: 'REDEMPTION_ALREADY_USED' });
    expect(Membership.updateOne).not.toHaveBeenCalled();
  });

  it('does not refund if the code was used while the cancel was in flight', async () => {
    Redemption.findOneAndUpdate.mockResolvedValue(null);

    await expect(invoke(cancel, request())).rejects.toMatchObject({ code: 'REDEMPTION_ALREADY_USED' });
    expect(Membership.updateOne).not.toHaveBeenCalled();
    expect(PointTransaction.create).not.toHaveBeenCalled();
  });
});
