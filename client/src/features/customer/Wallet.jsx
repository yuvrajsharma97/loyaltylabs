import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import * as customerApi from '../../api/customer';
import { usePaginatedList } from '../../shared/hooks/usePaginatedList';
import { useJoinedStores } from './useJoinedStores';
import BalanceDisplay from '../../shared/components/BalanceDisplay';
import Card from '../../shared/components/Card';
import Avatar from '../../shared/components/Avatar';
import SkeletonRow from '../../shared/components/SkeletonRow';
import EmptyState from '../../shared/components/EmptyState';
import Button from '../../shared/components/Button';
import Modal from '../../shared/components/Modal';
import IconButton from '../../shared/components/IconButton';
import Icon from '../../shared/components/Icon';
import { showSuccessToast } from '../../shared/utils/toast';
import { getTransactionLabel } from '../../shared/utils/labels';
import { formatDateTime, formatSignedPoints } from '../../shared/utils/formatters';
import Pagination from '../../shared/components/Pagination';
import ScrollPanel from '../../shared/components/ScrollPanel';

const PAGE_SIZE = 10;

// Only earn/redeem/reversal ledger entries map onto the dispute schema's
// three-value transactionType enum - adjust/expiry/suspension_reversal are
// system-driven entries with no dispute path.
function getDisputeTarget(transaction) {
  if (transaction.type === 'earn' || transaction.type === 'reversal') {
    return { transactionId: transaction._id, transactionType: transaction.type };
  }
  if (transaction.type === 'redeem' && transaction.relatedRedemptionId) {
    return { transactionId: transaction.relatedRedemptionId, transactionType: 'redemption' };
  }
  return null;
}

// Balance summary: total points plus a per-shop breakdown. On desktop it's a
// side column (the shop list scrolls if it outgrows the screen); on phones it
// sits above Activity with the shop list collapsed behind a toggle so the
// activity list keeps most of the screen.
const BalanceCard = ({ memberships, totalPoints }) => {
  const [isShopListOpen, setIsShopListOpen] = useState(false);

  return (
    <Card className="flex min-h-0 flex-col gap-4 rail:max-h-full">
      <BalanceDisplay points={totalPoints} />

      <div className="flex min-h-0 flex-1 flex-col border-t border-divider pt-3">
        <button
          type="button"
          onClick={() => setIsShopListOpen((isOpen) => !isOpen)}
          aria-expanded={isShopListOpen}
          className="flex items-center justify-between text-label text-text-muted rail:pointer-events-none"
        >
          <span>By shop ({memberships.length})</span>
          <Icon
            name={isShopListOpen ? 'expand_less' : 'expand_more'}
            className="rail:hidden"
            style={{ fontSize: '1.2rem' }}
          />
        </button>
        {memberships.length === 0 ? (
          <p className="mt-2 text-body-sm text-text-secondary">Join a shop to start earning points.</p>
        ) : (
          <ScrollPanel
            className={`-mx-2 mt-1 max-h-36 rail:block rail:max-h-none rail:flex-1 ${isShopListOpen ? '' : 'hidden'}`}
          >
            {memberships.map((membership) => (
              <Link
                key={membership._id}
                to={`/customer/shops/${membership.storeId}`}
                className="flex items-center gap-3 rounded-button px-2 py-2 transition-colors duration-150 hover:bg-primary-tint"
              >
                <Avatar
                  name={membership.store?.name}
                  imageUrl={membership.store?.logoUrl}
                  shape="square"
                  size="sm"
                />
                <span className="min-w-0 flex-1 truncate text-body text-text-primary">
                  {membership.store?.name || 'Shop no longer listed'}
                </span>
                <span className="shrink-0 tabular-nums text-body-sm text-text-secondary">
                  {membership.pointsBalance.toLocaleString()} pts
                </span>
              </Link>
            ))}
          </ScrollPanel>
        )}
      </div>
    </Card>
  );
};

