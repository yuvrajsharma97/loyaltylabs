const AppError = require('../utils/AppError');

// req.auth.role is always set by requireAuth: 'super_admin' | 'store_owner' | 'customer'.
// A customer's role is always exactly 'customer', so this single generic
// check also covers the user/customer type split without a separate helper.
function requireRole(...allowedRoles) {
  return function roleCheckMiddleware(req, res, next) {
    if (!req.auth || !allowedRoles.includes(req.auth.role)) {
      return next(new AppError('FORBIDDEN', "You don't have permission to do that", 403));
    }
    return next();
  };
}

module.exports = { requireRole };
