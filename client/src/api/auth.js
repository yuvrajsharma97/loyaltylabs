import apiClient from './client';

export function registerCustomer({ name, email, password, phone }) {
  return apiClient.post('/auth/register/customer', { name, email, password, phone });
}

export function registerStore({ ownerName, storeName, email, password, phone }) {
  return apiClient.post('/auth/register/store', { ownerName, storeName, email, password, phone });
}

export function login({ email, password, accountType }) {
  return apiClient.post('/auth/login', { email, password, accountType });
}

export function loginWithGoogle({ idToken }) {
  return apiClient.post('/auth/google', { idToken });
}

export function verifyEmail({ token, accountType }) {
  return apiClient.post('/auth/verify-email', { token, accountType });
}

export function resendVerification({ email, accountType }) {
  return apiClient.post('/auth/resend-verification', { email, accountType });
}

export function recoverQr({ email }) {
  return apiClient.post('/auth/recover-qr', { email });
}

export function forgotPassword({ email, accountType }) {
  return apiClient.post('/auth/forgot-password', { email, accountType });
}

export function resetPassword({ token, newPassword, accountType }) {
  return apiClient.post('/auth/reset-password', { token, newPassword, accountType });
}

export function logout({ refreshToken }) {
  return apiClient.post('/auth/logout', { refreshToken });
}

export function logoutAll() {
  return apiClient.post('/auth/logout-all');
}

// The signed-in account's own name/phone (email is read-only).
export function getAccount() {
  return apiClient.get('/auth/account');
}

export function updateAccount({ name, phone }) {
  return apiClient.patch('/auth/account', { name, phone });
}

// Signs out every other session; refreshToken keeps the current one.
export function changePassword({ currentPassword, newPassword, refreshToken }) {
  return apiClient.post('/auth/change-password', { currentPassword, newPassword, refreshToken });
}
