const { Router } = require('express');
const handler = require('./billing.handler');
const { requireAuth } = require('../../shared/middleware/auth.middleware');
const { requireRole } = require('../../shared/middleware/roleCheck.middleware');

const router = Router();

router.use(requireAuth, requireRole('store_owner'));

router.get('/usage', handler.getUsage);
router.get('/history', handler.getHistory);

module.exports = router;
