const PLATFORM_MAX_POINTS_BALANCE = 1000000;

// loyaltyProgram.mode: 'per_currency' -> floor(purchaseAmount * pointsPerUnit); 'per_visit' -> flat award.
function calculatePoints(purchaseAmount, loyaltyProgram) {
  const raw =
    loyaltyProgram.mode === 'per_visit'
      ? loyaltyProgram.fixedPointsPerVisit
      : Math.floor(purchaseAmount * loyaltyProgram.pointsPerUnit);

  return Math.max(0, raw);
}

// Applies the store's maxPointsBalance (nullable) and the platform's hard
// ceiling, whichever is lower - a partial award is still an award, not a
// rejection (see POINTS_CAP_REACHED: 200, not an error).
function applyPointsCap(currentBalance, pointsToAdd, storeMaxPointsBalance) {
  const ceiling =
    storeMaxPointsBalance != null
      ? Math.min(storeMaxPointsBalance, PLATFORM_MAX_POINTS_BALANCE)
      : PLATFORM_MAX_POINTS_BALANCE;

  const uncapped = currentBalance + pointsToAdd;
  if (uncapped <= ceiling) {
    return { pointsAwarded: pointsToAdd, pointsCapApplied: false, newBalance: uncapped };
  }

  const pointsAwarded = Math.max(0, ceiling - currentBalance);
  return { pointsAwarded, pointsCapApplied: true, newBalance: ceiling };
}

module.exports = { calculatePoints, applyPointsCap, PLATFORM_MAX_POINTS_BALANCE };
