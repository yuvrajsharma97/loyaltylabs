const mongoose = require('mongoose');

// rewardsCatalog. Only the customer-facing read (GET /stores/:id/rewards) is
// built so far - owner CRUD (create/edit/soft-delete, "Scheduled" badge view)
// is a separate build, same pattern as customer.model.js/store.model.js
// being schema-only until their first consuming feature needed them.
const rewardSchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String },
  imageUrl: { type: String },
  pointsRequired: { type: Number, required: true },
  rewardType: { type: String, enum: ['discount_percent', 'discount_fixed', 'free_item'], required: true },
  value: { type: Number },
  active: { type: Boolean, default: true },
  deleted: { type: Boolean, default: false }, // soft-delete only - never hard-delete
  stockLimit: { type: Number, default: null }, // not atomically enforced - see design decisions memory
  validFrom: { type: Date, default: Date.now },
  validTo: { type: Date, default: null }
}, { timestamps: { createdAt: true, updatedAt: false } });

rewardSchema.index({ storeId: 1, active: 1, deleted: 1 });

module.exports = mongoose.model('Reward', rewardSchema);
