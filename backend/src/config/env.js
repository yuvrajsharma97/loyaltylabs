require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

function required(name) {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV !== 'test') {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,

  mongodbUri: required('MONGODB_URI'),

  corsAllowedOrigins: (process.env.CORS_ALLOWED_ORIGINS || '').split(',').filter(Boolean),
  appUrl: process.env.APP_URL || 'http://localhost:5173',

  jwt: {
    secret: required('JWT_SECRET'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    refreshExpiresInMs: 30 * 24 * 60 * 60 * 1000
  },

  qrSigningSecret: process.env.QR_SIGNING_SECRET,
  idempotencySecret: process.env.IDEMPOTENCY_SECRET,

  // Not documented in ENVIRONMENTS.md section 2 - added because google-auth-library
  // needs it to verify the ID token audience. Should be added to that doc + Railway/Vercel envs.
  googleClientId: process.env.GOOGLE_CLIENT_ID,

  emailVerificationExpiresInMs: 24 * 60 * 60 * 1000,
  passwordResetExpiresInMs: 60 * 60 * 1000,

  resend: {
    apiKey: process.env.RESEND_API_KEY,
    emailFrom: process.env.EMAIL_FROM || 'noreply@example.com'
  }
};
