import apiClient from './client';

// storeId travels in the request body on every one of these, not the URL -
// that's how the backend's till routes are shaped (see
// backend/src/features/scan/scan.routes.js).
export function identify({ storeId, qrToken }) {
  return apiClient.post('/dashboard/store/scan/identify', { storeId, qrToken });
}

export function identifyBySlug({ storeId, slug, tillPin }) {
  return apiClient.post('/dashboard/store/scan/identify-by-slug', { storeId, slug, tillPin });
}

export function earn({ storeId, customerId, purchaseAmount, tillPin, idempotencyKey, verificationMethod }) {
  return apiClient.post('/dashboard/store/scan/earn', {
    storeId,
    customerId,
    purchaseAmount,
    tillPin,
    idempotencyKey,
    verificationMethod,
  });
}

export function redeem({ storeId, redemptionCode, tillPin }) {
  return apiClient.post('/dashboard/store/scan/redeem', { storeId, redemptionCode, tillPin });
}
