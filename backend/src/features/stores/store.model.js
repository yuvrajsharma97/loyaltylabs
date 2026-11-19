const mongoose = require('mongoose');

// Schema only - created here because /auth/register/store is the only
// documented place a Store is ever created (no separate POST /stores exists
// in the API surface). Config/CRUD behavior belongs to the "stores" feature.
const storeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  address: { type: String },
  logoUrl: { type: String },
  // Set during store onboarding - the design mockups show category badges
  // ("Cafe", "Services", "Retail") on directory listings that had no backing
  // field until now. Also what customer.interests matches against.
  category: { type: String, enum: ['cafe', 'retail', 'services', 'other'], default: 'other' },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  discoverable: { type: Boolean, default: true },
  loyaltyProgram: {
    mode: { type: String, enum: ['per_currency', 'per_visit'], default: 'per_currency' },
    pointsPerUnit: { type: Number, default: 1 },
    fixedPointsPerVisit: { type: Number, default: 0 },
    minPurchase: { type: Number, default: 0 },
    pointsExpiryDays: { type: Number, default: null },
    maxPointsBalance: { type: Number, default: null } // null = platform hard ceiling of 1,000,000
  },
  tillPins: [
    {
      pin: String,
      label: String,
      active: { type: Boolean, default: true }
    }
  ],
  onboardingCompleted: {
    loyaltyRuleSet: { type: Boolean, default: false },
    firstRewardAdded: { type: Boolean, default: false },
    tillModeTested: { type: Boolean, default: false }
  }
}, { timestamps: { createdAt: true, updatedAt: false } });

module.exports = mongoose.model('Store', storeSchema);
