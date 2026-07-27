const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');

const env = require('../../config/env');
const AppError = require('../../shared/utils/AppError');
const asyncHandler = require('../../shared/utils/asyncHandler');
const { generateSlug } = require('../../shared/utils/slugGenerator');
const { generateQrCodeToken, generateQrSalt } = require('../../shared/utils/qrSigning');
const { hashToken, issueHashedToken } = require('../../shared/utils/hashToken');
const { assertPasswordStrong } = require('../../shared/utils/passwordStrength');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} = require('../../shared/services/tokenService');
const sendEmail = require('../../shared/services/sendEmail');
const {
  verificationEmail,
  passwordResetEmail,
  recoverAccountEmail,
  loginNotificationEmail,
  welcomeEmail
} = require('./auth.emailTemplates');

const User = require('./auth.model');
const RefreshToken = require('./refreshToken.model');
const Customer = require('../customers/customer.model');
const Store = require('../stores/store.model');

const googleClient = new OAuth2Client(env.googleClientId);

const BCRYPT_ROUNDS = 10;

function accountModel(accountType) {
  return accountType === 'user' ? User : Customer;
}

// Every new customer needs these regardless of how they sign up (local
// password or Google) - shared by registerCustomer and google so the two
// paths can't drift apart.
function generateCustomerIdentityFields({ name, email }) {
  const _id = new mongoose.Types.ObjectId();
  const qrSalt = generateQrSalt();
  const qrCodeToken = generateQrCodeToken(_id.toString(), qrSalt);
  const slug = generateSlug(name);
  const username = generateSlug(email.split('@')[0]);
  return { _id, qrSalt, qrCodeToken, slug, username };
}

// Shared by every successful sign-in path (local login + Google) so a
// notification never fails the actual authentication - a transient mail
// issue shouldn't lock someone out of their own account.
async function sendLoginNotification(account) {
  try {
    await sendEmail({ to: account.email, ...loginNotificationEmail({ name: account.name, timestamp: new Date() }) });
  } catch (err) {
    console.error('Failed to send login notification email:', err);
  }
}

async function issueTokenPair({ id, type, role }) {
  const accessToken = signAccessToken({ id, type, role });
  const refreshToken = signRefreshToken({ id, type, role });

  await RefreshToken.create({
    userId: id,
    userType: type,
    token: refreshToken,
    expiresAt: new Date(Date.now() + env.jwt.refreshExpiresInMs)
  });

  return { accessToken, refreshToken };
}

/**
 * Register a new customer account. Creates the customer with emailVerified:false
 * and sends a verification email; account is otherwise unusable until verified.
 * @route POST /auth/register/customer
 * @access Public (IP rate-limited)
 * @body {string} name
 * @body {string} email
 * @body {string} password
 * @body {string} [phone]
 */
const registerCustomer = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  assertPasswordStrong(password);

  const existing = await Customer.findOne({ email });
  if (existing) {
    throw new AppError('EMAIL_TAKEN', 'An account with this email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const { _id, qrSalt, qrCodeToken, slug, username } = generateCustomerIdentityFields({
    name,
    email
  });

  const {
    rawToken,
    hashedToken: emailVerificationToken,
    expiresAt: emailVerificationExpiresAt
  } = issueHashedToken(env.emailVerificationExpiresInMs);

  let customer;
  try {
    customer = await Customer.create({
      _id,
      name,
      email,
      phone,
      passwordHash,
      username,
      slug,
      qrCodeToken,
      qrSalt,
      emailVerificationToken,
      emailVerificationExpiresAt
    });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
      throw new AppError('EMAIL_TAKEN', 'An account with this email already exists', 409);
    }
    throw err;
  }

  try {
    const email = verificationEmail({
      name: customer.name,
      url: `${env.appUrl}/verify-email?token=${rawToken}&accountType=customer`,
      expiresInHours: env.emailVerificationExpiresInMs / (60 * 60 * 1000)
    });
    await sendEmail({ to: customer.email, ...email });
  } catch (err) {
    // Account already exists - don't fail registration over a transient mail
    // issue, the customer can request a new link via /auth/resend-verification.
    console.error('Failed to send verification email:', err);
  }

  res.status(201).json({
    success: true,
    data: { id: customer._id, name: customer.name, email: customer.email }
  });
});

/**
 * Verify a customer's email using the token from the verification link.
 * @route POST /auth/verify-email
 * @access Public
 * @body {string} token - raw (unhashed) token from the emailed link
 */
