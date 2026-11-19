import { useCallback, useEffect, useState } from 'react';
import * as billingApi from '../../api/billing';
import { useAuth } from '../../shared/hooks/useAuth';
import { usePaginatedList } from '../../shared/hooks/usePaginatedList';
import KpiTile from '../../shared/components/KpiTile';
import ScrollPanel from '../../shared/components/ScrollPanel';
import Badge from '../../shared/components/Badge';
import EmptyState from '../../shared/components/EmptyState';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import Pagination from '../../shared/components/Pagination';
import { formatCurrency } from '../../shared/utils/formatters';

const HISTORY_PAGE_SIZE = 10;

const SNAPSHOT_STATUS_TONES = { paid: 'success', invoiced: 'info', pending: 'warning' };

function formatPeriod(start) {
  return new Date(start).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

const BillingHistory = ({ storeId }) => {
  const fetchPage = useCallback(
    (page) =>
      billingApi
        .getHistory(storeId, { page, limit: HISTORY_PAGE_SIZE })
        .then(({ snapshots, pagination }) => ({ items: snapshots, pagination })),
    [storeId]
  );
  const { items: snapshots, pagination, setPage, isLoading } = usePaginatedList(fetchPage);

  return (
    <section className="mt-6">
      <h2 className="text-label text-text-muted">Past billing periods</h2>
      {/* Sits inside the Settings tabs rather than filling a page, so it's capped
          to half the screen and scrolls within that. */}
      <ScrollPanel
        resetKey={snapshots[0]?._id}
        className={`mt-2 max-h-[50dvh] rounded-card border border-border bg-surface px-4 py-1 shadow-card transition-opacity duration-150 ${
          isLoading && snapshots.length > 0 ? 'opacity-50' : ''
        }`}
      >
        {isLoading && snapshots.length === 0 && <LoadingSpinner className="py-6" />}
        {!isLoading && snapshots.length === 0 && (
          <p className="py-3 text-body-sm text-text-secondary">No closed billing periods yet.</p>
        )}
        {snapshots.map((snapshot) => (
          <div
            key={snapshot._id}
            className="flex items-center justify-between gap-3 border-b border-divider py-3 last:border-0"
          >
            <div className="min-w-0">
              <p className="text-card-title text-text-primary">{formatPeriod(snapshot.periodStart)}</p>
              <p className="tabular-nums text-body-sm text-text-muted">
                {snapshot.activeCustomerCount} active · {snapshot.billableCount} billable
                {snapshot.proRated && ' · pro-rated'}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="tabular-nums text-body text-text-primary">{formatCurrency(snapshot.amountDue)}</span>
              <Badge tone={SNAPSHOT_STATUS_TONES[snapshot.status] || 'neutral'}>{snapshot.status}</Badge>
            </div>
          </div>
        ))}
      </ScrollPanel>
      <Pagination
        pagination={pagination}
        onPageChange={setPage}
        isDisabled={isLoading}
        itemLabel="periods"
        className="mt-3"
      />
    </section>
  );
};

const BillingUsage = () => {
  const { user: store } = useAuth();
  const [usage, setUsage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSetUp, setIsSetUp] = useState(true);

  useEffect(() => {
    billingApi
      .getUsage(store._id)
      .then(setUsage)
      .catch((err) => {
        if (err.code === 'BILLING_NOT_SETUP') setIsSetUp(false);
        else throw err;
      })
      .finally(() => setIsLoading(false));
  }, [store._id]);

  if (isLoading) {
    return <LoadingSpinner className="py-8" />;
  }

  if (!isSetUp) {
    return <EmptyState icon="receipt" title="Billing not set up yet" body="This starts once your plan is activated." />;
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <KpiTile label="Active customers" value={usage.activeCustomerCount} />
        <KpiTile label="Billable customers" value={usage.billableCount} />
        <KpiTile label="Amount due" value={formatCurrency(usage.amountDue)} />
        <KpiTile label="Status" value={usage.status} />
      </div>
      <p className="mt-2 text-body-sm text-text-muted">
        The first {usage.freeUserLimit} active customers each period are free, then{' '}
        {formatCurrency(usage.pricePerExtraUser)} per extra customer.
      </p>

      <BillingHistory storeId={store._id} />
    </div>
  );
};

export default BillingUsage;
