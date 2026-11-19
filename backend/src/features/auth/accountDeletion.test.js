jest.mock('../customers/customer.model', () => ({ updateOne: jest.fn() }));
jest.mock('./auth.model', () => ({ updateOne: jest.fn(), findById: jest.fn() }));
jest.mock('./refreshToken.model', () => ({ updateMany: jest.fn() }));
jest.mock('./deletedAccount.model', () => {
  const model = { create: jest.fn() };
  model.RETENTION_DAYS = 183;
  return model;
});
jest.mock('../stores/store.model', () => ({ find: jest.fn(), updateMany: jest.fn() }));
jest.mock('../memberships/membership.model', () => ({ updateMany: jest.fn() }));
jest.mock('../billing/billing.model', () => ({ StoreBilling: { updateMany: jest.fn() } }));
jest.mock('../redemptions/redemption.service', () => ({ cancelPendingRedemptions: jest.fn() }));

const mongoose = require('mongoose');
const Customer = require('../customers/customer.model');
const User = require('./auth.model');
const RefreshToken = require('./refreshToken.model');
const DeletedAccount = require('./deletedAccount.model');
const Store = require('../stores/store.model');
const Membership = require('../memberships/membership.model');
const { StoreBilling } = require('../billing/billing.model');
const { cancelPendingRedemptions } = require('../redemptions/redemption.service');
const { deleteCustomerAccount, deleteStoreOwnerAccount } = require('./accountDeletion.service');
const { fakeSession } = require('../../test-utils/handlerHarness');

const NOW = new Date('2026-11-11T12:00:00Z');
const SIX_MONTHS = new Date('2027-05-13T12:00:00Z'); // NOW + 183 days

beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(mongoose, 'startSession').mockResolvedValue(fakeSession());
});

afterEach(() => jest.restoreAllMocks());

describe('deleteCustomerAccount', () => {
  const customer = {
    _id: 'cust-1',
    name: 'Alex Smith',
    email: 'alex@example.test',
    phone: '07700900123',
    googleId: 'g-123',
    avatarUrl: 'https://img',
    username: 'alex',
    slug: 'alex-smith'
  };

  it('holds the personal details for six months only', async () => {
    await deleteCustomerAccount(customer, NOW);

    const [[record]] = DeletedAccount.create.mock.calls[0];
    expect(record).toMatchObject({
      accountType: 'customer',
      accountId: 'cust-1',
      role: 'customer',
      personalDetails: { name: 'Alex Smith', email: 'alex@example.test', phone: '07700900123', googleId: 'g-123' },
      deletedAt: NOW,
      purgeAt: SIX_MONTHS
    });
  });

  it('anonymises the live record so nothing identifies them', async () => {
    await deleteCustomerAccount(customer, NOW);

    const [filter, update] = Customer.updateOne.mock.calls[0];
    expect(filter).toEqual({ _id: 'cust-1' });
    expect(update.$set).toMatchObject({
      name: 'Deleted customer',
      email: 'deleted-cust-1@deleted.invalid',
      slug: 'deleted-cust-1',
      username: 'deleted-cust-1',
      deletedAt: NOW
    });
    // New QR token, so the old printed/saved QR stops working.
    expect(update.$set.qrCodeToken).toMatch(/^[0-9a-f]{64}$/);
    expect(Object.keys(update.$unset)).toEqual(expect.arrayContaining(['phone', 'passwordHash', 'googleId', 'avatarUrl']));
    expect(JSON.stringify(update)).not.toMatch(/Alex|alex@|07700|g-123/);
  });

  it('cancels pending reward codes, frees their plan slots and signs them out', async () => {
    await deleteCustomerAccount(customer, NOW);

    expect(cancelPendingRedemptions).toHaveBeenCalledWith({ customerId: 'cust-1' }, expect.objectContaining({ refund: false }));
    expect(Membership.updateMany).toHaveBeenCalledWith({ customerId: 'cust-1' }, { $set: { lastActivityAt: null } }, expect.anything());
    expect(RefreshToken.updateMany).toHaveBeenCalledWith(
      { userId: 'cust-1', userType: 'customer' },
      { $set: { revoked: true } },
      expect.anything()
    );
  });
});

describe('deleteStoreOwnerAccount', () => {
  const owner = { _id: 'owner-1', name: 'Sam Lee', email: 'sam@example.test', phone: '07700900999' };

  beforeEach(() => {
    Store.find.mockReturnValue({ select: () => Promise.resolve([{ _id: 'store-1' }]) });
  });

  it('closes the shop for good, refunds pending codes and stops billing', async () => {
    const result = await deleteStoreOwnerAccount(owner, NOW);

    expect(result).toEqual({ closedStoreIds: ['store-1'] });
    expect(cancelPendingRedemptions).toHaveBeenCalledWith({ storeId: { $in: ['store-1'] } }, expect.objectContaining({ refund: true }));
    expect(Store.updateMany).toHaveBeenCalledWith(
      { _id: { $in: ['store-1'] } },
      { $set: { status: 'closed', closedAt: NOW, discoverable: false, 'tillPins.$[].active': false } },
      expect.anything()
    );
    expect(StoreBilling.updateMany).toHaveBeenCalledWith(
      { storeId: { $in: ['store-1'] } },
      { $set: { status: 'cancelled', limitReachedAt: null } },
      expect.anything()
    );
  });

  it('anonymises the owner and keeps their details for six months', async () => {
    await deleteStoreOwnerAccount(owner, NOW);

    expect(DeletedAccount.create.mock.calls[0][0][0]).toMatchObject({
      accountType: 'user',
      role: 'store_owner',
      storeIds: ['store-1'],
      personalDetails: { email: 'sam@example.test' },
      purgeAt: SIX_MONTHS
    });
    const update = User.updateOne.mock.calls[0][1];
    expect(update.$set).toMatchObject({ name: 'Deleted shop owner', email: 'deleted-owner-1@deleted.invalid' });
    expect(update.$unset).toHaveProperty('phone');
    expect(RefreshToken.updateMany).toHaveBeenCalledWith({ userId: 'owner-1', userType: 'user' }, { $set: { revoked: true } }, expect.anything());
  });
});
