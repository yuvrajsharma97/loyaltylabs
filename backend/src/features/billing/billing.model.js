const mongoose = require('mongoose');

// storeBilling - not auto-created at store registration. BILLING_NOT_SETUP
// is an expected, surfaceable state for a freshly created store (per
// ERROR_CODES.md) until a separate (not-yet-built) setup flow creates one.
const storeBillingSchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, unique: true },
  freeUserLimit: { type: Number, default: 100 },
  pricePerExtraUser: { type: Number, default: 1.0 }, // GBP
  activeWindowDays: { type: Number, default: 90 },
  currentBillingPeriodStart: { type: Date, required: true },
  currentBillingPeriodEnd: { type: Date, required: true },
  status: { type: String, enum: ['active', 'past_due', 'suspended'], default: 'active' },
  stripeCustomerId: { type: String, default: null },
  stripeSubscriptionItemId: { type: String, default: null }
}, { timestamps: { createdAt: true, updatedAt: false } });

// usageSnapshots - written by the (not-yet-built) BullMQ metering job.
// activeCustomerCount = memberships where lastActivityAt is non-null AND
// within activeWindowDays.
const usageSnapshotSchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  activeCustomerCount: { type: Number, required: true },
  billableCount: { type: Number, required: true }, // max(activeCustomerCount - freeUserLimit, 0)
  amountDue: { type: Number, required: true },
  proRated: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'invoiced', 'paid'], default: 'pending' }
}, { timestamps: { createdAt: true, updatedAt: false } });

usageSnapshotSchema.index({ storeId: 1, periodStart: -1 });

const StoreBilling = mongoose.model('StoreBilling', storeBillingSchema);
const UsageSnapshot = mongoose.model('UsageSnapshot', usageSnapshotSchema);

module.exports = { StoreBilling, UsageSnapshot };
