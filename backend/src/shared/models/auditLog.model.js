const mongoose = require('mongoose');

// auditLogs - cross-cutting infrastructure, not owned by any single feature,
// hence living under shared/ rather than a feature folder.
const auditLogSchema = new mongoose.Schema({
  actorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  tillPin: { type: String, default: null },
  action: { type: String, required: true },
  target: { type: String, default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: { createdAt: true, updatedAt: false } });

auditLogSchema.index({ storeId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
