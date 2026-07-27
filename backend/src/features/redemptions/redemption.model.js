const mongoose = require('mongoose');

// redemptions. TTL on expiresAt per loyalty-saas-plan.md section 4, but
// scoped to status:'pending' only (partialFilterExpression below) - an
// unscanned redemption auto-expires a year after creation (see
// REDEMPTION_EXPIRY_MS in redemption.handler.js), but once /scan/redeem or
// /redeem/:id/cancel flips status to 'fulfilled'/'cancelled' the TTL no
// longer matches, so the record survives for history/audit regardless of
// how much of the year remains. A plain TTL on the bare field would have
// silently deleted fulfilled redemptions once the year was up - not the intent.
const redemptionSchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  rewardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reward', required: true },
  pointsSpent: { type: Number, required: true },
  redemptionCode: { type: String, required: true, unique: true, index: true },
  status: { type: String, enum: ['pending', 'fulfilled', 'expired', 'cancelled'], default: 'pending' },
  validityLockedAt: { type: Date, required: true }, // reward's validTo is irrelevant after this point
  expiresAt: { type: Date, required: true },
  fulfilledByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  tillPin: { type: String, default: null }, // required + validated at /scan/redeem fulfillment
  fulfilledAt: { type: Date, default: null }
}, { timestamps: { createdAt: true, updatedAt: false } });

redemptionSchema.index({ storeId: 1, status: 1, expiresAt: 1 });
redemptionSchema.index({ customerId: 1, storeId: 1 });
redemptionSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { status: 'pending' } }
);

module.exports = mongoose.model('Redemption', redemptionSchema);
