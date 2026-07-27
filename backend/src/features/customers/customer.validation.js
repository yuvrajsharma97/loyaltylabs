const { z } = require('zod');
const { requiredString, enumField } = require('../../shared/utils/zodHelpers');

const updateProfileSchema = z
  .object({
    phone: z.string().optional(),
    interests: z.array(z.enum(['cafe', 'retail', 'services', 'other'])).optional(),
    onboardingCompleted: z.boolean().optional()
  })
  .refine((data) => Object.keys(data).length > 0, { error: 'At least one field must be provided' });

const createDisputeSchema = z.object({
  storeId: requiredString('storeId is required'),
  transactionId: requiredString('transactionId is required'),
  transactionType: enumField(
    ['earn', 'redemption', 'reversal'],
    'transactionType must be earn, redemption, or reversal'
  ),
  customerNote: requiredString('customerNote is required')
});

module.exports = { updateProfileSchema, createDisputeSchema };
