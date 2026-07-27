const AppError = require('../utils/AppError');

function notFoundHandler(req, res, next) {
  next(new AppError('NOT_FOUND', 'Not found', 404));
}

function buildErrorEnvelope(code, message, details = {}) {
  return {
    success: false,
    code,
    message,
    details
  };
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(buildErrorEnvelope(err.code, err.message, err.details));
  }

  console.error(err);
  return res
    .status(500)
    .json(buildErrorEnvelope('INTERNAL_ERROR', 'Something went wrong - try again'));
}

module.exports = { notFoundHandler, errorHandler };
