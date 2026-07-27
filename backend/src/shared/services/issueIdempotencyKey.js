const crypto = require('crypto');
const env = require('../../config/env');

// Server-issued on /scan/identify and /scan/identify-by-slug, sent back
// unchanged by the till on /scan/earn. Format is `${issuedAt}.${signature}`
// - issuedAt replaces the plan's totpPeriod as the per-issuance uniqueness
// input now that TOTP is removed (see loyaltylabs-design-decisions memory).
// The till cannot forge a key for a different customer/store or fabricate
// one for a fake scan - it would need IDEMPOTENCY_SECRET.
function issueIdempotencyKey({ customerId, storeId }) {
  const issuedAt = Date.now();
  const signature = crypto
    .createHmac('sha256', env.idempotencySecret)
    .update(`${customerId}:${storeId}:${issuedAt}`)
    .digest('hex');

  return `${issuedAt}.${signature}`;
}

module.exports = { issueIdempotencyKey };
