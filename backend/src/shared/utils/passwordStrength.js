const AppError = require('./AppError');

// Minimum bar: 8+ chars, at least one letter and one number.
// Not in loyalty-saas-plan.md's explicit spec - ERROR_CODES.md just says
// "does not meet minimum requirements" without defining the rule, so this is
// a reasonable baseline you can tighten when you build this out further.
const MIN_LENGTH = 8;

function isPasswordStrongEnough(password) {
  if (typeof password !== 'string' || password.length < MIN_LENGTH) return false;
  if (!/[a-zA-Z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}

// Shared by every handler that accepts a new password (register x2,
// reset-password) so the check and its error can't drift between them.
function assertPasswordStrong(password) {
  if (!isPasswordStrongEnough(password)) {
    throw new AppError('PASSWORD_TOO_WEAK', 'Password does not meet minimum requirements', 400);
  }
}

module.exports = { isPasswordStrongEnough, assertPasswordStrong, MIN_LENGTH };
