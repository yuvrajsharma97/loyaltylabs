const { z } = require('zod');
const { requiredString } = require('../../shared/utils/zodHelpers');

const initiateRedemptionSchema = z.object({
  rewardId: requiredString('rewardId is required')
});

module.exports = { initiateRedemptionSchema };
