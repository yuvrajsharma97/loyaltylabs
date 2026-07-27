const AppError = require('../../shared/utils/AppError');
const asyncHandler = require('../../shared/utils/asyncHandler');
const { isValidObjectId } = require('../../shared/utils/objectId');

const Customer = require('./customer.model');
const Membership = require('../memberships/membership.model');
const PointTransaction = require('../transactions/transaction.model');
const Redemption = require('../redemptions/redemption.model');
const Dispute = require('../disputes/dispute.model');

const MAX_TRANSACTIONS_LIMIT = 100;
const DEFAULT_TRANSACTIONS_LIMIT = 20;
const MAX_OPEN_DISPUTES = 3;

/**
 * Current customer's profile plus per-store points balances (role table:
 * "points balance per store" - no separate endpoint exists for this).
 * @route GET /customers/me
 * @access Private (customer)
 */
const getMe = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.auth.id).select(
    'name email phone username slug avatarUrl authProvider emailVerified interests onboardingCompleted createdAt'
  );
  if (!customer) {
    throw new AppError('CUSTOMER_NOT_FOUND', 'Customer not found', 404);
  }

  const memberships = await Membership.find({ customerId: customer._id }).select(
    'storeId pointsBalance tier joinedAt lastActivityAt'
  );

  res.json({
    success: true,
    data: {
      id: customer._id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      username: customer.username,
      slug: customer.slug,
      avatarUrl: customer.avatarUrl,
      authProvider: customer.authProvider,
      emailVerified: customer.emailVerified,
      interests: customer.interests,
      onboardingCompleted: customer.onboardingCompleted,
      memberships
    }
  });
});

/**
 * Update the customer's own profile - phone/interests during onboarding,
 * and the onboardingCompleted flag as the flow's final step.
 * @route PATCH /customers/me
 * @access Private (customer)
 * @body {string} [phone]
 * @body {Array<'cafe'|'retail'|'services'|'other'>} [interests]
 * @body {boolean} [onboardingCompleted]
 */
const updateMe = asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(req.auth.id, { $set: req.body }, { new: true }).select(
    'name email phone username slug avatarUrl authProvider emailVerified interests onboardingCompleted'
  );
  if (!customer) {
    throw new AppError('CUSTOMER_NOT_FOUND', 'Customer not found', 404);
  }

  res.json({ success: true, data: customer });
});

/**
 * The customer's static QR identity token - always the same value (no TOTP
 * rotation; see loyaltylabs-design-decisions memory). Gated on email
 * verification so an unverified account has no QR at all.
 * @route GET /customers/me/qr-token
 * @access Private (customer)
 */
const getQrToken = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.auth.id).select('emailVerified qrCodeToken');
  if (!customer || !customer.emailVerified) {
    throw new AppError('QR_NOT_ISSUED', 'Customer account not yet email-verified - no QR exists', 403);
  }

  res.json({ success: true, data: { qrToken: customer.qrCodeToken } });
});

/**
 * Cursor-paginated ledger history. Defaults to every store the customer
 * belongs to (each entry carries its own storeId for client-side
 * grouping/filtering) - pass storeId to scope it to one shop's visit history
 * instead (e.g. a "recent visits" card on that shop's detail page).
 * @route GET /customers/me/transactions
 * @access Private (customer)
 * @query {number} [limit=20]
 * @query {string} [before] - ISO createdAt cursor; returns older entries
 * @query {string} [storeId] - scope to a single store
 */
const getTransactions = asyncHandler(async (req, res) => {
  const parsedLimit = parseInt(req.query.limit, 10);
  const limit = Math.min(
    Number.isNaN(parsedLimit) || parsedLimit <= 0 ? DEFAULT_TRANSACTIONS_LIMIT : parsedLimit,
    MAX_TRANSACTIONS_LIMIT
  );

  const filter = { customerId: req.auth.id };
  if (req.query.storeId) {
    if (!isValidObjectId(req.query.storeId)) {
      throw new AppError('STORE_NOT_FOUND', 'Store not found', 404);
    }
    filter.storeId = req.query.storeId;
  }
  if (req.query.before) {
    const before = new Date(req.query.before);
    if (!Number.isNaN(before.getTime())) {
      filter.createdAt = { $lt: before };
    }
  }

  const transactions = await PointTransaction.find(filter).sort({ createdAt: -1 }).limit(limit);

  res.json({
    success: true,
    data: {
      transactions,
      nextCursor: transactions.length === limit ? transactions[transactions.length - 1].createdAt : null
    }
  });
});

/**
 * Flag a transaction as disputed. Max 3 open disputes per {customer, store}
 * at any time - see loyalty-saas-plan.md section 3.5.
 * @route POST /customers/me/disputes
 * @access Private (customer)
 * @body {string} storeId
 * @body {string} transactionId
 * @body {'earn'|'redemption'|'reversal'} transactionType
 * @body {string} customerNote
 */
const createDispute = asyncHandler(async (req, res) => {
  const { storeId, transactionId, transactionType, customerNote } = req.body;
  const customerId = req.auth.id;

  if (!isValidObjectId(storeId) || !isValidObjectId(transactionId)) {
    throw new AppError('TRANSACTION_NOT_FOUND', 'Transaction not found - try again', 404);
  }

  const openCount = await Dispute.countDocuments({ customerId, storeId, status: 'open' });
  if (openCount >= MAX_OPEN_DISPUTES) {
    throw new AppError('DISPUTE_LIMIT_REACHED', 'You have open disputes being reviewed', 429);
  }

  // 'redemption' disputes reference the redemptions collection; 'earn' and
  // 'reversal' reference pointTransactions, where `type` matches 1:1.
  const transactionExists =
    transactionType === 'redemption'
      ? await Redemption.exists({ _id: transactionId, storeId, customerId })
      : await PointTransaction.exists({ _id: transactionId, storeId, customerId, type: transactionType });

  if (!transactionExists) {
    throw new AppError('TRANSACTION_NOT_FOUND', 'Transaction not found - try again', 404);
  }

  const dispute = await Dispute.create({ storeId, customerId, transactionId, transactionType, customerNote });

  res.status(201).json({ success: true, data: { id: dispute._id, status: dispute.status } });
});

module.exports = { getMe, updateMe, getQrToken, getTransactions, createDispute };
