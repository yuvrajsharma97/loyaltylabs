const { Router } = require('express');
const handler = require('./reward.handler');
const schemas = require('./reward.validation');
const validate = require('../../shared/middleware/validate.middleware');
const { requireAuth, optionalAuth } = require('../../shared/middleware/auth.middleware');
const { requireRole } = require('../../shared/middleware/roleCheck.middleware');
const { loadOwnedStore } = require('../../shared/middleware/storeScope.middleware');

// Mounted at '/dashboard/store' in app.js, alongside store.routes.js's
// ownerRouter - the URL is a nested store resource even though rewards is
// its own feature slice. No blanket router.use() here deliberately - see the
// comment in customer.routes.js for why that would be unsafe when multiple
// routers share a mount prefix.
const router = Router();
const requireOwner = [requireAuth, requireRole('store_owner'), loadOwnedStore()];

router.get('/:id/rewards', optionalAuth, handler.listStoreRewards);
router.post('/:id/rewards', ...requireOwner, validate(schemas.createRewardSchema), handler.createReward);
router.patch('/:id/rewards/:rewardId', ...requireOwner, validate(schemas.updateRewardSchema), handler.updateReward);
router.delete('/:id/rewards/:rewardId', ...requireOwner, handler.deleteReward);

module.exports = router;
