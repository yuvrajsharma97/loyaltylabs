const { Router } = require('express');
const handler = require('./redemption.handler');
const schemas = require('./redemption.validation');
const validate = require('../../shared/middleware/validate.middleware');
const { requireAuth } = require('../../shared/middleware/auth.middleware');
const { requireRole } = require('../../shared/middleware/roleCheck.middleware');
const { redemptionInitiateLimiter } = require('../../shared/middleware/rateLimit.middleware');

// Customer generates a redemption code.
const customerRouter = Router();
customerRouter.post(
  '/initiate',
  requireAuth,
  requireRole('customer'),
  redemptionInitiateLimiter,
  validate(schemas.initiateRedemptionSchema),
  handler.initiate
);

// Owner cancels a still-pending one.
const ownerRouter = Router();
ownerRouter.post('/:id/cancel', requireAuth, requireRole('store_owner'), handler.cancel);

module.exports = { customerRouter, ownerRouter };
