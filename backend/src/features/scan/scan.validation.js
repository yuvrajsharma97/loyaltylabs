const { z } = require('zod');
const { requiredString } = require('../../shared/utils/zodHelpers');

const identifySchema = z.object({
  storeId: requiredString('storeId is required'),
  qrToken: requiredString('qrToken is required')
});

// Staff-entered values - the till PIN is always 4 digits, customer codes are
// lowercase slugs, reward codes are hex.
const tillPin = z.string({ error: 'tillPin is required' }).regex(/^\d{4}$/, 'tillPin must be exactly 4 digits');

const identifyBySlugSchema = z.object({
  storeId: requiredString('storeId is required'),
  slug: z
    .string({ error: 'slug is required' })
    .trim()
    .toLowerCase()
    .min(1, 'slug is required')
    .max(80, 'slug is too long')
    .regex(/^[a-z0-9-]+$/, 'slug may only contain letters, numbers and dashes'),
  tillPin
});

const earnSchema = z.object({
  storeId: requiredString('storeId is required'),
  customerId: requiredString('customerId is required'),
  purchaseAmount: z
    .number({ error: 'purchaseAmount is required' })
    .nonnegative('purchaseAmount must be zero or greater')
    .max(99999.99, 'purchaseAmount must be 99,999.99 or less'),
  tillPin,
  idempotencyKey: requiredString('idempotencyKey is required'),
  verificationMethod: z.enum(['qr_scan', 'slug_manual'], {
    error: 'verificationMethod must be qr_scan or slug_manual'
  })
});

const redeemSchema = z.object({
  storeId: requiredString('storeId is required'),
  redemptionCode: z
    .string({ error: 'redemptionCode is required' })
    .trim()
    .toLowerCase()
    .min(1, 'redemptionCode is required')
    .max(128, 'redemptionCode is too long')
    .regex(/^[a-f0-9]+$/, 'redemptionCode is not a valid code'),
  tillPin
});

module.exports = { identifySchema, identifyBySlugSchema, earnSchema, redeemSchema };
