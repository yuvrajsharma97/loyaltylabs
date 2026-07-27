const { z } = require('zod');

const updateStoreSchema = z
  .object({
    name: z.string().min(1).optional(),
    address: z.string().optional(),
    logoUrl: z.string().optional(),
    category: z.enum(['cafe', 'retail', 'services', 'other']).optional(),
    discoverable: z.boolean().optional()
  })
  .refine((data) => Object.keys(data).length > 0, { error: 'At least one field must be provided' });

const updateLoyaltyConfigSchema = z
  .object({
    mode: z.enum(['per_currency', 'per_visit']).optional(),
    pointsPerUnit: z.number().nonnegative().optional(),
    fixedPointsPerVisit: z.number().nonnegative().optional(),
    minPurchase: z.number().nonnegative().optional(),
    pointsExpiryDays: z.number().int().positive().nullable().optional(),
    // Platform hard ceiling of 1,000,000 (see calculatePoints.js) applies
    // regardless of what an owner sets here.
    maxPointsBalance: z.number().int().positive().max(1000000).nullable().optional()
  })
  .refine((data) => Object.keys(data).length > 0, { error: 'At least one field must be provided' });

const tillPinSchema = z.object({
  pin: z.string().regex(/^\d{4}$/, 'pin must be exactly 4 digits'),
  label: z.string().min(1, 'label is required'),
  active: z.boolean().optional()
});

const updateTillPinsSchema = z.object({
  tillPins: z.array(tillPinSchema)
});

module.exports = { updateStoreSchema, updateLoyaltyConfigSchema, updateTillPinsSchema };
