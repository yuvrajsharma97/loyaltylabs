import { useEffect, useState } from 'react';
import * as adminApi from '../../api/admin';
import Card from '../../shared/components/Card';
import Badge from '../../shared/components/Badge';
import Input from '../../shared/components/Input';
import KpiTile from '../../shared/components/KpiTile';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import EmptyState from '../../shared/components/EmptyState';
import { formatCurrency } from '../../shared/utils/formatters';

const TIME_ZONE = 'Europe/London';
const MAX_RANGE_DAYS = 92; // matches the backend
const DAY_MS = 24 * 60 * 60 * 1000;

// YYYY-MM-DD for a moment, as a UK calendar date.
const ukDateString = (date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    date
  );
const daysAgo = (days) => ukDateString(new Date(Date.now() - days * DAY_MS));
const rangeLength = (from, to) => Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS) + 1;

const formatDay = (dateStr) =>
  new Date(`${dateStr}T12:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

const PRESETS = [
  { label: 'Today', days: 1 },
  { label: '7 days', days: 7 },
  { label: '14 days', days: 14 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
];

// Every column of the per-shop table, in order. `title` is the hover help.
const COLUMNS = [
  { key: 'transactions', label: 'Total', title: 'All transactions, including rewards handed over' },
  { key: 'earned', label: 'Earned', title: 'Points earned at the till' },
  { key: 'claimed', label: 'Claimed', title: 'Rewards claimed by customers (points spent)' },
  { key: 'handedOver', label: 'Handed over', title: 'Reward codes used at the till' },
  { key: 'cancelled', label: 'Cancelled', title: 'Reward claims cancelled by the shop (points refunded)' },
  { key: 'adjustments', label: 'Adjusted', title: 'Balance corrections from reconciliation' },
  { key: 'expired', label: 'Expired', title: 'Points that expired' },
  { key: 'suspensionRefunds', label: 'Susp. refunds', title: 'Points refunded when a shop was suspended or closed' },
  { key: 'pointsIn', label: 'Points in', title: 'Points added to balances' },
  { key: 'pointsOut', label: 'Points out', title: 'Points taken from balances' },
  { key: 'spend', label: 'Spend', title: 'Purchase amounts entered at the till', format: formatCurrency },
  { key: 'customers', label: 'Customers', title: 'Different customers who transacted' },
];

const STATUS_TONE = { active: 'success', suspended: 'error', closed: 'neutral' };

const cellValue = (row, column) => (column.format ? column.format(row[column.key]) : row[column.key].toLocaleString('en-GB'));

const DayTable = ({ day }) => (
  <div className="-mx-4 overflow-x-auto px-4">
    <table className="w-full min-w-[1040px] border-collapse text-body-sm tabular-nums">
      <thead>
        <tr className="border-b border-border text-left text-label text-text-muted">
          <th className="py-2 pr-3 font-medium">Shop</th>
          {COLUMNS.map((column) => (
            <th key={column.key} title={column.title} className="whitespace-nowrap px-2 py-2 text-right font-medium">
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {day.stores.map((store) => (
          <tr key={store.storeId} className="border-b border-border last:border-b-0">
            <td className="max-w-[220px] py-2 pr-3">
              <span className="flex items-center gap-2">
                <span className="truncate text-text-primary">{store.storeName}</span>
                {store.storeStatus && store.storeStatus !== 'active' && (
                  <Badge tone={STATUS_TONE[store.storeStatus] || 'neutral'}>{store.storeStatus}</Badge>
                )}
              </span>
            </td>
            {COLUMNS.map((column) => (
              <td key={column.key} className="px-2 py-2 text-right text-text-secondary">
                {cellValue(store, column)}
              </td>
            ))}
          </tr>
        ))}
        {day.stores.length > 1 && (
          <tr className="border-t border-border-strong font-medium">
            <td className="py-2 pr-3 text-text-primary">All shops</td>
            {COLUMNS.map((column) => (
              <td key={column.key} className="px-2 py-2 text-right text-text-primary">
                {cellValue(day.totals, column)}
              </td>
            ))}
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

const AdminTransactions = () => {
  const [from, setFrom] = useState(() => daysAgo(13));
  const [to, setTo] = useState(() => daysAgo(0));
  const [storeId, setStoreId] = useState('');
  const [stores, setStores] = useState([]);
  const [hideEmptyDays, setHideEmptyDays] = useState(false);
  const [report, setReport] = useState(null);
  const [loadedKey, setLoadedKey] = useState(null);

  const rangeError =
    !from || !to
      ? 'Pick both dates.'
      : from > to
        ? 'The From date must be on or before the To date.'
        : rangeLength(from, to) > MAX_RANGE_DAYS
          ? `Pick a range of ${MAX_RANGE_DAYS} days or fewer.`
          : null;

  useEffect(() => {
    adminApi.listStores({ limit: 100 }).then(({ stores: list }) => setStores(list));
  }, []);

  // Loading = the report on screen isn't for the current filters yet.
  const requestKey = `${from}|${to}|${storeId}`;
  const isLoading = !rangeError && loadedKey !== requestKey;

  useEffect(() => {
    if (rangeError) return undefined;
    let isCurrent = true;
    adminApi
      .getTransactionReport({ from, to, storeId: storeId || undefined })
      .then((data) => {
        if (isCurrent) setReport(data);
      })
      .finally(() => {
        if (isCurrent) setLoadedKey(requestKey);
      });
    return () => {
      isCurrent = false;
    };
  }, [from, to, storeId, rangeError, requestKey]);

  const applyPreset = (days) => {
    setFrom(daysAgo(days - 1));
    setTo(daysAgo(0));
  };

  const days = report ? report.days.filter((day) => !hideEmptyDays || day.totals.transactions > 0) : [];
  const today = daysAgo(0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-page-title text-text-primary">Transactions</h1>
      <p className="mt-1 text-body-sm text-text-secondary">
        Every transaction, compiled by date and shop. Dates are UK time.
      </p>

      <Card className="mt-5 flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input label="From" type="date" value={from} max={to || today} onChange={(event) => setFrom(event.target.value)} />
          <Input label="To" type="date" value={to} min={from} max={today} onChange={(event) => setTo(event.target.value)} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="report-shop" className="text-label text-text-secondary">
              Shop
            </label>
            <select
              id="report-shop"
              value={storeId}
              onChange={(event) => setStoreId(event.target.value)}
              className="h-11 rounded-input border border-border bg-surface px-3 text-body text-text-primary outline-none focus:border-primary"
            >
              <option value="">All shops</option>
              {stores.map((store) => (
                <option key={store._id} value={store._id}>
                  {store.name}
                  {store.status !== 'active' ? ` (${store.status})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyPreset(preset.days)}
              className="rounded-pill border border-border bg-surface px-3 py-1 text-label text-text-secondary transition-colors duration-150 hover:text-text-primary"
            >
              {preset.label}
            </button>
          ))}
          <label className="ml-auto flex items-center gap-2 text-body-sm text-text-secondary">
            <input type="checkbox" checked={hideEmptyDays} onChange={(event) => setHideEmptyDays(event.target.checked)} />
            Hide days with no transactions
          </label>
        </div>
        {rangeError && <p className="text-body-sm text-error-text">{rangeError}</p>}
      </Card>

      {!report && isLoading && <LoadingSpinner className="py-16" />}

      {report && (
        <div className={`mt-5 flex flex-col gap-4 transition-opacity duration-150 ${isLoading ? 'opacity-50' : ''}`}>
          <div className="grid grid-cols-2 gap-3 rail:grid-cols-4">
            <KpiTile label="Transactions" value={report.totals.transactions.toLocaleString('en-GB')} />
            <KpiTile label="Customer spend" value={formatCurrency(report.totals.spend)} />
            <KpiTile label="Points in / out" value={`${report.totals.pointsIn.toLocaleString('en-GB')} / ${report.totals.pointsOut.toLocaleString('en-GB')}`} />
            <KpiTile label="Customers" value={report.totals.customers.toLocaleString('en-GB')} />
          </div>

          {days.length === 0 && <EmptyState icon="receipt_long" title="No transactions in this range" />}

          {days.map((day) =>
            day.totals.transactions === 0 ? (
              <div
                key={day.date}
                className="flex items-center justify-between rounded-card border border-dashed border-border px-4 py-3 text-body-sm"
              >
                <span className="text-text-primary">{formatDay(day.date)}</span>
                <span className="text-text-muted">No transactions</span>
              </div>
            ) : (
              <Card key={day.date} className="flex flex-col gap-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-card-title text-text-primary">{formatDay(day.date)}</h2>
                  <p className="text-body-sm tabular-nums text-text-secondary">
                    {day.totals.transactions.toLocaleString('en-GB')} transactions · {day.stores.length}{' '}
                    {day.stores.length === 1 ? 'shop' : 'shops'} · {day.totals.customers} customers ·{' '}
                    {formatCurrency(day.totals.spend)}
                  </p>
                </div>
                <DayTable day={day} />
              </Card>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default AdminTransactions;
