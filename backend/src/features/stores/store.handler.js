const AppError = require('../../shared/utils/AppError');
const asyncHandler = require('../../shared/utils/asyncHandler');
const { isValidObjectId } = require('../../shared/utils/objectId');

const Store = require('./store.model');
const Membership = require('../memberships/membership.model');
const Dispute = require('../disputes/dispute.model');
const PointTransaction = require('../transactions/transaction.model');
const Redemption = require('../redemptions/redemption.model');

const TRANSACTION_TYPES = ['earn', 'redeem', 'adjust', 'reversal', 'expiry', 'suspension_reversal'];
const VERIFICATION_METHODS = ['qr_scan', 'slug_manual'];

const STORE_CATEGORIES = ['cafe', 'retail', 'services', 'other'];

/**
 * Public store directory - visible to unverified/unauthenticated users too
 * (gives them a reason to verify/sign up). Optional category filter/multi-
 * filter powers the customer onboarding "shops matching your interests" step.
 * @route GET /stores
 * @access Public
 * @query {string} [category] - comma-separated, e.g. "cafe,retail"
 */
const listStores = asyncHandler(async (req, res) => {
  const filter = { discoverable: true, status: 'active' };

  if (req.query.category) {
    const categories = req.query.category.split(',').filter((c) => STORE_CATEGORIES.includes(c));
    if (categories.length > 0) {
      filter.category = { $in: categories };
    }
  }

  const stores = await Store.find(filter).select('name address logoUrl category loyaltyProgram.mode createdAt');

  res.json({ success: true, data: { stores } });
});

/**
 * Join a store's loyalty program - creates a membership with a zero balance.
 * lastActivityAt stays null until the customer actually transacts (per
 * section 3.4 - directory-joined memberships never count toward billing).
 * @route POST /stores/:id/join
 * @access Private (customer)
 */
const joinStore = asyncHandler(async (req, res) => {
  const { id: storeId } = req.params;
  const customerId = req.auth.id;

  if (!isValidObjectId(storeId)) {
    throw new AppError('STORE_NOT_FOUND', 'Store not found', 404);
  }

  const store = await Store.findById(storeId);
  if (!store) {
    throw new AppError('STORE_NOT_FOUND', 'Store not found', 404);
  }
  if (store.status !== 'active') {
    throw new AppError('STORE_SUSPENDED', "This store's program is currently unavailable", 403);
  }
  if (!store.discoverable) {
    throw new AppError('NOT_DISCOVERABLE', 'This store cannot be joined via the directory', 403);
  }

  const existing = await Membership.findOne({ customerId, storeId });
  if (existing) {
    throw new AppError('ALREADY_A_MEMBER', 'Customer already has a membership at this store', 409);
  }

  const membership = await Membership.create({ customerId, storeId });

  res.status(201).json({
    success: true,
    data: { membershipId: membership._id, storeId, pointsBalance: membership.pointsBalance }
  });
});

/**
 * Resolves the logged-in owner's store without needing its id up front -
 * login only returns {accessToken, refreshToken, role}, never storeId, so
 * this is the frontend's entry point after a store_owner login/refresh
 * before it can call any of the :id-scoped endpoints below. One owner has
 * exactly one store in practice (registerStore creates both together and no
 * other store-creation endpoint exists), so findOne is safe here.
 * @route GET /stores/mine
 * @access Private (store_owner)
 */
const getMyStore = asyncHandler(async (req, res) => {
  const store = await Store.findOne({ ownerUserId: req.auth.id });
  if (!store) {
    throw new AppError('STORE_NOT_FOUND', 'Store not found', 404);
  }
  res.json({ success: true, data: store });
});

/**
 * Full store detail for its owner. loadOwnedStore already verified ownership
 * and attached the doc.
 * @route GET /stores/:id
 * @access Private (store_owner, owner of this store)
 */
const getStore = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.store });
});

/**
 * @route PATCH /stores/:id
 * @access Private (store_owner, owner of this store)
 * @body {string} [name]
 * @body {string} [address]
 * @body {string} [logoUrl]
 * @body {boolean} [discoverable]
 */
const updateStore = asyncHandler(async (req, res) => {
  Object.assign(req.store, req.body);
  await req.store.save();
  res.json({ success: true, data: req.store });
});

/**
 * @route GET /stores/:id/loyalty-config
 * @access Private (store_owner, owner of this store)
 */
const getLoyaltyConfig = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.store.loyaltyProgram });
});

/**
 * First successful save flips onboardingCompleted.loyaltyRuleSet.
 * @route PATCH /stores/:id/loyalty-config
 * @access Private (store_owner, owner of this store)
 */
const updateLoyaltyConfig = asyncHandler(async (req, res) => {
  Object.assign(req.store.loyaltyProgram, req.body);
  req.store.onboardingCompleted.loyaltyRuleSet = true;
  await req.store.save();
  res.json({ success: true, data: req.store.loyaltyProgram });
});

/**
 * @route GET /stores/:id/till-pins
 * @access Private (store_owner, owner of this store)
 */
const getTillPins = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { tillPins: req.store.tillPins } });
});

