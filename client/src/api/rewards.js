import client from './client';

// Mounted under the store-owner prefix (/dashboard/store/:id/rewards) but
// uses optionalAuth - the same endpoint serves the public/customer catalog
// (filtered to active+live rewards) and the owner's management view
// (includes inactive/scheduled rewards), depending on who's calling.
export async function listStoreRewards(storeId) {
  const { data } = await client.get(`/dashboard/store/${storeId}/rewards`);
  return data.data.rewards;
}

export async function createReward(storeId, reward) {
  const { data } = await client.post(`/dashboard/store/${storeId}/rewards`, reward);
  return data.data;
}

export async function updateReward(storeId, rewardId, patch) {
  const { data } = await client.patch(`/dashboard/store/${storeId}/rewards/${rewardId}`, patch);
  return data.data;
}

export async function deleteReward(storeId, rewardId) {
  const { data } = await client.delete(`/dashboard/store/${storeId}/rewards/${rewardId}`);
  return data.data;
}