const verifyEmail = asyncHandler(async (req, res) => {
  const { token, accountType } = req.body;
  const hashed = hashToken(token);
  const Model = accountModel(accountType);

  const account = await Model.findOne({ emailVerificationToken: hashed });

  if (!account) {
    throw new AppError('LINK_INVALID', 'Invalid link - request a new one', 400);
  }
  if (account.emailVerified) {
    throw new AppError('ALREADY_VERIFIED', 'Email is already verified', 400);
  }
  if (account.emailVerificationExpiresAt < new Date()) {
    throw new AppError('LINK_EXPIRED', 'Your verification link has expired.', 400);
  }

  account.emailVerified = true;
  account.emailVerificationToken = undefined;
  account.emailVerificationExpiresAt = undefined;
  await account.save();

  res.json({ success: true, data: { emailVerified: true } });
});

/**
 * Resend the email verification link. Always returns { sent: true } whether
 * or not the account exists, to avoid leaking account existence.
 * @route POST /auth/resend-verification
 * @access Public (IP + account rate-limited)
 * @body {string} email
 */
const resendVerification = asyncHandler(async (req, res) => {
  const { email, accountType } = req.body;
  const Model = accountModel(accountType);
  const account = await Model.findOne({ email });

  // Don't reveal account existence either way - just report the same shape.
  if (!account || account.emailVerified) {
    return res.json({ success: true, data: { sent: true } });
  }

  const { rawToken, hashedToken, expiresAt } = issueHashedToken(env.emailVerificationExpiresInMs);
  account.emailVerificationToken = hashedToken;
  account.emailVerificationExpiresAt = expiresAt;
  await account.save();

  await sendEmail({
    to: account.email,
    ...verificationEmail({
      name: account.name,
      url: `${env.appUrl}/verify-email?token=${rawToken}&accountType=${accountType}`,
      expiresInHours: env.emailVerificationExpiresInMs / (60 * 60 * 1000)
    })
  });

  res.json({ success: true, data: { sent: true } });
});

/**
 * Re-authenticate a customer via email when they've lost access to their QR
 * (e.g. new device). Issues nothing secret - a fresh QR display token is only
 * ever available from GET /customers/me/qr-token once logged back in.
 * @route POST /auth/recover-qr
 * @access Public
 * @body {string} email
 */
const recoverQr = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const customer = await Customer.findOne({ email });

  if (customer && customer.emailVerified) {
    const { rawToken, hashedToken, expiresAt } = issueHashedToken(env.passwordResetExpiresInMs);
    customer.passwordResetToken = hashedToken;
    customer.passwordResetExpiresAt = expiresAt;
    await customer.save();

    await sendEmail({
      to: customer.email,
      ...recoverAccountEmail({
        name: customer.name,
        url: `${env.appUrl}/recover-qr?token=${rawToken}`
      })
    });
  }

  // Same response regardless of whether the account exists - don't leak that.
  res.json({ success: true, data: { sent: true } });
});

/**
 * Register a new store owner account AND its initial store, atomically.
 * There is no separate "create a store" endpoint anywhere in the API surface,
 * so both are created together here. ownerName/storeName are optional -
 * sign-up only collects email + password, everything else (owner name,
 * store name, address, category, loyalty config, till PIN) is gathered
 * during store onboarding. Placeholders here are just enough to satisfy the
 * schemas' required `name` fields until onboarding overwrites them.
 * @route POST /auth/register/store
 * @access Public (IP rate-limited)
 * @body {string} [ownerName]
 * @body {string} [storeName]
 * @body {string} email
 * @body {string} password
 * @body {string} [phone]
 */
