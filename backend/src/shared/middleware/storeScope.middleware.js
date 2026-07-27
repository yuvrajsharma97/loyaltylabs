const AppError = require('../utils/AppError');
const { isValidObjectId } = require('../utils/objectId');
const Store = require('../../features/stores/store.model');

// Loads the store referenced by the request and verifies the authenticated
// store_owner actually owns it, attaching the doc to req.store so handlers
// don't need a second fetch. Must run after requireAuth + requireRole
// ('store_owner'). `source`/`field` let callers pull the id from :params
// (owner dashboard routes) or the body (till endpoints, where storeId
// travels in the JSON payload) - so it must also run after validate().
function loadOwnedStore({ source = 'params', field = 'id' } = {}) {
  return async function storeScopeMiddleware(req, res, next) {
    try {
      const storeId = source === 'params' ? req.params[field] : req.body[field];

      if (!isValidObjectId(storeId)) {
        throw new AppError('STORE_NOT_FOUND', 'Store not found', 404);
      }

      const store = await Store.findById(storeId);
      if (!store) {
        throw new AppError('STORE_NOT_FOUND', 'Store not found', 404);
      }
      if (store.ownerUserId.toString() !== req.auth.id) {
        throw new AppError('FORBIDDEN', "You don't have permission to do that", 403);
      }

      req.store = store;
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = { loadOwnedStore };
