/**
 * Runs /scan/earn against a real MongoDB (an in-memory replica set, since
 * earn uses a transaction) to prove that two identical awards sent at the
 * same moment credit the customer once, not twice.
 */
process.env.IDEMPOTENCY_SECRET = 'test-idempotency-secret';

const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

const { earn } = require('./scan.handler');
const { issueIdempotencyKey } = require('../../shared/services/issueIdempotencyKey');
const Store = require('../stores/store.model');
const Customer = require('../customers/customer.model');
const Membership = require('../memberships/membership.model');
const PointTransaction = require('../transactions/transaction.model');

jest.setTimeout(120000); // first run downloads a MongoDB binary

let replSet;
let store;
let customer;

// Calls the Express handler directly and resolves with what it sent, or
// rejects with the error it passed to next().
function callEarn(body) {
  return new Promise((resolve, reject) => {
    const req = { body, store, auth: { id: new mongoose.Types.ObjectId() } };
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        resolve({ status: this.statusCode, body: payload });
        return this;
      }
    };
    earn(req, res, reject);
  });
}

function earnBody(idempotencyKey) {
  return {
    customerId: String(customer._id),
    purchaseAmount: 12,
    tillPin: '1234',
    idempotencyKey,
    verificationMethod: 'qr_scan'
  };
}

async function ledgerEntriesFor(idempotencyKey) {
  return PointTransaction.countDocuments({ idempotencyKey });
}

async function balance() {
  const membership = await Membership.findOne({ customerId: customer._id, storeId: store._id });
  return membership ? membership.pointsBalance : 0;
}

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  await mongoose.connect(replSet.getUri());
  // Build every index (including the unique idempotencyKey one) and create
  // the collections up front - collections can't be created inside a transaction.
  await Promise.all([Store, Customer, Membership, PointTransaction].map((model) => model.createCollection()));
  await Promise.all([Store, Customer, Membership, PointTransaction].map((model) => model.syncIndexes()));
});

afterAll(async () => {
  await mongoose.disconnect();
  if (replSet) await replSet.stop();
});

beforeEach(async () => {
  await Promise.all([Store, Customer, Membership, PointTransaction].map((model) => model.deleteMany({})));

  store = await Store.create({
    name: 'Test Cafe',
    ownerUserId: new mongoose.Types.ObjectId(),
    slug: `test-cafe-${Date.now()}`,
    status: 'active',
    loyaltyProgram: { mode: 'per_currency', pointsPerUnit: 1, minPurchase: 0 },
    tillPins: [{ pin: '1234', label: 'Front till', active: true }]
  });
  customer = await Customer.create({ name: 'Test Customer', email: `customer-${Date.now()}@example.test` });
  await Membership.create({ customerId: customer._id, storeId: store._id, pointsBalance: 0 });
});

describe('POST /scan/earn with a real database', () => {
  it('credits two simultaneous identical awards only once', async () => {
    const key = issueIdempotencyKey({ customerId: customer._id, storeId: store._id });

    const results = await Promise.all([callEarn(earnBody(key)), callEarn(earnBody(key))]);

    expect(await ledgerEntriesFor(key)).toBe(1);
    expect(await balance()).toBe(12);

    const fresh = results.filter((r) => !r.body.data.duplicate);
    const duplicates = results.filter((r) => r.body.data.duplicate);
    expect(fresh).toHaveLength(1);
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].body).toMatchObject({
      code: 'DUPLICATE_TRANSACTION',
      data: { pointsAwarded: 12, newBalance: 12, duplicate: true }
    });
  });

  it('is caught by the unique index even when both requests get past the early check', async () => {
    const key = issueIdempotencyKey({ customerId: customer._id, storeId: store._id });

    // Force the worst case: both requests' early "already processed?" lookup
    // finds nothing, so only the database index can stop the second award.
    const realFindOne = PointTransaction.findOne.bind(PointTransaction);
    const spy = jest
      .spyOn(PointTransaction, 'findOne')
      .mockImplementationOnce(() => Promise.resolve(null))
      .mockImplementationOnce(() => Promise.resolve(null))
      .mockImplementation(realFindOne);

    try {
      const results = await Promise.all([callEarn(earnBody(key)), callEarn(earnBody(key))]);

      expect(await ledgerEntriesFor(key)).toBe(1);
      expect(await balance()).toBe(12);
      expect(results.filter((r) => r.body.code === 'DUPLICATE_TRANSACTION')).toHaveLength(1);
    } finally {
      spy.mockRestore();
    }
  });

  it('still awards separate purchases that have different keys', async () => {
    const firstKey = issueIdempotencyKey({ customerId: customer._id, storeId: store._id });
    await new Promise((resolve) => setTimeout(resolve, 5)); // keys are timestamped
    const secondKey = issueIdempotencyKey({ customerId: customer._id, storeId: store._id });

    await Promise.all([callEarn(earnBody(firstKey)), callEarn(earnBody(secondKey))]);

    expect(await PointTransaction.countDocuments({ type: 'earn' })).toBe(2);
    expect(await balance()).toBe(24);
  });

  it('allows any number of ledger entries without a key', async () => {
    const entry = { storeId: store._id, customerId: customer._id, type: 'adjust', points: 1 };

    await PointTransaction.create([entry, entry, entry]);

    expect(await PointTransaction.countDocuments({ type: 'adjust' })).toBe(3);
  });
});
