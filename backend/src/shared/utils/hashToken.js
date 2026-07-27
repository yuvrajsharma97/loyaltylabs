const crypto = require('crypto');

// Used for email verification + password reset tokens: the raw token goes in
// the emailed link, only its sha256 hash is ever stored ("hashed; cleared
// after use" per loyalty-saas-plan.md section 4).
function generateRawToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

// Shared by every "email a token, store only its hash" flow (email
// verification, password reset, QR recovery) so the raw/hash/expiry
// generation can't drift between them.
function issueHashedToken(expiresInMs) {
  const rawToken = generateRawToken();
  return {
    rawToken,
    hashedToken: hashToken(rawToken),
    expiresAt: new Date(Date.now() + expiresInMs)
  };
}

module.exports = { generateRawToken, hashToken, issueHashedToken };
