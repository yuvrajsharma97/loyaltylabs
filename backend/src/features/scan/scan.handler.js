const mongoose = require('mongoose');
const AppError = require('../../shared/utils/AppError');
const asyncHandler = require('../../shared/utils/asyncHandler');
const { validateTillPin } = require('../../shared/services/validateTillPin');
const { issueIdempotencyKey } = require('../../shared/services/issueIdempotencyKey');
const { validateIdempotencyKey } = require('../../shared/services/validateIdempotencyKey');
const { calculatePoints, applyPointsCap } = require('../../shared/services/calculatePoints');
const writeAuditLog = require('../../shared/services/writeAuditLog');

const Customer = require('../customers/customer.model');
const Store = require('../stores/store.model');
const Membership = require('../memberships/membership.model');
const PointTransaction = require('../transactions/transaction.model');
const Redemption = require('../redemptions/redemption.model');

const IDEMPOTENCY_WINDOW_MS = 24 * 60 * 60 * 1000;

// A till scan is itself a valid way to "join" a store's program, not just
// the directory - MEMBERSHIP_NOT_FOUND is documented as never surfacing to
// the UI, so both identify paths and /scan/earn auto-create on first sight.
async function findOrCreateMembership(customerId, storeId, session) {
  let membership = await Membership.findOne({ customerId, storeId }).session(session || null);
  if (!membership) {
    const created = await Membership.create([{ customerId, storeId }], session ? { session } : undefined);
    [membership] = created;
  }
  return membership;
}

function assertStoreActive(store) {
  if (store.status !== 'active') {
    throw new AppError('STORE_NOT_ACTIVE', 'This store account is suspended - contact support', 403);
  }
}

/**
 * Identify a customer from their static QR token (opaque, DB-lookup only -
 * see loyaltylabs-design-decisions memory #1). No till-PIN gate here - that's
 * enforced at /scan/earn, the action that actually needs employee
 * attribution. No replay/dedup check either, per the user's decision: the
 * QR is permanent like a physical card, and double-processing is guarded by
 * the till's Confirm-button-disable plus the server-issued idempotencyKey.
 * @route POST /scan/identify
 * @access Private (store_owner, till device)
 * @body {string} storeId
 * @body {string} qrToken
 */
const identify = asyncHandler(async (req, res) => {
  const { qrToken } = req.body;
  const store = req.store;

  assertStoreActive(store);

  const customer = await Customer.findOne({ qrCodeToken: qrToken });
  if (!customer) {
    throw new AppError('CUSTOMER_NOT_FOUND', 'Customer not found', 404);
  }

  const membership = await findOrCreateMembership(customer._id, store._id);
  const idempotencyKey = issueIdempotencyKey({ customerId: customer._id, storeId: store._id });

  res.json({
    success: true,
    data: {
      customerId: customer._id,
      name: customer.name,
      pointsBalance: membership.pointsBalance,
      idempotencyKey
    }
  });
});

/**
 * Manual fallback when the camera fails - cashier searches by slug and
 * visually confirms identity. Till-PIN required here (unlike /scan/identify)
 * since this path skips QR verification entirely.
 * @route POST /scan/identify-by-slug
 * @access Private (store_owner, till device)
 * @body {string} storeId
 * @body {string} slug
 * @body {string} tillPin
 */
const identifyBySlug = asyncHandler(async (req, res) => {
  const { slug, tillPin } = req.body;
  const store = req.store;

  assertStoreActive(store);
  validateTillPin(store, tillPin);

  const customer = await Customer.findOne({ slug });
  if (!customer) {
    throw new AppError('CUSTOMER_NOT_FOUND', 'Customer not found', 404);
  }

  const membership = await findOrCreateMembership(customer._id, store._id);
  const idempotencyKey = issueIdempotencyKey({ customerId: customer._id, storeId: store._id });

  res.json({
    success: true,
    data: {
      customerId: customer._id,
      name: customer.name,
      pointsBalance: membership.pointsBalance,
      idempotencyKey
    }
  });
});

/**
 * Award points for a purchase. The server-issued idempotencyKey makes
 * retries of the cashier's Confirm tap safe - a duplicate key returns the
 * original result instead of double-crediting.
 * @route POST /scan/earn
 * @access Private (store_owner, till device)
 * @body {string} storeId
 * @body {string} customerId
 * @body {number} purchaseAmount
 * @body {string} tillPin
 * @body {string} idempotencyKey
 * @body {'qr_scan'|'slug_manual'} verificationMethod
 */
