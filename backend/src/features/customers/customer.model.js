const mongoose = require('mongoose');

// Schema only - this is the "customers" feature's model, created here because
// /auth/register/customer needs it to exist. Slug/QR *behavior* (the actual
// display/scan flows) belongs to the customers feature, built separately.
const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String },
  // Optional: a Google-only customer never sets a local password. Local
  // /auth/login already handles a missing passwordHash gracefully (falls
  // through to INVALID_CREDENTIALS) rather than crashing on bcrypt.compare.
  passwordHash: { type: String },

  authProvider: { type: String, enum: ['local', 'google', 'both'], default: 'local' },
  googleId: { type: String, sparse: true, index: true },
  avatarUrl: { type: String },

  username: { type: String, unique: true, index: true },
  slug: { type: String, unique: true, index: true },

  // Opaque HMAC digest - verified later via exact DB match, never decoded.
  // Permanent/static by design (no TOTP rotation) - see loyaltylabs-design-decisions memory.
  qrCodeToken: { type: String, unique: true, index: true },
  qrSalt: { type: String, unique: true }, // feeds qrCodeToken's HMAC only

  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String }, // hashed; cleared after use
  emailVerificationExpiresAt: { type: Date },
  passwordResetToken: { type: String }, // hashed; cleared after use
  passwordResetExpiresAt: { type: Date },

  // Set during customer onboarding - matched against store.category to
  // highlight relevant shops in the directory-join step.
  interests: [{ type: String, enum: ['cafe', 'retail', 'services', 'other'] }],
  onboardingCompleted: { type: Boolean, default: false }
}, { timestamps: { createdAt: true, updatedAt: false } });

module.exports = mongoose.model('Customer', customerSchema);
