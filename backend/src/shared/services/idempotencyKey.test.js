jest.mock('../../config/env', () => ({ idempotencySecret: 'test-idempotency-secret' }));

const { issueIdempotencyKey } = require('./issueIdempotencyKey');
const { validateIdempotencyKey, IDEMPOTENCY_KEY_MAX_AGE_MS } = require('./validateIdempotencyKey');

const ids = { customerId: 'customer-1', storeId: 'store-1' };

afterEach(() => jest.restoreAllMocks());

describe('idempotency keys', () => {
  it('accepts a fresh key for the same customer and store', () => {
    const key = issueIdempotencyKey(ids);
    expect(validateIdempotencyKey(key, ids)).toEqual({ valid: true, expired: false });
  });

  it('rejects a key reused for a different customer', () => {
    const key = issueIdempotencyKey(ids);
    expect(validateIdempotencyKey(key, { ...ids, customerId: 'customer-2' }).valid).toBe(false);
  });

  it('rejects a key reused at a different store', () => {
    const key = issueIdempotencyKey(ids);
    expect(validateIdempotencyKey(key, { ...ids, storeId: 'store-2' }).valid).toBe(false);
  });

  it('rejects malformed and tampered keys', () => {
    const [issuedAt, signature] = issueIdempotencyKey(ids).split('.');
    expect(validateIdempotencyKey(undefined, ids).valid).toBe(false);
    expect(validateIdempotencyKey('not-a-key', ids).valid).toBe(false);
    expect(validateIdempotencyKey(`${Number(issuedAt) + 1}.${signature}`, ids).valid).toBe(false);
    expect(validateIdempotencyKey(`${issuedAt}.${'0'.repeat(signature.length)}`, ids).valid).toBe(false);
  });

  it('marks a genuine key older than 24 hours as expired', () => {
    const issuedAt = Date.now() - IDEMPOTENCY_KEY_MAX_AGE_MS - 1000;
    jest.spyOn(Date, 'now').mockReturnValueOnce(issuedAt);
    const key = issueIdempotencyKey(ids);

    expect(validateIdempotencyKey(key, ids)).toEqual({ valid: true, expired: true });
  });
});
