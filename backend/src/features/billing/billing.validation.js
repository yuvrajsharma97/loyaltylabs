const { z } = require('zod');
const { PLAN_IDS } = require('./billing.plans');

const planField = () => z.enum(PLAN_IDS, { message: `plan must be one of: ${PLAN_IDS.join(', ')}` });

const changePlanSchema = z.object({
  plan: planField()
});

module.exports = { planField, changePlanSchema };
