jest.mock('google-auth-library', () => ({ OAuth2Client: jest.fn() }));
jest.mock('../../shared/services/sendEmail', () => jest.fn());
jest.mock('../../shared/services/writeAuditLog', () => jest.fn());
jest.mock('./auth.model', () => ({ findById: jest.fn() }));
jest.mock('../customers/customer.model', () => ({ findById: jest.fn() }));
jest.mock('./accountDeletion.service', () => ({
  deleteCustomerAccount: jest.fn(),
  deleteStoreOwnerAccount: jest.fn(),
  RETENTION_DAYS: 183
}));

const bcrypt = require('bcryptjs');
const sendEmail = require('../../shared/services/sendEmail');
const writeAuditLog = require('../../shared/services/writeAuditLog');
const User = require('./auth.model');
const Customer = require('../customers/customer.model');
const { deleteCustomerAccount, deleteStoreOwnerAccount } = require('./accountDeletion.service');
const { deleteAccount } = require('./auth.handler');
const { invoke } = require('../../test-utils/handlerHarness');

let passwordHash;
beforeAll(async () => {
  passwordHash = await bcrypt.hash('Correct-horse-1', 4);
});

beforeEach(() => {
  jest.resetAllMocks();
  sendEmail.mockResolvedValue();
  deleteStoreOwnerAccount.mockResolvedValue({ closedStoreIds: ['store-1'] });
});

const customerReq = (body) => ({ auth: { id: 'cust-1', type: 'customer', role: 'customer' }, body });
const ownerReq = (body) => ({ auth: { id: 'owner-1', type: 'user', role: 'store_owner' }, body });

describe('DELETE /auth/account', () => {
  it('deletes a customer once the password is confirmed, then emails them', async () => {
    const customer = { _id: 'cust-1', name: 'Alex', email: 'alex@example.test', passwordHash };
    Customer.findById.mockResolvedValue(customer);

    const { body } = await invoke(deleteAccount, customerReq({ password: 'Correct-horse-1' }));

    expect(body.data).toEqual({ deleted: true, closedStoreCount: 0 });
    expect(deleteCustomerAccount).toHaveBeenCalledWith(customer);
    expect(sendEmail.mock.calls[0][0]).toMatchObject({ to: 'alex@example.test', subject: 'Your LoyaltyLabs account has been deleted' });
  });

  it('refuses a wrong or missing password', async () => {
    Customer.findById.mockResolvedValue({ _id: 'cust-1', email: 'alex@example.test', passwordHash });

    await expect(invoke(deleteAccount, customerReq({ password: 'nope' }))).rejects.toMatchObject({ code: 'CURRENT_PASSWORD_INCORRECT' });
    await expect(invoke(deleteAccount, customerReq({}))).rejects.toMatchObject({ code: 'CURRENT_PASSWORD_REQUIRED' });
    expect(deleteCustomerAccount).not.toHaveBeenCalled();
  });

  it('asks a Google-only customer to type their email instead', async () => {
    Customer.findById.mockResolvedValue({ _id: 'cust-1', email: 'alex@example.test' });

    await expect(invoke(deleteAccount, customerReq({ confirmEmail: 'other@example.test' }))).rejects.toMatchObject({
      code: 'DELETE_CONFIRMATION_MISMATCH'
    });
    await invoke(deleteAccount, customerReq({ confirmEmail: 'alex@example.test' }));
    expect(deleteCustomerAccount).toHaveBeenCalledTimes(1);
  });

  it('closes the shop when an owner deletes, and audits it per shop', async () => {
    User.findById.mockResolvedValue({ _id: 'owner-1', name: 'Sam', email: 'sam@example.test', passwordHash });

    const { body } = await invoke(deleteAccount, ownerReq({ password: 'Correct-horse-1' }));

    expect(body.data).toEqual({ deleted: true, closedStoreCount: 1 });
    expect(writeAuditLog).toHaveBeenCalledWith(expect.objectContaining({ storeId: 'store-1', action: 'store.closed_by_owner' }));
  });

  it('never lets an admin delete themselves here', async () => {
    const req = { auth: { id: 'admin-1', type: 'user', role: 'super_admin' }, body: { password: 'x' } };

    await expect(invoke(deleteAccount, req)).rejects.toMatchObject({ code: 'ACCOUNT_DELETE_NOT_ALLOWED' });
    expect(User.findById).not.toHaveBeenCalled();
  });

  it('treats an already-deleted account as gone', async () => {
    Customer.findById.mockResolvedValue({ _id: 'cust-1', deletedAt: new Date() });

    await expect(invoke(deleteAccount, customerReq({ password: 'x' }))).rejects.toMatchObject({ code: 'ACCOUNT_NOT_FOUND' });
  });

  it('still succeeds if the confirmation email fails', async () => {
    Customer.findById.mockResolvedValue({ _id: 'cust-1', email: 'alex@example.test', passwordHash });
    sendEmail.mockRejectedValue(new Error('Resend down'));
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(invoke(deleteAccount, customerReq({ password: 'Correct-horse-1' }))).resolves.toMatchObject({
      body: { data: { deleted: true } }
    });
  });
});
