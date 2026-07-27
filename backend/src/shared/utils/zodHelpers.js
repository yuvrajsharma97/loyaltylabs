const { z } = require('zod');

// Small reusable field builders so every feature's *.validation.js gets
// consistent messages instead of each one hand-rolling `z.string({...})`.
// A field can be missing entirely (invalid_type) or present-but-empty
// (too_small) - both cases need the same custom message, hence passing it
// to both the schema-level `error` option and `.min(1, message)`.

function requiredString(message) {
  return z.string({ error: message }).min(1, message);
}

function emailField(message = 'a valid email is required') {
  return z.string({ error: message }).trim().toLowerCase().email(message);
}

function enumField(values, message) {
  return z.enum(values, { error: message });
}

module.exports = { requiredString, emailField, enumField };
