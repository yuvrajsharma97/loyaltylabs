import client from './client';

export async function verifyEmail({ token, accountType }) {
  const { data } = await client.post('/auth/verify-email', { token, accountType });
  return data.data;
}

export async function resendVerification({ email, accountType }) {
  const { data } = await client.post('/auth/resend-verification', { email, accountType });
  return data.data;
}
