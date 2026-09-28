const { z } = require('zod');
const { textField } = require('../../shared/utils/zodHelpers');

const resolveDisputeSchema = z.object({
  ownerNote: textField('ownerNote', 1000).optional()
});

module.exports = { resolveDisputeSchema };
