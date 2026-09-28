import apiClient from './client';

// Public store directory - no auth required, even though it lives under the
// customer dashboard path (see backend/src/features/stores/store.routes.js).
// `membership` ('joined' | 'not_joined') only applies to a signed-in customer.
export function listStores({ category, search, membership, page, limit } = {}) {
  return apiClient.get('/dashboard/customer/stores', { params: { category, search, membership, page, limit } });
}

export function getPublicStore(storeId) {
  return apiClient.get(`/dashboard/customer/stores/${storeId}`);
}

export function joinStore(storeId) {
  return apiClient.post(`/dashboard/customer/stores/${storeId}/join`);
}

export function getMyStore() {
  return apiClient.get('/dashboard/store/mine');
}

export function getStore(storeId) {
  return apiClient.get(`/dashboard/store/${storeId}`);
}

export function updateStore(storeId, payload) {
  return apiClient.patch(`/dashboard/store/${storeId}`, payload);
}

export function getLoyaltyConfig(storeId) {
  return apiClient.get(`/dashboard/store/${storeId}/loyalty-config`);
}

export function updateLoyaltyConfig(storeId, payload) {
  return apiClient.patch(`/dashboard/store/${storeId}/loyalty-config`, payload);
}

export function getTillPins(storeId) {
  return apiClient.get(`/dashboard/store/${storeId}/till-pins`);
}

// Full-array replace - always send the complete desired list of PINs.
export function updateTillPins(storeId, tillPins) {
  return apiClient.patch(`/dashboard/store/${storeId}/till-pins`, { tillPins });
}

export function getOnboarding(storeId) {
  return apiClient.get(`/dashboard/store/${storeId}/onboarding`);
}

export function listStoreDisputes(storeId, { status, page, limit } = {}) {
  return apiClient.get(`/dashboard/store/${storeId}/disputes`, { params: { status, page, limit } });
}

export function listStoreTransactions(storeId, { page, limit, type, verificationMethod } = {}) {
  return apiClient.get(`/dashboard/store/${storeId}/transactions`, {
    params: { page, limit, type, verificationMethod },
  });
}

export function getStoreAnalytics(storeId) {
  return apiClient.get(`/dashboard/store/${storeId}/analytics`);
}
