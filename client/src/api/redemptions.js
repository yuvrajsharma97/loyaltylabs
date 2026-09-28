import apiClient from './client';

export function initiateRedemption(rewardId) {
  return apiClient.post('/dashboard/customer/redeem/initiate', { rewardId });
}

// Only the store owner can cancel a pending redemption - there is no
// customer-side cancel endpoint on the backend.
export function cancelRedemption(redemptionId) {
  return apiClient.post(`/dashboard/store/redeem/${redemptionId}/cancel`);
}
