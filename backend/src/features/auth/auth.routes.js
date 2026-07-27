const { Router } = require('express');
const handler = require('./auth.handler');
const schemas = require('./auth.validation');
const validate = require('../../shared/middleware/validate.middleware');
const {
  registrationLimiter,
  resendVerificationLimiter,
  authAttemptLimiter,
  refreshLimiter
} = require('../../shared/middleware/rateLimit.middleware');
const { requireAuth } = require('../../shared/middleware/auth.middleware');

const router = Router();

router.post(
  '/register/customer',
  registrationLimiter,
  validate(schemas.registerCustomerSchema),
  handler.registerCustomer
);

router.post('/verify-email', validate(schemas.verifyEmailSchema), handler.verifyEmail);

router.post(
  '/resend-verification',
  resendVerificationLimiter,
  validate(schemas.resendVerificationSchema),
  handler.resendVerification
);

router.post(
  '/recover-qr',
  authAttemptLimiter,
  validate(schemas.recoverQrSchema),
  handler.recoverQr
);

router.post(
  '/register/store',
  registrationLimiter,
  validate(schemas.registerStoreSchema),
  handler.registerStore
);

router.post('/login', authAttemptLimiter, validate(schemas.loginSchema), handler.login);

router.post('/google', validate(schemas.googleSchema), handler.google);

router.post(
  '/forgot-password',
  authAttemptLimiter,
  validate(schemas.forgotPasswordSchema),
  handler.forgotPassword
);

router.post(
  '/reset-password',
  authAttemptLimiter,
  validate(schemas.resetPasswordSchema),
  handler.resetPassword
);

router.post('/refresh', refreshLimiter, validate(schemas.refreshSchema), handler.refresh);

router.post('/logout', validate(schemas.logoutSchema), handler.logout);

router.post('/logout-all', requireAuth, handler.logoutAll);

module.exports = router;
