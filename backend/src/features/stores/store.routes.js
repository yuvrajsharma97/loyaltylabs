const { Router } = require('express');
const handler = require('./store.handler');
const schemas = require('./store.validation');
const validate = require('../../shared/middleware/validate.middleware');
const { requireAuth, optionalAuth } = require('../../shared/middleware/auth.middleware');
const { requireRole } = require('../../shared/middleware/roleCheck.middleware');
const { loadOwnedStore } = require('../../shared/middleware/storeScope.middleware');

const requireOwner = [requireAuth, requireRole('store_owner'), loadOwnedStore()];

// Public directory browsing + joining a store's program - mounted under the
// customer dashboard namespace in app.js even though listStores itself needs
// no auth (browsing before signup/verification is allowed).
const customerRouter = Router();
// optionalAuth: anonymous browsing still works; a signed-in customer can also
// filter by membership (joined / not joined).
customerRouter.get('/', optionalAuth, handler.listStores);
customerRouter.get('/:id', handler.getPublicStore);
customerRouter.post('/:id/join', requireAuth, requireRole('customer'), handler.joinStore);

// Store-owner dashboard: manage the store itself.
const ownerRouter = Router();
// Must be registered before '/:id' - otherwise Express would treat "mine" as
// the :id value and 404 it via isValidObjectId before ever reaching this handler.
ownerRouter.get('/mine', requireAuth, requireRole('store_owner'), handler.getMyStore);
ownerRouter.get('/:id', ...requireOwner, handler.getStore);
ownerRouter.patch('/:id', ...requireOwner, validate(schemas.updateStoreSchema), handler.updateStore);

ownerRouter.get('/:id/loyalty-config', ...requireOwner, handler.getLoyaltyConfig);
ownerRouter.patch(
  '/:id/loyalty-config',
  ...requireOwner,
  validate(schemas.updateLoyaltyConfigSchema),
  handler.updateLoyaltyConfig
);

ownerRouter.get('/:id/till-pins', ...requireOwner, handler.getTillPins);
ownerRouter.patch(
  '/:id/till-pins',
  ...requireOwner,
  validate(schemas.updateTillPinsSchema),
  handler.updateTillPins
);

ownerRouter.get('/:id/onboarding', ...requireOwner, handler.getOnboarding);
ownerRouter.get('/:id/disputes', ...requireOwner, handler.listStoreDisputes);
ownerRouter.get('/:id/transactions', ...requireOwner, handler.listStoreTransactions);
ownerRouter.get('/:id/analytics', ...requireOwner, handler.getStoreAnalytics);

module.exports = { customerRouter, ownerRouter };
