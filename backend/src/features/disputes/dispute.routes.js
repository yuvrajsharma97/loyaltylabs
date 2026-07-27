const { Router } = require('express');
const handler = require('./dispute.handler');
const schemas = require('./dispute.validation');
const validate = require('../../shared/middleware/validate.middleware');
const { requireAuth } = require('../../shared/middleware/auth.middleware');
const { requireRole } = require('../../shared/middleware/roleCheck.middleware');

// Mounted at '/disputes' in app.js. Dispute *creation* (POST
// /customers/me/disputes) lives in the customers feature - see
// architecture-feature-slices memory (cross-feature uses model, not handler).
const router = Router();

router.patch(
  '/:id',
  requireAuth,
  requireRole('store_owner'),
  validate(schemas.resolveDisputeSchema),
  handler.resolveDispute
);

module.exports = router;
