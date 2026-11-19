// Client-side input rules, checked before any request is sent. They mirror
// the backend (backend/src/shared/utils/zodHelpers.js) so the API is the
// safety net, not the first line of feedback.
//
// Two kinds of helper:
//  - sanitize*: used in onChange so a field can't hold impossible characters
//    at all (letters in a phone number, "e" in an amount).
//  - validate*: used on submit; return an error message, or null when valid.

export const LIMITS = {
  personName: 80,
  storeName: 80,
  address: 200,
  email: 254,
  password: 128,
  phone: 20,
  rewardTitle: 80,
  rewardDescription: 300,
  note: 1000,
  tillLabel: 40,
  customerCode: 80,
  redemptionCode: 128,
  url: 500,
};

// Allowed ranges for every numeric setting - shared by onboarding, Settings,
// Rewards and the till so the same field can't have different limits in
// different places. Kept in step with the backend schemas.
export const NUMBER_RULES = {
  pointsPerPound: { label: 'Points per £1', min: 0.01, max: 1000 },
  pointsPerVisit: { label: 'Points per visit', min: 1, max: 10000, integer: true },
  minPurchase: { label: 'Minimum purchase', min: 0, max: 10000, required: false },
  expiryDays: { label: 'Expiry', min: 1, max: 3650, integer: true, required: false },
  maxBalance: { label: 'Maximum balance', min: 1, max: 1000000, integer: true, required: false },
  rewardPoints: { label: 'Points required', min: 1, max: 1000000, integer: true },
  percentOff: { label: 'Percent off', min: 1, max: 100, integer: true },
  amountOff: { label: 'Amount off', min: 0.01, max: 10000 },
  stockLimit: { label: 'Stock limit', min: 1, max: 1000000, integer: true, required: false },
  purchaseAmount: { label: 'Purchase amount', min: 0.01, max: 99999.99 },
};

// ---- sanitizers (onChange) -------------------------------------------------

// Digits plus the separators people type in phone numbers: + space ( ) -
export const sanitizePhone = (value) => value.replace(/[^0-9+\s()-]/g, '').slice(0, LIMITS.phone);

// Whole numbers only, e.g. points.
export const sanitizeInteger = (value, maxDigits = 7) => value.replace(/\D/g, '').slice(0, maxDigits);

// Decimal numbers with at most `maxDecimals` places, e.g. £ amounts.
export function sanitizeDecimal(value, { maxDecimals = 2, maxIntegerDigits = 6 } = {}) {
  const cleaned = value.replace(',', '.').replace(/[^0-9.]/g, '');
  const [integerPart, ...rest] = cleaned.split('.');
  const integer = integerPart.slice(0, maxIntegerDigits);
  if (rest.length === 0) return integer;
  return `${integer}.${rest.join('').slice(0, maxDecimals)}`;
}

export const sanitizePin = (value) => value.replace(/\D/g, '').slice(0, 4);

// ---- validators (submit) ---------------------------------------------------

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(value) {
  const email = value.trim();
  if (!email) return 'Enter your email address.';
  if (email.length > LIMITS.email || !EMAIL_PATTERN.test(email)) {
    return 'Enter a valid email address, like name@example.com.';
  }
  return null;
}

export function validatePhone(value, { required = false } = {}) {
  const phone = value.trim();
  if (!phone) return required ? 'Enter a phone number.' : null;
  if (!/^\+?[0-9\s()-]+$/.test(phone)) return 'Use digits only - spaces, +, - and brackets are fine.';
  const digitCount = phone.replace(/\D/g, '').length;
  if (digitCount < 7 || digitCount > 15) return 'Enter a phone number with 7 to 15 digits.';
  return null;
}

// A person's name: needs at least one letter.
export function validatePersonName(value, { label = 'Name', required = true } = {}) {
  const name = value.trim();
  if (!name) return required ? `Enter ${label.toLowerCase()}.` : null;
  if (name.length < 2) return `${label} must be at least 2 characters.`;
  if (name.length > LIMITS.personName) return `${label} must be ${LIMITS.personName} characters or fewer.`;
  if (!/\p{L}/u.test(name)) return `${label} must contain letters.`;
  if (/[<>]/.test(name)) return `${label} can't contain < or >.`;
  return null;
}

// Shop or reward names: letters or digits required ("7 Eleven" is fine).
export function validateTitle(value, { label = 'Name', required = true, max = LIMITS.storeName } = {}) {
  const title = value.trim();
  if (!title) return required ? `Enter ${label.toLowerCase()}.` : null;
  if (title.length > max) return `${label} must be ${max} characters or fewer.`;
  if (!/[\p{L}\p{N}]/u.test(title)) return `${label} must contain letters or numbers.`;
  if (/[<>]/.test(title)) return `${label} can't contain < or >.`;
  return null;
}

export function validateText(value, { label = 'This field', required = false, max = LIMITS.note } = {}) {
  const text = value.trim();
  if (!text) return required ? `Enter ${label.toLowerCase()}.` : null;
  if (text.length > max) return `${label} must be ${max} characters or fewer.`;
  return null;
}

// Mirrors backend/src/shared/utils/passwordStrength.js.
export function validatePassword(value, { label = 'Password' } = {}) {
  if (!value) return `Enter a ${label.toLowerCase()}.`;
  if (value.length < 8) return `${label} must be at least 8 characters.`;
  if (value.length > LIMITS.password) return `${label} must be ${LIMITS.password} characters or fewer.`;
  if (!/[a-zA-Z]/.test(value) || !/[0-9]/.test(value)) return `${label} needs at least one letter and one number.`;
  return null;
}

export function validateHttpUrl(value, { label = 'URL', required = false } = {}) {
  const url = value.trim();
  if (!url) return required ? `Enter a ${label.toLowerCase()}.` : null;
  if (url.length > LIMITS.url) return `${label} is too long.`;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw new Error('bad protocol');
  } catch {
    return `Enter a full web address starting with https://`;
  }
  return null;
}

// `value` is the raw string from a sanitized field.
export function validateNumber(value, { label = 'Value', required = true, min, max, integer = false } = {}) {
  const raw = String(value ?? '').trim();
  if (!raw) return required ? `Enter ${label.toLowerCase()}.` : null;
  const number = Number(raw);
  if (!Number.isFinite(number)) return `${label} must be a number.`;
  if (integer && !Number.isInteger(number)) return `${label} must be a whole number.`;
  if (min !== undefined && number < min) return `${label} must be at least ${min}.`;
  if (max !== undefined && number > max) return `${label} must be ${max.toLocaleString()} or less.`;
  return null;
}

export function validatePin(value) {
  if (!/^\d{4}$/.test(value)) return 'PIN must be exactly 4 digits.';
  return null;
}

// Customer codes are slugs like "alice-johnson-c4570bfd".
export function validateCustomerCode(value) {
  const code = value.trim();
  if (!code) return "Enter the customer's code.";
  if (code.length > LIMITS.customerCode || !/^[a-z0-9-]+$/i.test(code)) {
    return 'Codes only contain letters, numbers and dashes.';
  }
  return null;
}

// Redemption codes are 64-character hex strings.
export function validateRedemptionCode(value) {
  const code = value.trim();
  if (!code) return 'Enter the reward code.';
  if (!/^[a-f0-9]+$/i.test(code) || code.length > LIMITS.redemptionCode) {
    return "That doesn't look like a reward code - check it and try again.";
  }
  return null;
}

// True when any field in an errors object has a message.
export const hasErrors = (errors) => Object.values(errors).some(Boolean);
