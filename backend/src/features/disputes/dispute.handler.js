const AppError = require('../../shared/utils/AppError');
const asyncHandler = require('../../shared/utils/asyncHandler');
const { isValidObjectId } = require('../../shared/utils/objectId');

const Dispute = require('./dispute.model');
const Store = require('../stores/store.model');

/**
 * Owner marks a dispute resolved, optionally adding a note. The URL param is
 * the dispute id, not a store id, so ownership is checked here rather than
 * via the storeScope middleware (which expects the store id directly).
 * @route PATCH /disputes/:id
 * @access Private (store_owner, owner of the store the dispute belongs to)
 * @body {string} [ownerNote]
 */
const resolveDispute = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { ownerNote } = req.body;

  if (!isValidObjectId(id)) {
    throw new AppError('DISPUTE_NOT_FOUND', 'Dispute not found', 404);
  }

  const dispute = await Dispute.findById(id);
  if (!dispute) {
    throw new AppError('DISPUTE_NOT_FOUND', 'Dispute not found', 404);
  }

  const store = await Store.findById(dispute.storeId);
  if (!store || store.ownerUserId.toString() !== req.auth.id) {
    throw new AppError('FORBIDDEN', "You don't have permission to do that", 403);
  }

  if (dispute.status === 'resolved') {
    throw new AppError('DISPUTE_ALREADY_RESOLVED', 'Already resolved', 409);
  }

  dispute.status = 'resolved';
  dispute.ownerNote = ownerNote || null;
  dispute.resolvedAt = new Date();
  await dispute.save();

  res.json({ success: true, data: { id: dispute._id, status: dispute.status, resolvedAt: dispute.resolvedAt } });
});

module.exports = { resolveDispute };
