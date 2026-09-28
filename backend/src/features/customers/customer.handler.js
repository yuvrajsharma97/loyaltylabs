const AppError = require('../../shared/utils/AppError');
const asyncHandler = require('../../shared/utils/asyncHandler');
const { isValidObjectId } = require('../../shared/utils/objectId');

const Customer = require('./customer.model');
const Membership = require('../memberships/membership.model');
const PointTransaction = require('../transactions/transaction.model');
const Redemption = require('../redemptions/redemption.model');
const Dispute = require('../disputes/dispute.model');
const Store = require('../stores/store.model');
const { parsePagination, paginateQuery } = require('../../shared/utils/pagination');

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

  const memberships = await Membership.find({ customerId: customer._id })
    .select('storeId pointsBalance tier joinedAt lastActivityAt')
    .lean();

  // Attach a small store summary to each membership so the client can show
  // shop names without paging through the whole public directory. storeId
  // stays a plain id; `store` is null if the store was since deleted.
  const stores = await Store.find({ _id: { $in: memberships.map((m) => m.storeId) } })
    .select('name address logoUrl category status')
    .lean();
  const storeById = new Map(stores.map((store) => [String(store._id), store]));
  memberships.forEach((membership) => {
    membership.store = storeById.get(String(membership.storeId)) || null;
  });

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
 * Page-paginated ledger history. Defaults to every store the customer
 * belongs to (each entry carries its own storeId for client-side
 * grouping/filtering) - pass storeId to scope it to one shop's visit history
 * instead (e.g. a "recent visits" card on that shop's detail page).
 * @route GET /customers/me/transactions
 * @access Private (customer)
 * @query {number} [page=1]
 * @query {number} [limit=10]
 * @query {string} [storeId] - scope to a single store
 */
const getTransactions = asyncHandler(async (req, res) => {
  const filter = { customerId: req.auth.id };
  if (req.query.storeId) {
    if (!isValidObjectId(req.query.storeId)) {
      throw new AppError('STORE_NOT_FOUND', 'Store not found', 404);
    }
    filter.storeId = req.query.storeId;
  }

  const { items: transactions, pagination } = await paginateQuery(
    PointTransaction,
    filter,
    parsePagination(req.query),
    { sort: { createdAt: -1, _id: -1 } }
  );

  res.json({ success: true, data: { transactions, pagination } });
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
