import { useCallback, useState } from 'react';
import { listStoreTransactions } from '../../api/storeOwner';
import usePaginatedList from '../../shared/hooks/usePaginatedList';
import { useStore } from './OwnerDashboard';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import { formatDate, formatPoints } from '../../shared/utils/formatters';

const TYPES = ['earn', 'redeem', 'adjust', 'reversal', 'expiry', 'suspension_reversal'];
const METHODS = ['qr_scan', 'slug_manual'];

const selectClass =
  'bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm font-body text-body-sm outline-none focus:border-primary transition-all';

export default function OwnerTransactionHistory() {
  const { store } = useStore();
  const [type, setType] = useState('');
  const [verificationMethod, setVerificationMethod] = useState('');

  const fetchFn = useCallback(
    (args) => listStoreTransactions(store._id, args),
    [store._id]
  );

  const { items: transactions, loading, hasMore, loadMore } = usePaginatedList(fetchFn, {
    itemsKey: 'transactions',
    limit: 25,
    params: { type: type || undefined, verificationMethod: verificationMethod || undefined }
  });

  return (
    <div className="flex flex-col gap-xl max-w-[1100px] mx-auto">
      <h1 className="font-display text-display-md-mobile md:text-display-md">Transactions</h1>

      <div className="flex flex-col sm:flex-row gap-md">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className={`${selectClass} w-full sm:w-auto`}
        >
          <option value="">All types</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={verificationMethod}
          onChange={(e) => setVerificationMethod(e.target.value)}
          className={`${selectClass} w-full sm:w-auto`}
        >
          <option value="">All verification methods</option>
          {METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {transactions.length === 0 && loading ? (
        <LoadingSpinner />
      ) : transactions.length === 0 ? (
        <Card className="text-body-sm text-on-surface-variant">No transactions found.</Card>
      ) : (
        <>
          <Card className="divide-y divide-outline-variant !p-0">
            {transactions.map((tx) => (
              <div key={tx._id} className="flex items-center justify-between px-xl py-lg">
                <div>
                  <p className="font-body text-body-md font-semibold">{tx.type}</p>
                  <p className="text-body-sm text-on-surface-variant">
                    {formatDate(tx.createdAt)}
                    {tx.verificationMethod && ` · ${tx.verificationMethod}`}
                  </p>
                </div>
                <p className={`font-mono font-bold ${tx.points >= 0 ? 'text-tertiary' : 'text-error'}`}>
                  {formatPoints(tx.points)} pts
                </p>
              </div>
            ))}
          </Card>
          {hasMore && (
            <Button variant="text" onClick={loadMore} loading={loading} className="w-fit self-center px-xl">
              Load more
            </Button>
          )}
        </>
      )}
    </div>
  );
}
