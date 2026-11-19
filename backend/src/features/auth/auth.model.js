const mongoose = require('mongoose');

// Store owners / super admins - local email+password only. Google login is
// customer-only (see customers/customer.model.js) so no googleId/authProvider
// fields live here.
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String },
  role: { type: String, enum: ['super_admin', 'store_owner'], required: true },
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String }, // hashed; cleared after use
  emailVerificationExpiresAt: { type: Date },
  passwordResetToken: { type: String }, // hashed; cleared after use
  passwordResetExpiresAt: { type: Date }
}, { timestamps: { createdAt: true, updatedAt: false } });

module.exports = mongoose.model('User', userSchema);
