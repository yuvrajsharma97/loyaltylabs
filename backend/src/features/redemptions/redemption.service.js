const Redemption = require('./redemption.model');
const Membership = require('../memberships/membership.model');
const PointTransaction = require('../transactions/transaction.model');

/**
 * Cancels every pending redemption matching `filter`, inside `session`.
 * With `refund: true` each customer gets the points back, recorded as a
 * `ledgerType` entry (e.g. 'suspension_reversal'). Returns how many were
 * cancelled. A code fulfilled or cancelled concurrently is skipped, so points
 * are never restored twice.
 */
async function cancelPendingRedemptions(filter, { session, refund, ledgerType = 'suspension_reversal' }) {
  const pending = await Redemption.find({ ...filter, status: 'pending' }).session(session);
  let cancelledCount = 0;

  for (const redemption of pending) {
    const cancelled = await Redemption.findOneAndUpdate(
      { _id: redemption._id, status: 'pending' },
      { $set: { status: 'cancelled' } },
      { session, new: true }
    );
    if (!cancelled) continue;
    cancelledCount += 1;

    if (refund) {
      await Membership.updateOne(
        { customerId: cancelled.customerId, storeId: cancelled.storeId },
        { $inc: { pointsBalance: cancelled.pointsSpent } },
        { session }
      );
      await PointTransaction.create(
        [{
          storeId: cancelled.storeId,
          customerId: cancelled.customerId,
          type: ledgerType,
          points: cancelled.pointsSpent,
          relatedRedemptionId: cancelled._id
        }],
        { session }
      );
    }
  }

  return cancelledCount;
}

module.exports = { cancelPendingRedemptions };
