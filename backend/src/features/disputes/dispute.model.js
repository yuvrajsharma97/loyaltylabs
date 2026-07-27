const mongoose = require('mongoose');

// disputes. Only creation (POST /customers/me/disputes) is built so far -
// owner resolution (GET /stores/:id/disputes, PATCH /disputes/:id) is a
// separate build.
const disputeSchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  transactionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  transactionType: { type: String, enum: ['earn', 'redemption', 'reversal'], required: true },
  customerNote: { type: String, required: true },
  ownerNote: { type: String, default: null },
  status: { type: String, enum: ['open', 'resolved'], default: 'open' },
  resolvedAt: { type: Date, default: null }
}, { timestamps: { createdAt: true, updatedAt: false } });

disputeSchema.index({ storeId: 1, status: 1 });
disputeSchema.index({ status: 1 });

module.exports = mongoose.model('Dispute', disputeSchema);
