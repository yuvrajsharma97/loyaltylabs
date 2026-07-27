const mongoose = require('mongoose');
const AppError = require('../../shared/utils/AppError');
const asyncHandler = require('../../shared/utils/asyncHandler');
const { isValidObjectId } = require('../../shared/utils/objectId');
const { generateRawToken } = require('../../shared/utils/hashToken');

const Redemption = require('./redemption.model');
const Reward = require('../rewards/reward.model');
const Store = require('../stores/store.model');
const Membership = require('../memberships/membership.model');
const PointTransaction = require('../transactions/transaction.model');

// A generated code is a long-lived voucher, not a short checkout window - it
// stays redeemable for a year unless used first (fulfilling flips status to
// 'fulfilled', which takes it out of the pending-only TTL below regardless
// of how much of the year remains).
const REDEMPTION_EXPIRY_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Customer spends points to generate a single-use redemption code. Points
 * are deducted here, at generation time - not at till fulfillment ("The
 * customer already spent their points to generate it", plan section 1).
 * Stock (rewardsCatalog.stockLimit) is deliberately NOT checked here - see
 * loyaltylabs-design-decisions memory #4. The points-balance check below is
 * a separate, always-enforced atomicity guarantee (can't go negative), not
 * the stock check the plan omitted.
 * @route POST /redeem/initiate
 * @access Private (customer, rate-limited 5/min)
 * @body {string} rewardId
 */
const initiate = asyncHandler(async (req, res) => {
  const { rewardId } = req.body;
  const customerId = req.auth.id;

  if (!isValidObjectId(rewardId)) {
    throw new AppError('REWARD_NOT_FOUND', 'This reward is no longer available', 404);
  }

  const reward = await Reward.findById(rewardId);
  if (!reward || reward.deleted) {
    throw new AppError('REWARD_NOT_FOUND', 'This reward is no longer available', 404);
  }

  const now = new Date();
  // A past validTo has no dedicated error code in ERROR_CODES.md - it means
  // the same thing to the customer as an owner-deactivated reward.
  if (!reward.active || (reward.validTo && reward.validTo < now)) {
    throw new AppError('REWARD_NOT_ACTIVE', 'This reward is no longer available', 400);
  }
  if (reward.validFrom > now) {
    throw new AppError('REWARD_NOT_YET_VALID', 'This reward is not available yet', 400);
  }

  const store = await Store.findById(reward.storeId);
  if (!store || store.status !== 'active') {
    throw new AppError('STORE_SUSPENDED', "This store's program is currently unavailable", 403);
  }

  const membership = await Membership.findOne({ customerId, storeId: reward.storeId });
  if (!membership || membership.pointsBalance < reward.pointsRequired) {
    throw new AppError('INSUFFICIENT_POINTS', 'Not enough points for this reward', 400);
  }

  const redemptionCode = generateRawToken();
  const expiresAt = new Date(now.getTime() + REDEMPTION_EXPIRY_MS);
  let redemption;

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // Atomic guard against a concurrent spend racing the read above -
      // never lets the balance go negative, regardless of stock policy.
      const updated = await Membership.findOneAndUpdate(
        { _id: membership._id, pointsBalance: { $gte: reward.pointsRequired } },
        { $inc: { pointsBalance: -reward.pointsRequired }, $set: { lastActivityAt: now } },
        { new: true, session }
      );
      if (!updated) {
        throw new AppError('INSUFFICIENT_POINTS', 'Not enough points for this reward', 400);
      }

      [redemption] = await Redemption.create(
        [{
          storeId: reward.storeId,
          customerId,
          rewardId: reward._id,
          pointsSpent: reward.pointsRequired,
          redemptionCode,
          status: 'pending',
          validityLockedAt: now,
          expiresAt
        }],
        { session }
      );

      await PointTransaction.create(
        [{
          storeId: reward.storeId,
          customerId,
          type: 'redeem',
          points: -reward.pointsRequired,
          relatedRedemptionId: redemption._id
        }],
        { session }
      );
    });
  } finally {
    session.endSession();
  }

  res.status(201).json({
    success: true,
    data: {
      redemptionCode: redemption.redemptionCode,
      expiresAt: redemption.expiresAt,
      pointsSpent: redemption.pointsSpent
    }
  });
});

/**
 * Owner cancels a still-pending redemption and restores the customer's
 * points. The URL param is the redemption id, not a store id, so ownership
 * is checked here (via the redemption's own storeId) rather than through the
 * storeScope middleware.
 * @route POST /redeem/:id/cancel
 * @access Private (store_owner, owner of the store the redemption belongs to)
 */
const cancel = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new AppError('REDEMPTION_NOT_FOUND', 'No redemption matches this code', 404);
  }

  const redemption = await Redemption.findById(id);
  if (!redemption) {
    throw new AppError('REDEMPTION_NOT_FOUND', 'No redemption matches this code', 404);
  }

  const store = await Store.findById(redemption.storeId);
  if (!store || store.ownerUserId.toString() !== req.auth.id) {
    throw new AppError('CANCEL_NOT_AUTHORISED', 'Only the store owner can cancel a redemption', 403);
  }

  if (redemption.status !== 'pending') {
    throw new AppError('REDEMPTION_ALREADY_USED', 'This reward has already been redeemed', 409);
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const updated = await Redemption.findOneAndUpdate(
        { _id: redemption._id, status: 'pending' },
        { $set: { status: 'cancelled' } },
        { session, new: true }
      );
      if (!updated) {
        // Lost a race (already fulfilled between the read above and now).
        throw new AppError('REDEMPTION_ALREADY_USED', 'This reward has already been redeemed', 409);
      }

      await Membership.updateOne(
        { customerId: updated.customerId, storeId: updated.storeId },
        { $inc: { pointsBalance: updated.pointsSpent } },
        { session }
      );

      await PointTransaction.create(
        [{
          storeId: updated.storeId,
          customerId: updated.customerId,
          performedByUserId: req.auth.id,
          type: 'reversal',
          points: updated.pointsSpent,
          relatedRedemptionId: updated._id
        }],
        { session }
      );
    });
  } finally {
    session.endSession();
  }

  res.json({ success: true, data: { cancelled: true, pointsRestored: redemption.pointsSpent } });
});

module.exports = { initiate, cancel };
