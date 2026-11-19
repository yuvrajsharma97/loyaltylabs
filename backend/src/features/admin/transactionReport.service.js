const PointTransaction = require('../transactions/transaction.model');
const Redemption = require('../redemptions/redemption.model');
const Store = require('../stores/store.model');

const TIME_ZONE = 'Europe/London';
const MAX_RANGE_DAYS = 92;
const DAY_MS = 24 * 60 * 60 * 1000;

// Ledger types, as named in the report. 'handedOver' (a reward code used at
// the till) isn't a ledger entry - points leave the balance when the customer
// claims the reward - so it comes from the redemptions collection instead.
const LEDGER_COUNTS = {
  earn: 'earned',
  redeem: 'claimed',
  reversal: 'cancelled',
  suspension_reversal: 'suspensionRefunds',
  adjust: 'adjustments',
  expiry: 'expired'
};
const COUNT_FIELDS = [...Object.values(LEDGER_COUNTS), 'handedOver'];

/** UTC instant of 00:00 UK time on `dateStr` (YYYY-MM-DD). */
function ukMidnight(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const utcGuess = Date.UTC(year, month - 1, day);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: TIME_ZONE,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
      .formatToParts(new Date(utcGuess))
      .map(({ type, value }) => [type, Number(value)])
  );
  const shownAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  return new Date(utcGuess - (shownAsUtc - utcGuess));
}

/** Every YYYY-MM-DD from `from` to `to` inclusive, newest first. */
function datesBetween(from, to) {
  const dates = [];
  for (let t = Date.parse(`${to}T00:00:00Z`); t >= Date.parse(`${from}T00:00:00Z`); t -= DAY_MS) {
    dates.push(new Date(t).toISOString().slice(0, 10));
  }
  return dates;
}

function rangeDays(from, to) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS) + 1;
}

const ukDate = (field) => ({ $dateToString: { format: '%Y-%m-%d', date: field, timezone: TIME_ZONE } });

function emptyFigures() {
  const figures = { transactions: 0, pointsIn: 0, pointsOut: 0, spend: 0, customers: 0 };
  COUNT_FIELDS.forEach((field) => {
    figures[field] = 0;
  });
  return figures;
}

// Adds b's figures onto a; customers are merged as a set so a customer who
// visits two shops on one day is counted once in the day's total.
function accumulate(target, source, customerSet, sourceCustomers) {
  COUNT_FIELDS.forEach((field) => {
    target[field] += source[field] || 0;
  });
  target.transactions += source.transactions || 0;
  target.pointsIn += source.pointsIn || 0;
  target.pointsOut += source.pointsOut || 0;
  target.spend += source.spend || 0;
  sourceCustomers.forEach((id) => customerSet.add(String(id)));
}

const roundMoney = (value) => Math.round(value * 100) / 100;

/**
 * Every transaction between `from` and `to` (UK dates, inclusive), compiled
 * per day and per shop. Days with no activity are included so gaps show.
 */
async function buildTransactionReport({ from, to, storeId }) {
  const start = ukMidnight(from);
  const nextDay = new Date(Date.parse(`${to}T00:00:00Z`) + DAY_MS).toISOString().slice(0, 10);
  const end = ukMidnight(nextDay);

  const storeFilter = storeId ? { storeId } : {};

  const countByType = Object.fromEntries(
    Object.entries(LEDGER_COUNTS).map(([type, field]) => [field, { $sum: { $cond: [{ $eq: ['$type', type] }, 1, 0] } }])
  );

  const [ledgerRows, handedOverRows] = await Promise.all([
    PointTransaction.aggregate([
      { $match: { ...storeFilter, createdAt: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: { date: ukDate('$createdAt'), storeId: '$storeId' },
          transactions: { $sum: 1 },
          ...countByType,
          pointsIn: { $sum: { $cond: [{ $gt: ['$points', 0] }, '$points', 0] } },
          pointsOut: { $sum: { $cond: [{ $lt: ['$points', 0] }, { $abs: '$points' }, 0] } },
          spend: { $sum: { $cond: [{ $eq: ['$type', 'earn'] }, { $ifNull: ['$purchaseAmount', 0] }, 0] } },
          customerIds: { $addToSet: '$customerId' }
        }
      }
    ]),
    Redemption.aggregate([
      { $match: { ...storeFilter, status: 'fulfilled', fulfilledAt: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: { date: ukDate('$fulfilledAt'), storeId: '$storeId' },
          handedOver: { $sum: 1 },
          customerIds: { $addToSet: '$customerId' }
        }
      }
    ])
  ]);

  // date -> storeId -> { figures, customers:Set }
  const byDate = new Map();
  const cell = (date, store) => {
    if (!byDate.has(date)) byDate.set(date, new Map());
    const stores = byDate.get(date);
    if (!stores.has(store)) stores.set(store, { figures: emptyFigures(), customers: new Set() });
    return stores.get(store);
  };

  ledgerRows.forEach(({ _id, customerIds, ...figures }) => {
    const entry = cell(_id.date, String(_id.storeId));
    accumulate(entry.figures, figures, entry.customers, customerIds);
  });
  handedOverRows.forEach(({ _id, customerIds, handedOver }) => {
    const entry = cell(_id.date, String(_id.storeId));
    accumulate(entry.figures, { handedOver, transactions: handedOver }, entry.customers, customerIds);
  });

  const storeIds = new Set();
  byDate.forEach((stores) => stores.forEach((_value, id) => storeIds.add(id)));
  const storeDocs = await Store.find({ _id: { $in: [...storeIds] } }).select('name status');
  const storeInfo = new Map(storeDocs.map((store) => [String(store._id), store]));

  const totals = emptyFigures();
  const allCustomers = new Set();

  const days = datesBetween(from, to).map((date) => {
    const dayTotals = emptyFigures();
    const dayCustomers = new Set();
    const stores = [...(byDate.get(date) || new Map()).entries()].map(([id, { figures, customers }]) => {
      accumulate(dayTotals, figures, dayCustomers, customers);
      const info = storeInfo.get(id);
      return {
        storeId: id,
        storeName: info ? info.name : 'Unknown shop',
        storeStatus: info ? info.status : null,
        ...figures,
        spend: roundMoney(figures.spend),
        customers: customers.size
      };
    });
    stores.sort((a, b) => b.transactions - a.transactions || a.storeName.localeCompare(b.storeName));

    accumulate(totals, dayTotals, allCustomers, dayCustomers);
    return { date, totals: { ...dayTotals, spend: roundMoney(dayTotals.spend), customers: dayCustomers.size }, stores };
  });

  return {
    from,
    to,
    timeZone: TIME_ZONE,
    storeId: storeId || null,
    totals: { ...totals, spend: roundMoney(totals.spend), customers: allCustomers.size },
    days
  };
}

module.exports = { buildTransactionReport, ukMidnight, datesBetween, rangeDays, MAX_RANGE_DAYS, TIME_ZONE };
