// loyaltyProgram.mode: 'per_currency' -> floor(purchaseAmount * pointsPerUnit); 'per_visit' -> flat award.
function calculatePoints(purchaseAmount, loyaltyProgram) {
  const raw =
    loyaltyProgram.mode === 'per_visit'
      ? loyaltyProgram.fixedPointsPerVisit
      : Math.floor(purchaseAmount * loyaltyProgram.pointsPerUnit);

  return Math.max(0, raw);
}

// There is no cap on a customer's balance: every point earned is credited.
module.exports = { calculatePoints };
