const AppError = require('../utils/AppError');

// Generic Zod <-> Express adapter. Unlike express-validator, Zod schemas
// aren't Express-aware, so every feature's *.validation.js exports plain
// z.object() schemas and routes wrap them with validate(schema) here.
// Replaces req.body with the parsed result so transforms (trim/toLowerCase
// on emails, etc.) actually take effect for the handler.
function validate(schema) {
  return function validateMiddleware(req, res, next) {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return next(
        new AppError('VALIDATION_ERROR', 'Request body failed validation', 400, {
          errors: result.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        })
      );
    }

    req.body = result.data;
    return next();
  };
}

module.exports = validate;
