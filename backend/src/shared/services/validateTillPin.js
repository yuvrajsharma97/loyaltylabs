const AppError = require('../utils/AppError');

// Required + validated gate on every scan action that needs employee
// attribution (see loyaltylabs-design-decisions memory #5). Not account auth
// - the store owner's JWT already authenticates the till session, this only
// says which employee ran the scan.
function validateTillPin(store, pin) {
  if (!pin) {
    throw new AppError('TILL_PIN_REQUIRED', 'Enter your employee code to continue', 400);
  }

  const match = store.tillPins.find((entry) => entry.active && entry.pin === pin);
  if (!match) {
    throw new AppError('TILL_PIN_INVALID', 'Unknown employee code - check with the store owner', 403);
  }

  return match;
}

module.exports = { validateTillPin };
