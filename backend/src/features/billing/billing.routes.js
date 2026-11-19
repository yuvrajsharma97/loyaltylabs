const { Router } = require('express');
const handler = require('./billing.handler');
const schemas = require('./billing.validation');
const validate = require('../../shared/middleware/validate.middleware');
const { requireAuth } = require('../../shared/middleware/auth.middleware');
const { requireRole } = require('../../shared/middleware/roleCheck.middleware');

const router = Router();

router.use(requireAuth, requireRole('store_owner'));

router.get('/usage', handler.getUsage);
router.get('/history', handler.getHistory);
router.patch('/plan', validate(schemas.changePlanSchema), handler.changePlan);

module.exports = router;
