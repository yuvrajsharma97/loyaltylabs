const { Router } = require('express');
const handler = require('./admin.handler');
const schemas = require('./admin.validation');
const validate = require('../../shared/middleware/validate.middleware');
const { requireAuth } = require('../../shared/middleware/auth.middleware');
const { requireRole } = require('../../shared/middleware/roleCheck.middleware');

const router = Router();

router.use(requireAuth, requireRole('super_admin'));

router.get('/stores', handler.listStores);
router.patch('/stores/:id/status', validate(schemas.updateStoreStatusSchema), handler.updateStoreStatus);
router.get('/metrics', handler.getMetrics);
router.get('/disputes', handler.listDisputes);
router.post('/stores/:id/reconcile', validate(schemas.reconcileSchema), handler.reconcile);

module.exports = router;
