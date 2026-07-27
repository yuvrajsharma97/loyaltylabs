const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  userType: { type: String, enum: ['user', 'customer'], required: true },
  token: { type: String, required: true, unique: true, index: true },
  revoked: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true }
}, { timestamps: { createdAt: true, updatedAt: false } });

// TTL index: Mongo drops the document once expiresAt passes.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
