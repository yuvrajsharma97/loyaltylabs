import apiClient from './client';

export function getMe() {
  return apiClient.get('/dashboard/customer/me');
}

export function updateMe(payload) {
  return apiClient.patch('/dashboard/customer/me', payload);
}

export function getQrToken() {
  return apiClient.get('/dashboard/customer/me/qr-token');
}

export function getTransactions({ page, limit, storeId } = {}) {
  return apiClient.get('/dashboard/customer/me/transactions', {
    params: { page, limit, storeId },
  });
}

export function createDispute({ storeId, transactionId, transactionType, customerNote }) {
  return apiClient.post('/dashboard/customer/me/disputes', {
    storeId,
    transactionId,
    transactionType,
    customerNote,
  });
}
