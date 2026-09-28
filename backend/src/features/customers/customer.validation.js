const { z } = require('zod');
const {
  requiredString,
  enumField,
  phoneField,
  personNameField,
  textField
} = require('../../shared/utils/zodHelpers');

const updateProfileSchema = z
  .object({
    name: personNameField('name').optional(),
    phone: phoneField().optional(),
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
  customerNote: textField('customerNote', 1000).pipe(requiredString('customerNote is required'))
});

module.exports = { updateProfileSchema, createDisputeSchema };
