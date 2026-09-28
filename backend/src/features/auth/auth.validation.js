const { z } = require('zod');
const {
  requiredString,
  emailField,
  enumField,
  phoneField,
  personNameField,
  titleField
} = require('../../shared/utils/zodHelpers');

// Strength is checked in the handlers (shared/utils/passwordStrength.js); this
// just caps the length so an enormous string never reaches bcrypt.
const passwordField = (name) =>
  requiredString(`${name} is required`).max(128, `${name} must be 128 characters or fewer`);

// `accountType` distinguishes the users collection (super_admin/store_owner)
// from the customers collection - the plan calls this the "separate auth
// surface" but documents only one shared set of endpoints for both.
const accountType = enumField(['user', 'customer'], 'accountType must be "user" or "customer"');

const registerCustomerSchema = z.object({
  name: personNameField('name'),
  email: emailField(),
  password: passwordField('password'),
  phone: phoneField().optional()
});

const verifyEmailSchema = z.object({
  token: requiredString('token is required'),
  accountType
});

const resendVerificationSchema = z.object({
  email: emailField(),
  accountType
});

const recoverQrSchema = z.object({
  email: emailField()
});

const registerStoreSchema = z.object({
  // ownerName/storeName/phone are deliberately optional here - collected
  // during store onboarding instead, so sign-up only asks for email +
  // password. registerStore fills in placeholders when they're absent.
  ownerName: personNameField('ownerName').optional(),
  storeName: titleField('storeName').optional(),
  email: emailField(),
  password: passwordField('password'),
  phone: phoneField().optional()
});

const loginSchema = z.object({
  email: emailField(),
  password: passwordField('password'),
  accountType
});

const googleSchema = z.object({
  idToken: requiredString('idToken is required')
});

const forgotPasswordSchema = z.object({
  email: emailField(),
  accountType
});

const resetPasswordSchema = z.object({
  token: requiredString('token is required'),
  newPassword: passwordField('newPassword'),
  accountType
});

const refreshSchema = z.object({
  refreshToken: requiredString('refreshToken is required')
});

const logoutSchema = z.object({
  refreshToken: requiredString('refreshToken is required')
});

// Signed-in account's own details. Email is deliberately not editable here -
// it's the login identity and gates verification/QR issuance.
const updateAccountSchema = z
  .object({
    name: personNameField('name').optional(),
    phone: phoneField().optional()
  })
  .refine((data) => Object.keys(data).length > 0, { error: 'At least one field must be provided' });

// currentPassword is optional only for a Google-only customer who has never
// set a password; the handler enforces it for everyone else.
const changePasswordSchema = z.object({
  currentPassword: z.string().max(128).optional(),
  newPassword: passwordField('newPassword'),
  // The caller's own refresh token, so that session survives while every
  // other device is signed out.
  refreshToken: z.string().optional()
});

module.exports = {
  registerCustomerSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  recoverQrSchema,
  registerStoreSchema,
  loginSchema,
  googleSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshSchema,
  logoutSchema,
  updateAccountSchema,
  changePasswordSchema
};