/**
 * Full-array replace semantics - the client sends the complete desired PIN
 * list (add/edit/deactivate all happen by resubmitting the array).
 * @route PATCH /stores/:id/till-pins
 * @access Private (store_owner, owner of this store)
 * @body {Array<{pin: string, label: string, active?: boolean}>} tillPins
 */
const updateTillPins = asyncHandler(async (req, res) => {
  const pins = req.body.tillPins.map((entry) => entry.pin);
  if (new Set(pins).size !== pins.length) {
    throw new AppError('VALIDATION_ERROR', 'Till PINs must be unique within a store', 400, {
      errors: [{ field: 'tillPins', message: 'PIN values must be unique' }]
    });
  }

  req.store.tillPins = req.body.tillPins;
  await req.store.save();
  res.json({ success: true, data: { tillPins: req.store.tillPins } });
});

/**
 * @route GET /stores/:id/onboarding
 * @access Private (store_owner, owner of this store)
 */
const getOnboarding = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.store.onboardingCompleted });
});

/**
 * @route GET /stores/:id/disputes
 * @access Private (store_owner, owner of this store)
 * @query {'open'|'resolved'} [status]
 */
const listStoreDisputes = asyncHandler(async (req, res) => {
  const filter = { storeId: req.store._id };
  if (req.query.status === 'open' || req.query.status === 'resolved') {
    filter.status = req.query.status;
  }

  const disputes = await Dispute.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: { disputes } });
});

/**
 * Owner's ledger view - cursor-paginated, filterable by type/verificationMethod
 * per the plan's A3 phase note ("owner view with filters including
 * verificationMethod"). Companion to the customer's own
 * GET /customers/me/transactions, scoped to this store instead of one customer.
 * @route GET /stores/:id/transactions
 * @access Private (store_owner, owner of this store)
 * @query {number} [limit=20]
 * @query {string} [before] - ISO createdAt cursor
 * @query {string} [type]
 * @query {'qr_scan'|'slug_manual'} [verificationMethod]
 */
const listStoreTransactions = asyncHandler(async (req, res) => {
  const parsedLimit = parseInt(req.query.limit, 10);
  const limit = Math.min(Number.isNaN(parsedLimit) || parsedLimit <= 0 ? 20 : parsedLimit, 100);

  const filter = { storeId: req.store._id };
  if (req.query.before) {
    const before = new Date(req.query.before);
    if (!Number.isNaN(before.getTime())) {
      filter.createdAt = { $lt: before };
    }
  }
  if (TRANSACTION_TYPES.includes(req.query.type)) {
    filter.type = req.query.type;
  }
  if (VERIFICATION_METHODS.includes(req.query.verificationMethod)) {
    filter.verificationMethod = req.query.verificationMethod;
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
 * Visits, redemption rate, and top rewards - per PROJECT_FILES.md's
 * Analytics.jsx. "Visits" = count of earn-type ledger entries (one per
 * successful till scan-and-purchase).
 * @route GET /stores/:id/analytics
 * @access Private (store_owner, owner of this store)
 */
const getStoreAnalytics = asyncHandler(async (req, res) => {
  const storeId = req.store._id;

  const [totalVisits, redemptionsByStatus, pointsAgg, topRewardsAgg] = await Promise.all([
    PointTransaction.countDocuments({ storeId, type: 'earn' }),
    Redemption.aggregate([
      { $match: { storeId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    PointTransaction.aggregate([
      { $match: { storeId } },
      {
        $group: {
          _id: null,
          totalPointsIssued: { $sum: { $cond: [{ $gt: ['$points', 0] }, '$points', 0] } },
          totalPointsRedeemed: { $sum: { $cond: [{ $lt: ['$points', 0] }, { $abs: '$points' }, 0] } }
        }
      }
    ]),
    Redemption.aggregate([
      { $match: { storeId, status: 'fulfilled' } },
      { $group: { _id: '$rewardId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'rewards', localField: '_id', foreignField: '_id', as: 'reward' } },
      { $unwind: '$reward' },
      { $project: { _id: 0, rewardId: '$_id', title: '$reward.title', count: 1 } }
    ])
  ]);

  const totalRedemptions = redemptionsByStatus.reduce((sum, entry) => sum + entry.count, 0);
  const fulfilledRedemptions = (redemptionsByStatus.find((entry) => entry._id === 'fulfilled') || { count: 0 })
    .count;

  res.json({
    success: true,
    data: {
      totalVisits,
      totalRedemptions,
      fulfilledRedemptions,
      redemptionRate: totalRedemptions > 0 ? fulfilledRedemptions / totalRedemptions : 0,
      topRewards: topRewardsAgg,
      totalPointsIssued: pointsAgg[0] ? pointsAgg[0].totalPointsIssued : 0,
      totalPointsRedeemed: pointsAgg[0] ? pointsAgg[0].totalPointsRedeemed : 0
    }
  });
});

module.exports = {
  listStores,
  joinStore,
  getMyStore,
  getStore,
  updateStore,
  getLoyaltyConfig,
  updateLoyaltyConfig,
  getTillPins,
  updateTillPins,
  getOnboarding,
  listStoreDisputes,
  listStoreTransactions,
  getStoreAnalytics
};
