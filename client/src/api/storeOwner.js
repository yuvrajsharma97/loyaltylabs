import client from './client';

export async function getMyStore() {
  const { data } = await client.get('/dashboard/store/mine');
  return data.data;
}

export async function updateStore(id, patch) {
  const { data } = await client.patch(`/dashboard/store/${id}`, patch);
  return data.data;
}

export async function getOnboarding(id) {
  const { data } = await client.get(`/dashboard/store/${id}/onboarding`);
  return data.data;
}

export async function updateLoyaltyConfig(id, patch) {
  const { data } = await client.patch(`/dashboard/store/${id}/loyalty-config`, patch);
  return data.data;
}

export async function updateTillPins(id, tillPins) {
  const { data } = await client.patch(`/dashboard/store/${id}/till-pins`, { tillPins });
  return data.data;
}

export async function createReward(id, reward) {
  const { data } = await client.post(`/dashboard/store/${id}/rewards`, reward);
  return data.data;
}

export async function getStore(id) {
  const { data } = await client.get(`/dashboard/store/${id}`);
  return data.data;
}

export async function listStoreDisputes(id, { status } = {}) {
  const { data } = await client.get(`/dashboard/store/${id}/disputes`, { params: { status } });
  return data.data.disputes;
}

export async function listStoreTransactions(id, { limit, before, type, verificationMethod } = {}) {
  const { data } = await client.get(`/dashboard/store/${id}/transactions`, {
    params: { limit, before, type, verificationMethod }
  });
  return data.data;
}

export async function getStoreAnalytics(id) {
  const { data } = await client.get(`/dashboard/store/${id}/analytics`);
  return data.data;
}
