const { Router } = require('express');
const handler = require('./customer.handler');
const schemas = require('./customer.validation');
const validate = require('../../shared/middleware/validate.middleware');
const { requireAuth } = require('../../shared/middleware/auth.middleware');
const { requireRole } = require('../../shared/middleware/roleCheck.middleware');

// Mounted at '/dashboard/customer/me' in app.js (not just '/dashboard/customer')
// deliberately - the sibling stores/redeem routers are also mounted under
// '/dashboard/customer/...'. If this router's own mount prefix were the
// bare parent path, Express's prefix-based app.use() matching would run
// this router's blanket auth gate on every request under that prefix,
// including ones meant for the sibling routers (e.g. the public,
// unauthenticated store directory at '/dashboard/customer/stores') - it
// would 401 them before they ever reached their actual handler. Keeping
// this router's mount and its siblings' mounts as non-overlapping paths
// avoids that entirely.
const router = Router();

router.use(requireAuth, requireRole('customer'));

router.get('/', handler.getMe);
router.patch('/', validate(schemas.updateProfileSchema), handler.updateMe);
router.get('/qr-token', handler.getQrToken);
router.get('/transactions', handler.getTransactions);
router.post('/disputes', validate(schemas.createDisputeSchema), handler.createDispute);

module.exports = router;
