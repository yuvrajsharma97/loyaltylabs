const { Router } = require('express');
const handler = require('./scan.handler');
const schemas = require('./scan.validation');
const validate = require('../../shared/middleware/validate.middleware');
const { requireAuth } = require('../../shared/middleware/auth.middleware');
const { requireRole } = require('../../shared/middleware/roleCheck.middleware');
const { loadOwnedStore } = require('../../shared/middleware/storeScope.middleware');

// Till Mode runs under the store owner's own account/JWT (plan section 2.1) -
// there's no separate "till" role. storeId travels in the body on every one
// of these, so loadOwnedStore reads from source:'body' and must run after
// validate() has parsed/normalized the body.
const router = Router();
const fromBody = loadOwnedStore({ source: 'body', field: 'storeId' });

router.use(requireAuth, requireRole('store_owner'));

router.post('/identify', validate(schemas.identifySchema), fromBody, handler.identify);
router.post('/identify-by-slug', validate(schemas.identifyBySlugSchema), fromBody, handler.identifyBySlug);
router.post('/earn', validate(schemas.earnSchema), fromBody, handler.earn);
router.post('/redeem', validate(schemas.redeemSchema), fromBody, handler.redeem);

module.exports = router;
