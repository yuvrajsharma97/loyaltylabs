const mongoose = require('mongoose');

// pointTransactions - append-only ledger, NEVER mutated or deleted (this is
// financial history). No TTL index anywhere on this schema, deliberately -
// the plan's own §4 index list contradicts itself here ("never deleted" next
// to "TTL on idempotencyKeyExpiresAt", which would hard-delete the row). The
// 24h idempotency window is enforced in application logic (/scan/earn), not
// via Mongo document expiry. See loyaltylabs-design-decisions memory.
//
// tillPin/verificationMethod are required by the scan feature for every
// till-driven earn/redeem, but /redeem/initiate writes ledger entries with no
// till involved at all (the customer spends points themselves) - so both are
// optional here rather than required, matching the till-PIN gate's actual
// scope ("every scan", not every ledger entry).
const pointTransactionSchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  performedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  tillPin: { type: String, default: null },
  // 'qr_scan' - static QR lookup (no TOTP, see design decisions memory); 'slug_manual' - camera-fail fallback.
  verificationMethod: { type: String, enum: ['qr_scan', 'slug_manual'], default: null },
  idempotencyKey: { type: String },
  idempotencyKeyExpiresAt: { type: Date, default: null },
  type: {
    type: String,
    enum: ['earn', 'redeem', 'adjust', 'reversal', 'expiry', 'suspension_reversal'],
    required: true
  },
  points: { type: Number, required: true },
  purchaseAmount: { type: Number, default: null },
  relatedRedemptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Redemption', default: null },
  pointsCapApplied: { type: Boolean, default: false }
}, { timestamps: { createdAt: true, updatedAt: false } });

pointTransactionSchema.index({ customerId: 1, storeId: 1, createdAt: -1 });
pointTransactionSchema.index({ storeId: 1, createdAt: -1 });

// One ledger entry per idempotency key, enforced by the database so two
// simultaneous /scan/earn requests can't both award points. Partial (not
// sparse) so entries written without a key - redemptions, adjustments,
// expiries - are left out of the index entirely.
pointTransactionSchema.index(
  { idempotencyKey: 1 },
  {
    name: 'idempotencyKey_unique',
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: 'string' } }
  }
);

module.exports = mongoose.model('PointTransaction', pointTransactionSchema);
