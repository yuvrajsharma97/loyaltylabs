jest.mock('../transactions/transaction.model', () => ({ aggregate: jest.fn() }));
jest.mock('../redemptions/redemption.model', () => ({ aggregate: jest.fn() }));
jest.mock('../stores/store.model', () => ({ find: jest.fn() }));

const PointTransaction = require('../transactions/transaction.model');
const Redemption = require('../redemptions/redemption.model');
const Store = require('../stores/store.model');
const { buildTransactionReport, ukMidnight, datesBetween, rangeDays } = require('./transactionReport.service');

beforeEach(() => {
  jest.resetAllMocks();
  Store.find.mockReturnValue({
    select: () =>
      Promise.resolve([
        { _id: 'store-a', name: 'Daily Grind', status: 'active' },
        { _id: 'store-b', name: 'Urban Cuts', status: 'closed' }
      ])
  });
});

describe('UK dates', () => {
  it('starts a winter day at midnight UTC', () => {
    expect(ukMidnight('2026-01-15').toISOString()).toBe('2026-01-15T00:00:00.000Z');
  });

  it('starts a summer (BST) day at 23:00 UTC the day before', () => {
    expect(ukMidnight('2026-07-15').toISOString()).toBe('2026-07-14T23:00:00.000Z');
  });

  it('lists every date in the range, newest first', () => {
    expect(datesBetween('2026-10-30', '2026-11-02')).toEqual(['2026-11-02', '2026-11-01', '2026-10-31', '2026-10-30']);
    expect(rangeDays('2026-10-30', '2026-11-02')).toBe(4);
  });
});

describe('buildTransactionReport', () => {
  it('compiles each day per shop, with day and overall totals', async () => {
    PointTransaction.aggregate.mockResolvedValue([
      {
        _id: { date: '2026-11-10', storeId: 'store-a' },
        transactions: 5,
        earned: 3,
        claimed: 1,
        cancelled: 1,
        suspensionRefunds: 0,
        adjustments: 0,
        expired: 0,
        pointsIn: 40,
        pointsOut: 50,
        spend: 23.456,
        customerIds: ['c1', 'c2']
      },
      {
        _id: { date: '2026-11-10', storeId: 'store-b' },
        transactions: 1,
        earned: 1,
        claimed: 0,
        cancelled: 0,
        suspensionRefunds: 0,
        adjustments: 0,
        expired: 0,
        pointsIn: 5,
        pointsOut: 0,
        spend: 5,
        customerIds: ['c2']
      }
    ]);
    Redemption.aggregate.mockResolvedValue([{ _id: { date: '2026-11-10', storeId: 'store-a' }, handedOver: 2, customerIds: ['c3'] }]);

    const report = await buildTransactionReport({ from: '2026-11-09', to: '2026-11-10' });

    expect(report.days.map((day) => day.date)).toEqual(['2026-11-10', '2026-11-09']);

    const [busyDay, quietDay] = report.days;
    expect(busyDay.stores[0]).toMatchObject({
      storeName: 'Daily Grind',
      transactions: 7,
      earned: 3,
      claimed: 1,
      handedOver: 2,
      cancelled: 1,
      spend: 23.46,
      customers: 3
    });
    expect(busyDay.stores[1]).toMatchObject({ storeName: 'Urban Cuts', storeStatus: 'closed', transactions: 1 });
    // c2 visited both shops: counted once in the day's total.
    expect(busyDay.totals).toMatchObject({ transactions: 8, earned: 4, handedOver: 2, pointsIn: 45, pointsOut: 50, customers: 3 });
    expect(busyDay.totals.spend).toBe(28.46);

    expect(quietDay).toEqual({ date: '2026-11-09', totals: expect.objectContaining({ transactions: 0, customers: 0 }), stores: [] });
    expect(report.totals).toMatchObject({ transactions: 8, customers: 3 });
  });

  it('queries whole UK days and only the chosen shop', async () => {
    PointTransaction.aggregate.mockResolvedValue([]);
    Redemption.aggregate.mockResolvedValue([]);

    await buildTransactionReport({ from: '2026-07-01', to: '2026-07-01', storeId: 'store-a' });

    const [match] = PointTransaction.aggregate.mock.calls[0][0];
    expect(match.$match).toEqual({
      storeId: 'store-a',
      createdAt: { $gte: new Date('2026-06-30T23:00:00Z'), $lt: new Date('2026-07-01T23:00:00Z') }
    });
    expect(Redemption.aggregate.mock.calls[0][0][0].$match).toMatchObject({ storeId: 'store-a', status: 'fulfilled' });
  });
});
