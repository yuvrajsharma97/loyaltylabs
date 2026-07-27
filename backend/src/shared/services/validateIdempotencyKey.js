const crypto = require('crypto');
const env = require('../../config/env');

// Retry window per loyalty-saas-plan.md §4 token lifetimes table - checked
// here in application logic, NOT as a Mongo TTL deletion (the ledger is
// permanent; see transaction.model.js).
const IDEMPOTENCY_KEY_MAX_AGE_MS = 24 * 60 * 60 * 1000;

// `valid: false` means malformed or forged (IDEMPOTENCY_KEY_INVALID).
// `valid: true, expired: true` means a well-formed key past its 24h retry
// window (IDEMPOTENCY_KEY_EXPIRED) - distinct from invalid so the caller can
// give the till a more precise error.
function validateIdempotencyKey(key, { customerId, storeId }) {
  if (typeof key !== 'string' || !key.includes('.')) {
    return { valid: false, expired: false };
  }

  const [issuedAtStr, signature] = key.split('.');
  const issuedAt = Number(issuedAtStr);
  if (!Number.isFinite(issuedAt) || !signature) {
    return { valid: false, expired: false };
  }

  const expected = crypto
    .createHmac('sha256', env.idempotencySecret)
    .update(`${customerId}:${storeId}:${issuedAt}`)
    .digest('hex');

  const expectedBuf = Buffer.from(expected, 'hex');
  const signatureBuf = Buffer.from(signature, 'hex');
  const signatureMatches =
    expectedBuf.length === signatureBuf.length && crypto.timingSafeEqual(expectedBuf, signatureBuf);

  if (!signatureMatches) {
    return { valid: false, expired: false };
  }

  return { valid: true, expired: Date.now() - issuedAt > IDEMPOTENCY_KEY_MAX_AGE_MS };
}

module.exports = { validateIdempotencyKey, IDEMPOTENCY_KEY_MAX_AGE_MS };
