const AppError = require('../../shared/utils/AppError');
const asyncHandler = require('../../shared/utils/asyncHandler');
const { isValidObjectId } = require('../../shared/utils/objectId');
const { parsePagination, paginateQuery } = require('../../shared/utils/pagination');

const Reward = require('./reward.model');
const { rewardValueProblem } = require('./reward.validation');
const Store = require('../stores/store.model');
const Redemption = require('../redemptions/redemption.model');

/**
 * Rewards catalog for a store. optionalAuth means this serves two audiences
 * from one route: an anonymous/customer caller sees only active, non-deleted,
 * already-valid rewards; the owning store_owner sees everything (including
 * inactive and future-dated "Scheduled" rewards).
 * @route GET /stores/:id/rewards
 * @access Public (richer view if authenticated as the owning store_owner)
 * @query {number} [page=1]
 * @query {number} [limit=10]
 */
const listStoreRewards = asyncHandler(async (req, res) => {
  const { id: storeId } = req.params;

  if (!isValidObjectId(storeId)) {
    throw new AppError('STORE_NOT_FOUND', 'Store not found', 404);
  }

  const store = await Store.findById(storeId);
  if (!store) {
    throw new AppError('STORE_NOT_FOUND', 'Store not found', 404);
  }

  const isOwner = Boolean(
    req.auth && req.auth.role === 'store_owner' && store.ownerUserId.toString() === req.auth.id
  );

  if (!isOwner && store.status !== 'active') {
    throw new AppError('STORE_SUSPENDED', "This store's program is currently unavailable", 403);
  }

  const filter = { storeId, deleted: false };
  if (!isOwner) {
    filter.active = true;
    filter.validFrom = { $lte: new Date() };
  }

  const fields = isOwner
    ? 'title description imageUrl pointsRequired rewardType value active validFrom validTo stockLimit'
    : 'title description imageUrl pointsRequired rewardType value validTo';

  // Cheapest first, so page 1 always carries the lowest-threshold reward
  // (the customer stamp card measures progress against it).
  const { items: rewards, pagination } = await paginateQuery(Reward, filter, parsePagination(req.query), {
    sort: { pointsRequired: 1, _id: 1 },
    select: fields
  });

  res.json({ success: true, data: { rewards, pagination } });
});

/**
 * First successful create flips onboardingCompleted.firstRewardAdded.
 * @route POST /stores/:id/rewards
 * @access Private (store_owner, owner of this store)
 */
const createReward = asyncHandler(async (req, res) => {
  const { value, ...fields } = req.body;
  // A free item carries no value.
  const reward = await Reward.create({
    ...fields,
    value: fields.rewardType === 'free_item' ? null : value,
    storeId: req.store._id
  });

  if (!req.store.onboardingCompleted.firstRewardAdded) {
    req.store.onboardingCompleted.firstRewardAdded = true;
    await req.store.save();
  }

  res.status(201).json({ success: true, data: reward });
});

/**
 * @route PATCH /stores/:id/rewards/:rewardId
 * @access Private (store_owner, owner of this store)
 */
const updateReward = asyncHandler(async (req, res) => {
  const { rewardId } = req.params;
  if (!isValidObjectId(rewardId)) {
    throw new AppError('REWARD_NOT_FOUND', 'This reward is no longer available', 404);
  }

  const reward = await Reward.findOne({ _id: rewardId, storeId: req.store._id, deleted: false });
  if (!reward) {
    throw new AppError('REWARD_NOT_FOUND', 'This reward is no longer available', 404);
  }

  Object.assign(reward, req.body);
  // A free item carries no value; switching to it clears any old discount.
  if (reward.rewardType === 'free_item') reward.value = null;
  const valueProblem = rewardValueProblem(reward.rewardType, reward.value);
  if (valueProblem) {
    throw new AppError('VALIDATION_ERROR', 'Request body failed validation', 400, {
      errors: [{ field: 'value', message: valueProblem }]
    });
  }
  await reward.save();

  res.json({ success: true, data: reward });
});

/**
 * Soft-delete only - the reward row is never removed (redemptions reference
 * it by rewardId). Response includes a pending-redemption count so the
 * owner UI can warn, per plan section 5, without blocking the delete itself.
 * @route DELETE /stores/:id/rewards/:rewardId
 * @access Private (store_owner, owner of this store)
 */
const deleteReward = asyncHandler(async (req, res) => {
  const { rewardId } = req.params;
  if (!isValidObjectId(rewardId)) {
    throw new AppError('REWARD_NOT_FOUND', 'This reward is no longer available', 404);
  }

  const reward = await Reward.findOne({ _id: rewardId, storeId: req.store._id, deleted: false });
  if (!reward) {
    throw new AppError('REWARD_NOT_FOUND', 'This reward is no longer available', 404);
  }

  reward.deleted = true;
  reward.active = false;
  await reward.save();

  const pendingRedemptionsCount = await Redemption.countDocuments({ rewardId: reward._id, status: 'pending' });

  res.json({ success: true, data: { deleted: true, pendingRedemptionsCount } });
});

module.exports = { listStoreRewards, createReward, updateReward, deleteReward };
