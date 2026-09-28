const { z } = require('zod');

function requiredString(message) {
  return z.string({ error: message }).min(1, message);
}

function emailField(message = 'a valid email is required') {
  return z.string({ error: message }).trim().toLowerCase().max(254, message).email(message);
}

function enumField(values, message) {
  return z.enum(values, { error: message });
}

// Field rules below mirror client/src/shared/utils/validation.js - the client
// checks first for friendly inline errors; these are the server-side guard
// for anything that bypasses the UI.

// Optional phone: digits plus + ( ) - and spaces, 7-15 digits. '' clears it.
function phoneField() {
  return z
    .string()
    .trim()
    .max(20, 'phone must be 20 characters or fewer')
    .refine((value) => value === '' || /^\+?[0-9\s()-]+$/.test(value), {
      error: 'phone may only contain digits, spaces, +, - and brackets'
    })
    .refine((value) => {
      if (value === '') return true;
      const digits = value.replace(/\D/g, '').length;
      return digits >= 7 && digits <= 15;
    }, { error: 'phone must have 7 to 15 digits' });
}

// A person's name: 2-80 characters with at least one letter.
function personNameField(label = 'name') {
  return z
    .string({ error: `${label} is required` })
    .trim()
    .min(2, `${label} must be at least 2 characters`)
    .max(80, `${label} must be 80 characters or fewer`)
    .refine((value) => /\p{L}/u.test(value), { error: `${label} must contain letters` })
    .refine((value) => !/[<>]/.test(value), { error: `${label} cannot contain < or >` });
}

// Shop/reward/till names: letters or digits required, no angle brackets.
function titleField(label, max = 80) {
  return z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be ${max} characters or fewer`)
    .refine((value) => /[\p{L}\p{N}]/u.test(value), { error: `${label} must contain letters or numbers` })
    .refine((value) => !/[<>]/.test(value), { error: `${label} cannot contain < or >` });
}

// Free text with a length cap (notes, descriptions, addresses).
function textField(label, max) {
  return z.string().trim().max(max, `${label} must be ${max} characters or fewer`);
}

// Optional http(s) URL. '' clears it. Rejects javascript:, data: and friends.
function httpUrlField(label = 'url') {
  return z
    .string()
    .trim()
    .max(500, `${label} is too long`)
    .refine((value) => {
      if (value === '') return true;
      try {
        const { protocol } = new URL(value);
        return protocol === 'https:' || protocol === 'http:';
      } catch {
        return false;
      }
    }, { error: `${label} must be a full http(s) address` });
}

module.exports = {
  requiredString,
  emailField,
  enumField,
  phoneField,
  personNameField,
  titleField,
  textField,
  httpUrlField
};
