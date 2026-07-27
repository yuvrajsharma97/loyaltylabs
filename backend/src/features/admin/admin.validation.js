const { z } = require('zod');

const updateStoreStatusSchema = z.object({
  status: z.enum(['active', 'suspended'])
});

const reconcileSchema = z.object({
  confirm: z.boolean().optional()
});

module.exports = { updateStoreStatusSchema, reconcileSchema };
