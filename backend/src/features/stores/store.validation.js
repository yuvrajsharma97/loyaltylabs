const { z } = require('zod');
const { titleField, textField, httpUrlField } = require('../../shared/utils/zodHelpers');

const updateStoreSchema = z
  .object({
    name: titleField('name').optional(),
    address: textField('address', 200).optional(),
    logoUrl: httpUrlField('logoUrl').optional(),
    category: z.enum(['cafe', 'retail', 'services', 'other']).optional(),
    discoverable: z.boolean().optional()
  })
  .refine((data) => Object.keys(data).length > 0, { error: 'At least one field must be provided' });

// Ranges match client/src/shared/utils/validation.js (NUMBER_RULES).
const updateLoyaltyConfigSchema = z
  .object({
    mode: z.enum(['per_currency', 'per_visit']).optional(),
    pointsPerUnit: z.number().min(0.01).max(1000).optional(),
    fixedPointsPerVisit: z.number().int().min(1).max(10000).optional(),
    minPurchase: z.number().min(0).max(10000).optional(),
    pointsExpiryDays: z.number().int().min(1).max(3650).nullable().optional(),
    maxPointsBalance: z.number().int().positive().max(1000000).nullable().optional()
  })
  .refine((data) => Object.keys(data).length > 0, { error: 'At least one field must be provided' });

const tillPinSchema = z.object({
  pin: z.string().regex(/^\d{4}$/, 'pin must be exactly 4 digits'),
  label: titleField('label', 40),
  active: z.boolean().optional()
});

const updateTillPinsSchema = z.object({
  tillPins: z.array(tillPinSchema).max(50, 'a store can have at most 50 till PINs')
});

module.exports = { updateStoreSchema, updateLoyaltyConfigSchema, updateTillPinsSchema };
