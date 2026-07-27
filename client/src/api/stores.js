import client from './client';

export async function listStores({ category } = {}) {
  const { data } = await client.get('/dashboard/customer/stores', {
    params: category?.length ? { category: category.join(',') } : undefined
  });
  return data.data.stores;
}

export async function joinStore(storeId) {
  const { data } = await client.post(`/dashboard/customer/stores/${storeId}/join`);
  return data.data;
}
