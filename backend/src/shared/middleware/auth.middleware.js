const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const { verifyAccessToken } = require('../services/tokenService');

// Verifies the access token and attaches { id, type, role } to req.auth.
// `type` is 'user' (super_admin/store_owner) or 'customer' - the dual-scope
// distinction mentioned in the plan's tech stack section.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new AppError('UNAUTHORISED', 'Request has no valid authentication', 401));
  }

  try {
    const payload = verifyAccessToken(token);
    req.auth = { id: payload.sub, type: payload.type, role: payload.role };
    return next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new AppError('TOKEN_EXPIRED', 'Access token has expired', 401));
    }
    return next(new AppError('UNAUTHORISED', 'Request has no valid authentication', 401));
  }
}

// Same verification as requireAuth, but a missing/invalid token is treated
// as anonymous rather than rejected - for routes that serve both the public
// (e.g. a customer browsing before joining) and an authenticated owner with
// a richer view (GET /stores/:id/rewards).
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme === 'Bearer' && token) {
    try {
      const payload = verifyAccessToken(token);
      req.auth = { id: payload.sub, type: payload.type, role: payload.role };
    } catch (err) {
      // Invalid/expired token on an optionally-authenticated route - fall through as anonymous.
    }
  }

  return next();
}

module.exports = { requireAuth, optionalAuth };
