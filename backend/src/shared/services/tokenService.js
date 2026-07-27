const jwt = require('jsonwebtoken');
const env = require('../../config/env');

// Dual-scope payload: `type` distinguishes a users-collection account
// (super_admin/store_owner) from a customers-collection account, since
// both share the same JWT_SECRET and access-token verification path.
//
// `purpose` distinguishes access vs refresh tokens. Both are signed with the
// same secret and would otherwise have an identical payload shape, so without
// this claim a leaked (long-lived) refresh token could be replayed directly
// as a Bearer access token - see verifyAccessToken/verifyRefreshToken below.
function signAccessToken({ id, type, role }) {
  return jwt.sign({ sub: id, type, role, purpose: 'access' }, env.jwt.secret, {
    expiresIn: env.jwt.accessExpiresIn
  });
}

function signRefreshToken({ id, type, role }) {
  return jwt.sign({ sub: id, type, role, purpose: 'refresh' }, env.jwt.secret, {
    expiresIn: env.jwt.refreshExpiresIn
  });
}

function verifyAccessToken(token) {
  const payload = jwt.verify(token, env.jwt.secret);
  if (payload.purpose !== 'access') {
    throw new jwt.JsonWebTokenError('Token is not an access token');
  }
  return payload;
}

function verifyRefreshToken(token) {
  const payload = jwt.verify(token, env.jwt.secret);
  if (payload.purpose !== 'refresh') {
    throw new jwt.JsonWebTokenError('Token is not a refresh token');
  }
  return payload;
}

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken };
