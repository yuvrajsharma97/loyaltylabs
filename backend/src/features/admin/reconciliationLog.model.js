const mongoose = require('mongoose');

// reconciliationLogs - written by POST /admin/stores/:id/reconcile (no
// automatic nightly job here - that's a BullMQ job, out of scope).
// corrected only flips true after an explicit super-admin confirm.
const reconciliationLogSchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  expectedBalance: { type: Number, required: true }, // sum of pointTransactions.points for {customerId, storeId}
  actualBalance: { type: Number, required: true }, // membership.pointsBalance at the time of the check
  discrepancy: { type: Number, required: true },
  corrected: { type: Boolean, default: false }
}, { timestamps: { createdAt: true, updatedAt: false } });

reconciliationLogSchema.index({ storeId: 1, corrected: 1, createdAt: -1 });

module.exports = mongoose.model('ReconciliationLog', reconciliationLogSchema);
