const crypto = require('crypto');
const env = require('../../config/env');

// Design decision (resolved 2026-07-01): the QR identity token is an opaque
// HMAC digest, stored verbatim as customer.qrCodeToken (unique indexed).
// Verification later (in the scan feature) is a DB lookup by exact match on
// this value, NOT decoding - see memory: loyaltylabs-design-decisions.
function generateQrCodeToken(customerId, qrSalt) {
  return crypto
    .createHmac('sha256', env.qrSigningSecret)
    .update(`${customerId}${qrSalt}`)
    .digest('hex');
}

function generateQrSalt() {
  return crypto.randomBytes(16).toString('hex');
}

module.exports = { generateQrCodeToken, generateQrSalt };
