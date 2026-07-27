const rateLimit = require('express-rate-limit');
const AppError = require('../utils/AppError');

const WINDOW_MS = 15 * 60 * 1000;

// IP + email keying: a shared IP shouldn't block someone else's account, and
// a single account shouldn't be able to spam itself from a rotating IP.
function byIpAndEmail(req) {
  return `${req.ip}:${(req.body && req.body.email) || ''}`;
}

function makeLimiter({ limit, code, message, keyGenerator, windowMs = WINDOW_MS }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    ...(keyGenerator ? { keyGenerator } : {}),
    handler: (req, res, next) => {
      next(new AppError(code, message, 429));
    }
  });
}

const registrationLimiter = makeLimiter({
  limit: 5,
  code: 'REGISTRATION_RATE_LIMIT',
  message: 'Too many registrations - try again later'
});

const resendVerificationLimiter = makeLimiter({
  limit: 3,
  code: 'RESEND_LIMIT_REACHED',
  message: 'Too many attempts - try again in a few minutes',
  keyGenerator: byIpAndEmail
});

// Brute-force protection for credential-guessing endpoints: login, and
// anything that accepts a token from an email link (forgot/reset/recover).
const authAttemptLimiter = makeLimiter({
  limit: 10,
  code: 'AUTH_RATE_LIMIT',
  message: 'Too many attempts - try again later',
  keyGenerator: byIpAndEmail
});

// Refresh-token exchange has no email in the body to key on - limit by IP
// only, generously enough to not disrupt legitimate token refresh traffic.
const refreshLimiter = makeLimiter({
  limit: 30,
  code: 'AUTH_RATE_LIMIT',
  message: 'Too many attempts - try again later'
});

// Circuit-breaker against bugs/automation (design intent: points deduction
// itself is already atomic) - keyed per customer account since the caller is
// authenticated here, unlike the IP/email-keyed auth limiters above.
const redemptionInitiateLimiter = makeLimiter({
  windowMs: 60 * 1000,
  limit: 5,
  code: 'REDEMPTION_RATE_LIMIT',
  message: 'Too many attempts - wait a moment',
  keyGenerator: (req) => req.auth.id
});

module.exports = {
  registrationLimiter,
  resendVerificationLimiter,
  authAttemptLimiter,
  refreshLimiter,
  redemptionInitiateLimiter
};
