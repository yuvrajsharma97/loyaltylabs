import apiClient from './client';

export function listStores({ status, search, page, limit } = {}) {
  return apiClient.get('/dashboard/admin/stores', { params: { status, search, page, limit } });
}

export function updateStoreStatus(storeId, status) {
  return apiClient.patch(`/dashboard/admin/stores/${storeId}/status`, { status });
}

// Every transaction between two UK dates (YYYY-MM-DD, inclusive), compiled
// per day and per shop.
export function getTransactionReport({ from, to, storeId }) {
  return apiClient.get('/dashboard/admin/reports/transactions', { params: { from, to, storeId } });
}

export function getMetrics() {
  return apiClient.get('/dashboard/admin/metrics');
}

export function listDisputes({ status, page, limit } = {}) {
  return apiClient.get('/dashboard/admin/disputes', { params: { status, page, limit } });
}

export function reconcileStore(storeId, { confirm } = {}) {
  return apiClient.post(`/dashboard/admin/stores/${storeId}/reconcile`, { confirm });
}

export function listCustomers({ search, page, limit } = {}) {
  return apiClient.get('/dashboard/admin/customers', { params: { search, page, limit } });
}

export function getCustomer(customerId) {
  return apiClient.get(`/dashboard/admin/customers/${customerId}`);
}
