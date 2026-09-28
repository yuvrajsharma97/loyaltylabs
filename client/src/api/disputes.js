import apiClient from './client';

export function resolveDispute(disputeId, { ownerNote } = {}) {
  return apiClient.patch(`/dashboard/store/disputes/${disputeId}`, { ownerNote });
}
