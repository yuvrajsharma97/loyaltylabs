import client from './client';

export async function resolveDispute(disputeId, ownerNote) {
  const { data } = await client.patch(`/dashboard/store/disputes/${disputeId}`, { ownerNote });
  return data.data;
}