const earn = asyncHandler(async (req, res) => {
  const { customerId, purchaseAmount, tillPin, idempotencyKey, verificationMethod } = req.body;
  const store = req.store;

  assertStoreActive(store);
  validateTillPin(store, tillPin);

  const { valid, expired } = validateIdempotencyKey(idempotencyKey, { customerId, storeId: store._id });
  if (!valid) {
    throw new AppError('IDEMPOTENCY_KEY_INVALID', "Session error - please scan the customer's QR again", 400);
  }

  const existing = await PointTransaction.findOne({ idempotencyKey });
  if (existing) {
    // Safe retry - the earn already happened, return the original result
    // rather than re-processing (till treats this as a normal success).
    const membership = await Membership.findOne({ customerId, storeId: store._id });
    return res.json({
      success: true,
      code: 'DUPLICATE_TRANSACTION',
      data: {
        newBalance: membership ? membership.pointsBalance : null,
        pointsAwarded: existing.points,
        pointsCapApplied: existing.pointsCapApplied,
        duplicate: true
      }
    });
  }

  if (expired) {
    throw new AppError('IDEMPOTENCY_KEY_EXPIRED', 'Session expired - please scan again', 400);
  }

  if (purchaseAmount < store.loyaltyProgram.minPurchase) {
    throw new AppError(
      'BELOW_MINIMUM_PURCHASE',
      `Minimum purchase for points is £${store.loyaltyProgram.minPurchase}`,
      400,
      { minPurchase: store.loyaltyProgram.minPurchase }
    );
  }

  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw new AppError('CUSTOMER_NOT_FOUND', 'Customer not found', 404);
  }

  const rawPoints = calculatePoints(purchaseAmount, store.loyaltyProgram);
  let result;

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const membership = await findOrCreateMembership(customerId, store._id, session);
      const { pointsAwarded, pointsCapApplied, newBalance } = applyPointsCap(
        membership.pointsBalance,
        rawPoints,
        store.loyaltyProgram.maxPointsBalance
      );

      await Membership.updateOne(
        { _id: membership._id },
        { $set: { pointsBalance: newBalance, lastActivityAt: new Date() } },
        { session }
      );

      await PointTransaction.create(
        [{
          storeId: store._id,
          customerId,
          performedByUserId: req.auth.id,
          tillPin,
          verificationMethod,
          idempotencyKey,
          idempotencyKeyExpiresAt: new Date(Date.now() + IDEMPOTENCY_WINDOW_MS),
          type: 'earn',
          points: pointsAwarded,
          purchaseAmount,
          pointsCapApplied
        }],
        { session }
      );

      if (!store.onboardingCompleted.tillModeTested) {
        await Store.updateOne(
          { _id: store._id },
          { $set: { 'onboardingCompleted.tillModeTested': true } },
          { session }
        );
      }

      result = { newBalance, pointsAwarded, pointsCapApplied };
    });
  } finally {
    session.endSession();
  }

  await writeAuditLog({
    actorUserId: req.auth.id,
    storeId: store._id,
    tillPin,
    action: 'scan.earn',
    target: String(customerId),
    metadata: { purchaseAmount, pointsAwarded: result.pointsAwarded }
  });

  res.json({ success: true, data: result });
});

/**
 * Fulfil a redemption code at the till - single atomic status flip. No
 * identity check beyond the code itself (redemption codes are intentionally
 * shareable, like a gift voucher - plan section 1).
 * @route POST /scan/redeem
 * @access Private (store_owner, till device)
 * @body {string} storeId
 * @body {string} redemptionCode
 * @body {string} tillPin
 */
const redeem = asyncHandler(async (req, res) => {
  const { redemptionCode, tillPin } = req.body;
  const store = req.store;

  assertStoreActive(store);
  validateTillPin(store, tillPin);

  const redemption = await Redemption.findOne({ redemptionCode, storeId: store._id });
  if (!redemption) {
    throw new AppError('REDEMPTION_NOT_FOUND', 'Code not recognised', 404);
  }
  if (redemption.status === 'fulfilled') {
    throw new AppError('REDEMPTION_ALREADY_USED', 'This reward has already been redeemed', 409);
  }
  if (redemption.status === 'cancelled') {
    throw new AppError('REDEMPTION_CANCELLED', 'This code has been cancelled', 409);
  }
  if (redemption.expiresAt < new Date()) {
    throw new AppError('REDEMPTION_EXPIRED', 'Code expired - ask customer to generate a new one', 410);
  }

  const updated = await Redemption.findOneAndUpdate(
    { _id: redemption._id, status: 'pending', expiresAt: { $gt: new Date() } },
    { $set: { status: 'fulfilled', tillPin, fulfilledByUserId: req.auth.id, fulfilledAt: new Date() } },
    { new: true }
  );

  if (!updated) {
    // Lost a race (already fulfilled/cancelled/expired between the read above and now).
    throw new AppError('REDEMPTION_ALREADY_USED', 'This reward has already been redeemed', 409);
  }

  if (!store.onboardingCompleted.tillModeTested) {
    await Store.updateOne({ _id: store._id }, { $set: { 'onboardingCompleted.tillModeTested': true } });
  }

  await writeAuditLog({
    actorUserId: req.auth.id,
    storeId: store._id,
    tillPin,
    action: 'scan.redeem',
    target: String(updated._id),
    metadata: { redemptionCode: updated.redemptionCode, pointsSpent: updated.pointsSpent }
  });

  res.json({
    success: true,
    data: { redemptionId: updated._id, rewardId: updated.rewardId, pointsSpent: updated.pointsSpent }
  });
});

module.exports = { identify, identifyBySlug, earn, redeem };
