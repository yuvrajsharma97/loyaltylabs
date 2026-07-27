// Express 4 doesn't forward rejected promises to the error handler on its own -
// every async route handler gets wrapped in this so a thrown/rejected AppError
// still reaches errorHandler.middleware.js instead of hanging the request.
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
