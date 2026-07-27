import client from './client';

export async function getMetrics() {
  const { data } = await client.get('/dashboard/admin/metrics');
  return data.data;
}

export async function listStores({ status, limit } = {}) {
  const { data } = await client.get('/dashboard/admin/stores', { params: { status, limit } });
  return data.data.stores;
}

export async function updateStoreStatus(id, status) {
  const { data } = await client.patch(`/dashboard/admin/stores/${id}/status`, { status });
  return data.data;
}

export async function listDisputes({ status, limit } = {}) {
  const { data } = await client.get('/dashboard/admin/disputes', { params: { status, limit } });
  return data.data.disputes;
}

export async function reconcileStore(id, confirm = false) {
  const { data } = await client.post(`/dashboard/admin/stores/${id}/reconcile`, { confirm });
  return data.data;
}

export async function listCustomers({ search, limit } = {}) {
  const { data } = await client.get('/dashboard/admin/customers', { params: { search, limit } });
  return data.data.customers;
}

export async function getCustomer(id) {
  const { data } = await client.get(`/dashboard/admin/customers/${id}`);
  return data.data;
}
