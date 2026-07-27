import client from './client';

export async function getMe() {
  const { data } = await client.get('/dashboard/customer/me');
  return data.data;
}

export async function updateMe(patch) {
  const { data } = await client.patch('/dashboard/customer/me', patch);
  return data.data;
}

export async function getQrToken() {
  const { data } = await client.get('/dashboard/customer/me/qr-token');
  return data.data;
}

export async function getTransactions({ limit, before, storeId } = {}) {
  const { data } = await client.get('/dashboard/customer/me/transactions', {
    params: { limit, before, storeId }
  });
  return data.data;
}

export async function createDispute({ storeId, transactionId, transactionType, customerNote }) {
  const { data } = await client.post('/dashboard/customer/me/disputes', {
    storeId,
    transactionId,
    transactionType,
    customerNote
  });
  return data.data;
}
