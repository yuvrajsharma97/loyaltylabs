const { z } = require('zod');
const { requiredString, emailField, enumField } = require('../../shared/utils/zodHelpers');

// `accountType` distinguishes the users collection (super_admin/store_owner)
// from the customers collection - the plan calls this the "separate auth
// surface" but documents only one shared set of endpoints for both.
const accountType = enumField(['user', 'customer'], 'accountType must be "user" or "customer"');

const registerCustomerSchema = z.object({
  name: requiredString('name is required'),
  email: emailField(),
  password: requiredString('password is required'),
  phone: z.string().optional()
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
  ownerName: z.string().optional(),
  storeName: z.string().optional(),
  email: emailField(),
  password: requiredString('password is required'),
  phone: z.string().optional()
});

const loginSchema = z.object({
  email: emailField(),
  password: requiredString('password is required'),
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
  newPassword: requiredString('newPassword is required'),
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
    name: z.string().trim().min(1, 'Name cannot be empty').max(80).optional(),
    phone: z.string().trim().max(30).optional()
  })
  .refine((data) => Object.keys(data).length > 0, { error: 'At least one field must be provided' });

// currentPassword is optional only for a Google-only customer who has never
// set a password; the handler enforces it for everyone else.
const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: requiredString('newPassword is required'),
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
