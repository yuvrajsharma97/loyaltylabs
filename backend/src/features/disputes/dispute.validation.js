const { z } = require('zod');

const resolveDisputeSchema = z.object({
  ownerNote: z.string().optional()
});

module.exports = { resolveDisputeSchema };
