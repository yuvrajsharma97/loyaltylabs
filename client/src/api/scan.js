import client from './client';

export async function identify(storeId, qrToken) {
  const { data } = await client.post('/dashboard/store/scan/identify', { storeId, qrToken });
  return data.data;
}

export async function identifyBySlug(storeId, slug, tillPin) {
  const { data } = await client.post('/dashboard/store/scan/identify-by-slug', { storeId, slug, tillPin });
  return data.data;
}

export async function earn({ storeId, customerId, purchaseAmount, tillPin, idempotencyKey, verificationMethod }) {
  const { data } = await client.post('/dashboard/store/scan/earn', {
    storeId,
    customerId,
    purchaseAmount,
    tillPin,
    idempotencyKey,
    verificationMethod
  });
  return data.data;
}

export async function redeem({ storeId, redemptionCode, tillPin }) {
  const { data } = await client.post('/dashboard/store/scan/redeem', { storeId, redemptionCode, tillPin });
  return data.data;
}
