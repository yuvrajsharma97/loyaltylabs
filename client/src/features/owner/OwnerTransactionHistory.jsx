import { useCallback, useState } from 'react';
import * as storesApi from '../../api/stores';
import { useAuth } from '../../shared/hooks/useAuth';
import { usePaginatedList } from '../../shared/hooks/usePaginatedList';
import { TRANSACTION_LABELS, TRANSACTION_TYPES, VERIFICATION_LABELS, getTransactionLabel } from '../../shared/utils/labels';
import ActivityRow from '../../shared/components/ActivityRow';
import SegmentedControl from '../../shared/components/SegmentedControl';
import SkeletonRow from '../../shared/components/SkeletonRow';
import EmptyState from '../../shared/components/EmptyState';
import Pagination from '../../shared/components/Pagination';
import ListPage from '../../shared/components/ListPage';
import ScrollPanel from '../../shared/components/ScrollPanel';

const PAGE_SIZE = 10;

const TYPE_FILTERS = [{ value: '', label: 'All types' }, ...TRANSACTION_TYPES.map((value) => ({ value, label: TRANSACTION_LABELS[value] }))];

const METHOD_FILTERS = [
  { value: '', label: 'Any method' },
  { value: 'qr_scan', label: VERIFICATION_LABELS.qr_scan },
  { value: 'slug_manual', label: VERIFICATION_LABELS.slug_manual },
];

const OwnerTransactionHistory = () => {
  const { user: store } = useAuth();
  const [type, setType] = useState('');
  const [verificationMethod, setVerificationMethod] = useState('');

  const fetchPage = useCallback(
    (page) =>
      storesApi
        .listStoreTransactions(store._id, {
          page,
          limit: PAGE_SIZE,
          type: type || undefined,
          verificationMethod: verificationMethod || undefined,
        })
        .then(({ transactions, pagination }) => ({ items: transactions, pagination })),
    [store._id, type, verificationMethod]
  );
  const { items: transactions, pagination, setPage, isLoading, error } = usePaginatedList(fetchPage);

  const header = (
    <>
      <h1 className="text-page-title text-text-primary">Transactions</h1>
      <p className="mt-1 text-body-sm text-text-secondary">Every points movement at your shop, newest first.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {TYPE_FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setType(option.value)}
            className={`rounded-pill border px-3.5 py-1.5 text-label transition-colors duration-150 ${
              type === option.value
                ? 'border-primary bg-primary-tint text-primary'
                : 'border-border bg-surface text-text-secondary hover:text-text-primary'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <SegmentedControl options={METHOD_FILTERS} value={verificationMethod} onChange={setVerificationMethod} className="mt-3" />
    </>
  );

  return (
    <ListPage
      maxWidthClassName="max-w-3xl"
      header={header}
      footer={
        <Pagination pagination={pagination} onPageChange={setPage} isDisabled={isLoading} itemLabel="transactions" />
      }
    >
      <ScrollPanel
        resetKey={transactions[0]?._id}
        className={`flex-1 rounded-card border border-border bg-surface px-4 py-1 shadow-card transition-opacity duration-150 ${
          isLoading && transactions.length > 0 ? 'opacity-50' : ''
        }`}
      >
        {isLoading && transactions.length === 0 && (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        )}

        {error && <p className="py-3 text-body-sm text-error-text">{error}</p>}

        {!isLoading && !error && transactions.length === 0 && (
          <div className="py-3">
            <EmptyState icon="receipt_long" title="No transactions found" body="Try a different filter." />
          </div>
        )}

        {transactions.map((transaction) => {
          const customerLabel = `Customer •••${transaction.customerId.slice(-4)}`;
          const details = [getTransactionLabel(transaction.type)];
          if (transaction.verificationMethod) details.push(VERIFICATION_LABELS[transaction.verificationMethod]);
          if (transaction.purchaseAmount) details.push(`£${transaction.purchaseAmount.toFixed(2)} spend`);
          return (
            <ActivityRow
              key={transaction._id}
              avatarName={customerLabel}
              title={customerLabel}
              subtitle={details.join(' · ')}
              timestamp={transaction.createdAt}
              points={transaction.points}
              density="compact"
            />
          );
        })}
      </ScrollPanel>
    </ListPage>
  );
};

export default OwnerTransactionHistory;
