const mockVerifyIdToken = jest.fn();
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn(() => ({ verifyIdToken: (...args) => mockVerifyIdToken(...args) }))
}));
jest.mock('../../shared/services/sendEmail', () => jest.fn());
jest.mock('../../shared/services/tokenService', () => ({
  signAccessToken: jest.fn(() => 'access-token'),
  signRefreshToken: jest.fn(() => 'refresh-token'),
  verifyRefreshToken: jest.fn()
}));
jest.mock('../../shared/utils/qrSigning', () => ({
  generateQrSalt: jest.fn(() => 'salt'),
  generateQrCodeToken: jest.fn(() => 'qr-token')
}));
jest.mock('./refreshToken.model', () => ({ create: jest.fn() }));
jest.mock('../customers/customer.model', () => ({ findOne: jest.fn(), create: jest.fn() }));

const sendEmail = require('../../shared/services/sendEmail');
const RefreshToken = require('./refreshToken.model');
const tokenService = require('../../shared/services/tokenService');
const qrSigning = require('../../shared/utils/qrSigning');
const Customer = require('../customers/customer.model');
const { google } = require('./auth.handler');
const { invoke } = require('../../test-utils/handlerHarness');

const GOOGLE_SUB = 'google-sub-1';
const EMAIL = 'sam@example.test';

function googleSays({ emailVerified }) {
  mockVerifyIdToken.mockResolvedValue({
    getPayload: () => ({ sub: GOOGLE_SUB, email: EMAIL, email_verified: emailVerified, name: 'Sam' })
  });
}

function customerDoc(overrides = {}) {
  const doc = { _id: 'cust-1', name: 'Sam', email: EMAIL, emailVerified: true, authProvider: 'local', ...overrides };
  doc.save = jest.fn().mockResolvedValue(doc);
  return doc;
}

const request = () => ({ body: { idToken: 'id-token' } });
const sentSubjects = () => sendEmail.mock.calls.map(([email]) => email.subject.toLowerCase());

beforeEach(() => {
  jest.resetAllMocks();
  sendEmail.mockResolvedValue({});
  RefreshToken.create.mockResolvedValue({});
  tokenService.signAccessToken.mockReturnValue('access-token');
  tokenService.signRefreshToken.mockReturnValue('refresh-token');
  qrSigning.generateQrSalt.mockReturnValue('salt');
  qrSigning.generateQrCodeToken.mockReturnValue('qr-token');
  Customer.findOne.mockResolvedValue(null);
});

describe('POST /auth/google', () => {
  it('signs a new customer straight in when Google has confirmed their email', async () => {
    googleSays({ emailVerified: true });
    Customer.create.mockResolvedValue(customerDoc({ authProvider: 'google' }));

    const { body } = await invoke(google, request());

    expect(Customer.create.mock.calls[0][0]).toMatchObject({ email: EMAIL, emailVerified: true });
    expect(body.data).toMatchObject({ accessToken: 'access-token', role: 'customer' });
  });

  it('makes a new customer verify by email first when Google has not confirmed it', async () => {
    googleSays({ emailVerified: false });
    const created = customerDoc({ authProvider: 'google', emailVerified: false });
    Customer.create.mockResolvedValue(created);

    await expect(invoke(google, request())).rejects.toMatchObject({
      code: 'EMAIL_NOT_VERIFIED',
      details: { email: EMAIL }
    });

    expect(created.emailVerificationToken).toEqual(expect.any(String));
    expect(created.save).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: EMAIL }));
    expect(sendEmail.mock.calls[0][0].text).toContain('/verify-email?token=');
    expect(RefreshToken.create).not.toHaveBeenCalled(); // not signed in
  });

  it('keeps an unverified Google customer out until they follow the link', async () => {
    googleSays({ emailVerified: false });
    Customer.findOne.mockResolvedValueOnce(customerDoc({ googleId: GOOGLE_SUB, authProvider: 'google', emailVerified: false }));

    await expect(invoke(google, request())).rejects.toMatchObject({ code: 'EMAIL_NOT_VERIFIED' });
    expect(RefreshToken.create).not.toHaveBeenCalled();
  });

  it('never links an unconfirmed Google email to an existing account', async () => {
    googleSays({ emailVerified: false });
    const existing = customerDoc({ emailVerified: true });
    Customer.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(existing);

    await expect(invoke(google, request())).rejects.toMatchObject({ code: 'GOOGLE_EMAIL_UNVERIFIED' });
    expect(existing.googleId).toBeUndefined();
    expect(existing.save).not.toHaveBeenCalled();
    expect(RefreshToken.create).not.toHaveBeenCalled();
    expect(sentSubjects()).toEqual([]);
  });

  it('links a confirmed Google email to an existing account and marks it verified', async () => {
    googleSays({ emailVerified: true });
    const existing = customerDoc({ emailVerified: false });
    Customer.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(existing);

    const { body } = await invoke(google, request());

    expect(existing).toMatchObject({ googleId: GOOGLE_SUB, authProvider: 'both', emailVerified: true });
    expect(body.data.accessToken).toBe('access-token');
  });
});
