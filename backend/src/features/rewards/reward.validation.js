const { z } = require('zod');
const { requiredString } = require('../../shared/utils/zodHelpers');

const createRewardSchema = z.object({
  title: requiredString('title is required'),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  pointsRequired: z.number().positive('pointsRequired must be greater than 0'),
  rewardType: z.enum(['discount_percent', 'discount_fixed', 'free_item']),
  value: z.number().optional(),
  stockLimit: z.number().int().positive().nullable().optional(),
  validFrom: z.coerce.date().optional(),
  validTo: z.coerce.date().nullable().optional(),
  active: z.boolean().optional()
});

const updateRewardSchema = createRewardSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { error: 'At least one field must be provided' });

module.exports = { createRewardSchema, updateRewardSchema };
