import apiClient from './client';

// Field set in the response differs by viewer: anonymous/customer callers get
// a smaller public shape, an authenticated owner viewing their own store gets
// the full shape (active, validFrom, stockLimit included). optionalAuth on
// the backend means this works whether or not a token is attached.
// Paginated, cheapest reward first.
export function listStoreRewards(storeId, { page, limit } = {}) {
  return apiClient.get(`/dashboard/store/${storeId}/rewards`, { params: { page, limit } });
}

export function createReward(storeId, payload) {
  return apiClient.post(`/dashboard/store/${storeId}/rewards`, payload);
}

export function updateReward(storeId, rewardId, payload) {
  return apiClient.patch(`/dashboard/store/${storeId}/rewards/${rewardId}`, payload);
}

export function deleteReward(storeId, rewardId) {
  return apiClient.delete(`/dashboard/store/${storeId}/rewards/${rewardId}`);
}
