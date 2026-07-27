import client from './client';

export async function initiateRedemption(rewardId) {
  const { data } = await client.post('/dashboard/customer/redeem/initiate', { rewardId });
  return data.data;
}

export async function cancelRedemption(redemptionId) {
  const { data } = await client.post(`/dashboard/store/redeem/${redemptionId}/cancel`);
  return data.data;
}