const registerStore = asyncHandler(async (req, res) => {
  const { email, password, phone } = req.body;
  const emailPrefix = email.split('@')[0];
  const ownerName = req.body.ownerName || emailPrefix;
  const storeName = req.body.storeName || `${emailPrefix}'s Store`;

  assertPasswordStrong(password);

  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError('EMAIL_TAKEN', 'An account with this email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const {
    rawToken,
    hashedToken: emailVerificationToken,
    expiresAt: emailVerificationExpiresAt
  } = issueHashedToken(env.emailVerificationExpiresInMs);

  // No standalone "create a store" endpoint exists anywhere in the API
  // surface, so the owner User and the initial Store are created together.
  const session = await mongoose.startSession();
  let owner;
  let store;
  try {
    await session.withTransaction(async () => {
      [owner] = await User.create(
        [{
          email,
          passwordHash,
          name: ownerName,
          phone,
          role: 'store_owner',
          emailVerificationToken,
          emailVerificationExpiresAt
        }],
        { session }
      );
      [store] = await Store.create([{ name: storeName, ownerUserId: owner._id }], { session });
    });
  } finally {
    session.endSession();
  }

  try {
    const email = verificationEmail({
      name: owner.name,
      url: `${env.appUrl}/verify-email?token=${rawToken}&accountType=user`,
      expiresInHours: env.emailVerificationExpiresInMs / (60 * 60 * 1000)
    });
    await sendEmail({ to: owner.email, ...email });
  } catch (err) {
    // Account already exists - don't fail registration over a transient mail
    // issue, the owner can request a new link via /auth/resend-verification.
    console.error('Failed to send verification email:', err);
  }

  res.status(201).json({
    success: true,
    data: { userId: owner._id, storeId: store._id, name: owner.name, storeName: store.name }
  });
});

/**
 * Log in with email/password. `accountType` disambiguates the users
 * collection (super_admin/store_owner) from the customers collection, since
 * both are separate auth surfaces that can share an email address.
 * @route POST /auth/login
 * @access Public
 * @body {string} email
 * @body {string} password
 * @body {'user'|'customer'} accountType
 * @returns {{accessToken: string, refreshToken: string, role: string}}
 */
const login = asyncHandler(async (req, res) => {
  const { email, password, accountType } = req.body;
  const Model = accountModel(accountType);

  const account = await Model.findOne({ email });
  if (!account || !account.passwordHash) {
    throw new AppError('INVALID_CREDENTIALS', 'Email or password is incorrect', 401);
  }

  const match = await bcrypt.compare(password, account.passwordHash);
  if (!match) {
    throw new AppError('INVALID_CREDENTIALS', 'Email or password is incorrect', 401);
  }

  if (accountType === 'customer' && !account.emailVerified) {
    throw new AppError('EMAIL_NOT_VERIFIED', 'Account exists but email not verified', 403);
  }

  const role = accountType === 'user' ? account.role : 'customer';
  const tokens = await issueTokenPair({ id: account._id, type: accountType, role });
  await sendLoginNotification(account);

  res.json({ success: true, data: { ...tokens, role } });
});

/**
 * Log in / sign up a customer via Google Identity Services. Customers only -
 * store owners/super admins are local email+password only.
 * Google's `email_verified` claim satisfies the same trust requirement as
 * the emailVerificationToken flow, so a Google customer is auto-verified
 * and never goes through /auth/verify-email.
 * @route POST /auth/google
 * @access Public
 * @body {string} idToken - Google ID token from the frontend SDK
 * @returns {{accessToken: string, refreshToken: string, role: string}}
 */
const google = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: env.googleClientId });
    payload = ticket.getPayload();
  } catch (err) {
    throw new AppError('GOOGLE_TOKEN_INVALID', 'Google sign-in failed, try again', 401);
  }

  const googleVerifiedEmail = payload.email_verified === true;

  let customer = await Customer.findOne({ googleId: payload.sub });
  let isNewCustomer = false;
  if (!customer) {
    customer = await Customer.findOne({ email: payload.email });
    if (customer) {
      customer.googleId = payload.sub;
      customer.authProvider = customer.authProvider === 'local' ? 'both' : 'google';
      if (googleVerifiedEmail && !customer.emailVerified) {
        customer.emailVerified = true;
        customer.emailVerificationToken = undefined;
        customer.emailVerificationExpiresAt = undefined;
      }
      await customer.save();
    } else {
      const { _id, qrSalt, qrCodeToken, slug, username } = generateCustomerIdentityFields({
        name: payload.name || payload.email,
        email: payload.email
      });

      customer = await Customer.create({
        _id,
        name: payload.name || payload.email,
        email: payload.email,
        username,
        slug,
        qrCodeToken,
        qrSalt,
        avatarUrl: payload.picture,
        googleId: payload.sub,
        authProvider: 'google',
        emailVerified: googleVerifiedEmail
      });
      isNewCustomer = true;
    }
  }

  if (!customer.emailVerified) {
    // Rare: Google reported email_verified:false (e.g. unverified custom
    // domain). Fall back to the normal verification requirement rather than
    // letting an unverified address into an active account.
    throw new AppError('EMAIL_NOT_VERIFIED', 'Account exists but email not verified', 403);
  }

  const tokens = await issueTokenPair({ id: customer._id, type: 'customer', role: 'customer' });

  if (isNewCustomer) {
    try {
      await sendEmail({ to: customer.email, ...welcomeEmail({ name: customer.name }) });
    } catch (err) {
      console.error('Failed to send welcome email:', err);
    }
  }
  await sendLoginNotification(customer);

  res.json({ success: true, data: { ...tokens, role: 'customer' } });
});

