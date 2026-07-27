const mongoose = require('mongoose');

// customerStoreMemberships - created via POST /stores/:id/join (stores
// feature) and mutated by /redeem/initiate (redemptions feature) and, later,
// /scan/earn (scan feature). No dedicated routes/handler of its own per
// PROJECT_FILES.md - every feature that needs it imports this model directly.
const membershipSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  pointsBalance: { type: Number, default: 0 },
  lastActivityAt: { type: Date, default: null }, // null = joined via directory, never transacted
  tier: { type: String, default: null }, // tiering system not yet specified in the plan
  joinedAt: { type: Date, default: Date.now }
});

membershipSchema.index({ customerId: 1, storeId: 1 }, { unique: true });
membershipSchema.index({ storeId: 1, lastActivityAt: 1 });

module.exports = mongoose.model('CustomerStoreMembership', membershipSchema);
