const { z } = require('zod');
const { titleField, textField, httpUrlField } = require('../../shared/utils/zodHelpers');

// What `value` means depends on rewardType. Shared by the create schema and
// updateReward (an update may change only one of the two, so the handler
// re-checks the merged result). Returns an error message, or null if valid.
function rewardValueProblem(rewardType, value) {
  if (rewardType === 'discount_percent') {
    if (!Number.isInteger(value) || value < 1 || value > 100) return 'value must be a whole percentage from 1 to 100';
  } else if (rewardType === 'discount_fixed') {
    if (typeof value !== 'number' || value < 0.01 || value > 10000) return 'value must be an amount from 0.01 to 10000';
    if (Math.round(value * 100) !== value * 100) return 'value can have at most 2 decimal places';
  }
  return null;
}

const rewardFields = {
  title: titleField('title', 80),
  description: textField('description', 300).optional(),
  imageUrl: httpUrlField('imageUrl').optional(),
  pointsRequired: z
    .number({ error: 'pointsRequired must be a number' })
    .int('pointsRequired must be a whole number')
    .min(1, 'pointsRequired must be at least 1')
    .max(1000000, 'pointsRequired must be 1,000,000 or less'),
  rewardType: z.enum(['discount_percent', 'discount_fixed', 'free_item']),
  value: z.number().optional(),
  stockLimit: z.number().int().positive().max(1000000).nullable().optional(),
  validFrom: z.coerce.date().optional(),
  validTo: z.coerce.date().nullable().optional(),
  active: z.boolean().optional()
};

const createRewardSchema = z.object(rewardFields).superRefine((data, ctx) => {
  const problem = rewardValueProblem(data.rewardType, data.value);
  if (problem) ctx.addIssue({ code: 'custom', path: ['value'], message: problem });
});

const updateRewardSchema = z
  .object(rewardFields)
  .partial()
  .refine((data) => Object.keys(data).length > 0, { error: 'At least one field must be provided' });

module.exports = { createRewardSchema, updateRewardSchema, rewardValueProblem };