/**
 * Request a password reset email. Always returns { sent: true } whether or
 * not the account exists, to avoid leaking account existence.
 * @route POST /auth/forgot-password
 * @access Public
 * @body {string} email
 * @body {'user'|'customer'} accountType
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email, accountType } = req.body;
  const Model = accountModel(accountType);
  const account = await Model.findOne({ email });

  if (account) {
    const { rawToken, hashedToken, expiresAt } = issueHashedToken(env.passwordResetExpiresInMs);
    account.passwordResetToken = hashedToken;
    account.passwordResetExpiresAt = expiresAt;
    await account.save();

    await sendEmail({
      to: account.email,
      ...passwordResetEmail({
        name: account.name,
        url: `${env.appUrl}/reset-password?token=${rawToken}&accountType=${accountType}`,
        expiresInHours: env.passwordResetExpiresInMs / (60 * 60 * 1000)
      })
    });
  }

  // Same response either way - don't reveal account existence.
  res.json({ success: true, data: { sent: true } });
});

/**
 * Complete a password reset using the token from the emailed link.
 * Revokes every existing refresh token for the account.
 * @route POST /auth/reset-password
 * @access Public
 * @body {string} token - raw (unhashed) token from the emailed link
 * @body {string} newPassword
 * @body {'user'|'customer'} accountType
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword, accountType } = req.body;

  assertPasswordStrong(newPassword);

  const Model = accountModel(accountType);
  const hashed = hashToken(token);
  const account = await Model.findOne({ passwordResetToken: hashed });

  if (!account) {
    throw new AppError('LINK_INVALID', 'Invalid link - request a new one', 400);
  }
  if (account.passwordResetExpiresAt < new Date()) {
    throw new AppError('LINK_EXPIRED', 'Your verification link has expired.', 400);
  }

  account.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  account.passwordResetToken = undefined;
  account.passwordResetExpiresAt = undefined;
  await account.save();

  // New password -> revoke every existing session for this account.
  await RefreshToken.updateMany(
    { userId: account._id, userType: accountType, revoked: false },
    { $set: { revoked: true } }
  );

  res.json({ success: true, data: { passwordReset: true } });
});

/**
 * Exchange a valid, non-revoked refresh token for a new access token.
 * Does not rotate the refresh token itself.
 * @route POST /auth/refresh
 * @access Public
 * @body {string} refreshToken
 * @returns {{accessToken: string}}
 */
const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  const stored = await RefreshToken.findOne({ token: refreshToken });
  if (!stored) {
    throw new AppError('REFRESH_TOKEN_INVALID', 'Refresh token is missing, malformed, or revoked', 401);
  }
  if (stored.revoked) {
    throw new AppError('REFRESH_TOKEN_REVOKED', 'Refresh token was explicitly revoked (logout-all)', 401);
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw new AppError('REFRESH_TOKEN_INVALID', 'Refresh token is missing, malformed, or revoked', 401);
  }

  const accessToken = signAccessToken({ id: payload.sub, type: payload.type, role: payload.role });
  res.json({ success: true, data: { accessToken } });
});

/**
 * Revoke a single refresh token (normal logout).
 * @route POST /auth/logout
 * @access Public
 * @body {string} refreshToken
 */
const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  await RefreshToken.updateOne({ token: refreshToken }, { $set: { revoked: true } });
  res.json({ success: true, data: { loggedOut: true } });
});

/**
 * Revoke every refresh token belonging to the authenticated account
 * (e.g. till device lost/stolen). Requires a valid access token.
 * @route POST /auth/logout-all
 * @access Private (Bearer access token)
 */
const logoutAll = asyncHandler(async (req, res) => {
  const { id, type } = req.auth;
  await RefreshToken.updateMany({ userId: id, userType: type, revoked: false }, { $set: { revoked: true } });
  res.json({ success: true, data: { loggedOutAll: true } });
});

module.exports = {
  registerCustomer,
  verifyEmail,
  resendVerification,
  recoverQr,
  registerStore,
  login,
  google,
  forgotPassword,
  resetPassword,
  refresh,
  logout,
  logoutAll
};