const TransactionRow = ({ transaction, storeName, onFlag }) => {
  const disputeTarget = getDisputeTarget(transaction);
  const isPositive = transaction.points > 0;

  return (
    <div className="flex items-center gap-3 border-b border-divider py-3 last:border-0">
      <Avatar name={storeName} shape="square" size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-card-title text-text-primary">{storeName}</p>
        <p className="truncate text-body-sm text-text-secondary">
          {getTransactionLabel(transaction.type)} · {formatDateTime(transaction.createdAt)}
        </p>
      </div>
      <span
        className={`shrink-0 tabular-nums text-body font-semibold ${isPositive ? 'text-success-text' : 'text-error-text'}`}
      >
        {formatSignedPoints(transaction.points)}
      </span>
      {/* Fixed-width slot so amounts line up whether or not a row can be flagged. */}
      <div className="flex w-11 shrink-0 justify-center">
        {disputeTarget && (
          <IconButton label="Flag this transaction" onClick={() => onFlag({ transaction, disputeTarget })}>
            <Icon name="flag" style={{ fontSize: '1.2rem' }} />
          </IconButton>
        )}
      </div>
    </div>
  );
};

const Wallet = () => {
  const { joinedStores } = useJoinedStores();
  const [flaggedTransaction, setFlaggedTransaction] = useState(null);

  const fetchPage = useCallback(
    (page) =>
      customerApi
        .getTransactions({ page, limit: PAGE_SIZE })
        .then(({ transactions, pagination }) => ({ items: transactions, pagination })),
    []
  );
  const { items: transactions, pagination, setPage, isLoading, error } = usePaginatedList(fetchPage);

  const storeNameById = useMemo(() => {
    const map = {};
    joinedStores.forEach((membership) => {
      if (membership.store) map[membership.storeId] = membership.store.name;
    });
    return map;
  }, [joinedStores]);

  const totalPoints = joinedStores.reduce((sum, membership) => sum + membership.pointsBalance, 0);

  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col px-4 pb-3 pt-4 rail:pb-6 rail:pt-6">
      <div className="shrink-0">
        <h1 className="text-page-title text-text-primary">Wallet</h1>
        <p className="mt-1 hidden text-body-sm text-text-secondary wide:block">
          Your points at every shop, and everything that changed them.
        </p>
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col gap-4 rail:grid rail:grid-cols-[minmax(0,1fr)_320px] rail:grid-rows-[minmax(0,1fr)] rail:gap-6">
        {/* Sized to its content on desktop, capped at the column height (then the shop list scrolls). */}
        <aside className="shrink-0 rail:order-last rail:flex rail:min-h-0 rail:flex-col">
          <BalanceCard memberships={joinedStores} totalPoints={totalPoints} />
        </aside>

        <section className="flex min-h-48 flex-1 flex-col rail:min-h-0">
          <h2 className="shrink-0 text-section text-text-primary">Activity</h2>
          <ScrollPanel
            resetKey={transactions[0]?._id}
            className={`mt-3 flex-1 rounded-card border border-border bg-surface px-4 shadow-card transition-opacity duration-150 ${
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
              <div className="py-4">
                <EmptyState icon="receipt_long" title="No activity yet" body="Points you earn and spend show up here." />
              </div>
            )}

            {transactions.map((transaction) => (
              <TransactionRow
                key={transaction._id}
                transaction={transaction}
                storeName={storeNameById[transaction.storeId] || 'Shop'}
                onFlag={setFlaggedTransaction}
              />
            ))}
          </ScrollPanel>
          <Pagination
            pagination={pagination}
            onPageChange={setPage}
            isDisabled={isLoading}
            itemLabel="transactions"
            className="shrink-0 pt-3"
          />
        </section>
      </div>

      <DisputeModal entry={flaggedTransaction} onClose={() => setFlaggedTransaction(null)} />
    </div>
  );
};

const DisputeModal = ({ entry, onClose }) => {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await customerApi.createDispute({
        storeId: entry.transaction.storeId,
        transactionId: entry.disputeTarget.transactionId,
        transactionType: entry.disputeTarget.transactionType,
        customerNote: note,
      });
      showSuccessToast('Dispute submitted - the shop will take a look.');
      setNote('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={Boolean(entry)} onClose={onClose} title="Flag this transaction">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="What went wrong?"
          rows={4}
          required
          className="rounded-input border border-border bg-surface p-3 text-body text-text-primary outline-none focus:border-primary"
        />
        <Button type="submit" isLoading={isSubmitting}>
          Submit
        </Button>
      </form>
    </Modal>
  );
};

export default Wallet;
