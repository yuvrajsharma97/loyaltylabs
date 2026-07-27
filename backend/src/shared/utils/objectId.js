const mongoose = require('mongoose');

// Route params/body fields that reference documents by _id need this guard
// before querying - an invalid ObjectId string would otherwise throw a raw
// Mongoose CastError (bypassing the AppError envelope) instead of a clean
// *_NOT_FOUND response.
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

module.exports = { isValidObjectId };
