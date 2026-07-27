const { z } = require('zod');
const { requiredString } = require('../../shared/utils/zodHelpers');

const identifySchema = z.object({
  storeId: requiredString('storeId is required'),
  qrToken: requiredString('qrToken is required')
});

const identifyBySlugSchema = z.object({
  storeId: requiredString('storeId is required'),
  slug: requiredString('slug is required'),
  tillPin: requiredString('tillPin is required')
});

const earnSchema = z.object({
  storeId: requiredString('storeId is required'),
  customerId: requiredString('customerId is required'),
  purchaseAmount: z.number({ error: 'purchaseAmount is required' }).nonnegative('purchaseAmount must be zero or greater'),
  tillPin: requiredString('tillPin is required'),
  idempotencyKey: requiredString('idempotencyKey is required'),
  verificationMethod: z.enum(['qr_scan', 'slug_manual'], {
    error: 'verificationMethod must be qr_scan or slug_manual'
  })
});

const redeemSchema = z.object({
  storeId: requiredString('storeId is required'),
  redemptionCode: requiredString('redemptionCode is required'),
  tillPin: requiredString('tillPin is required')
});

module.exports = { identifySchema, identifyBySlugSchema, earnSchema, redeemSchema };
