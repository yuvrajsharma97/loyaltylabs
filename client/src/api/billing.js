import apiClient from './client';

// storeId is a query param here, unlike almost every other store-scoped
// route (which use a :id URL segment).
export function getUsage(storeId) {
  return apiClient.get('/dashboard/store/billing/usage', { params: { storeId } });
}

export function getHistory(storeId, { page, limit } = {}) {
  return apiClient.get('/dashboard/store/billing/history', { params: { storeId, page, limit } });
}
