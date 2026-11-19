const mongoose = require('mongoose');
const { STORED_PLAN_IDS, ACTIVE_WINDOW_DAYS } = require('./billing.plans');

// storeBilling - created together with the store at registration (the owner
// picks a plan at sign-up and starts a TRIAL_DAYS free trial on it). Stores
// registered before plans existed have no record until the owner picks a plan
// via PATCH /billing/plan, so BILLING_NOT_SETUP stays a surfaceable state.
// Price and customer limit are not stored here - they're derived from `plan`
// via billing.plans.js so a price change applies everywhere at once.
const storeBillingSchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, unique: true },
  plan: { type: String, enum: STORED_PLAN_IDS, required: true },
  trialEndsAt: { type: Date, default: null },
  activeWindowDays: { type: Number, default: ACTIVE_WINDOW_DAYS },
  currentBillingPeriodStart: { type: Date, required: true },
  currentBillingPeriodEnd: { type: Date, required: true },
  status: { type: String, enum: ['trialing', 'active', 'past_due', 'suspended', 'cancelled'], default: 'trialing' },
  // Set when the store first hits its plan's customer limit (drives the
  // immediate limit email) and cleared once it's back under or upgrades.
  limitReachedAt: { type: Date, default: null },
  lastLimitEmailAt: { type: Date, default: null },
  stripeCustomerId: { type: String, default: null },
  stripeSubscriptionItemId: { type: String, default: null }
}, { timestamps: { createdAt: true, updatedAt: false } });

// usageSnapshots - one per closed billing period, written by the
// (not-yet-built) metering job and by suspension in admin.handler.
// amountDue is the plan's flat price (0 for a period spent in trial).
const usageSnapshotSchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  plan: { type: String, enum: STORED_PLAN_IDS, required: true },
  activeCustomerCount: { type: Number, required: true },
  customerLimit: { type: Number, default: null }, // null = unlimited
  amountDue: { type: Number, required: true },
  proRated: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'invoiced', 'paid'], default: 'pending' }
}, { timestamps: { createdAt: true, updatedAt: false } });

usageSnapshotSchema.index({ storeId: 1, periodStart: -1 });

const StoreBilling = mongoose.model('StoreBilling', storeBillingSchema);
const UsageSnapshot = mongoose.model('UsageSnapshot', usageSnapshotSchema);

module.exports = { StoreBilling, UsageSnapshot };
