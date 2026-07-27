import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { listStores } from '../../api/stores';
import { getTransactions, createDispute } from '../../api/customer';
import usePaginatedList from '../../shared/hooks/usePaginatedList';
import { useCustomer } from './CustomerDashboard';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';
import Modal from '../../shared/components/Modal';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import { formatDate, formatPoints } from '../../shared/utils/formatters';

const TYPE_LABELS = {
  earn: 'Earned points',
  redeem: 'Redeemed reward',
  adjust: 'Balance adjusted',
  reversal: 'Reversed',
  expiry: 'Points expired',
  suspension_reversal: 'Reversed (suspension)'
};

// Only these three map to a disputable Dispute.transactionType - 'adjust',
// 'expiry', and 'suspension_reversal' aren't in that enum on the backend.
function disputeArgsFor(tx) {
  if (tx.type === 'earn') return { transactionId: tx._id, transactionType: 'earn' };
  if (tx.type === 'reversal') return { transactionId: tx._id, transactionType: 'reversal' };
  if (tx.type === 'redeem' && tx.relatedRedemptionId) {
    return { transactionId: tx.relatedRedemptionId, transactionType: 'redemption' };
  }
  return null;
}

export default function Wallet() {
  const { me } = useCustomer();
  const [storeNames, setStoreNames] = useState({});
  const [disputeTx, setDisputeTx] = useState(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listStores()
      .then((stores) => {
        setStoreNames(Object.fromEntries(stores.map((s) => [s._id, s.name])));
      })
      .catch(() => {});
  }, []);

  const { items: transactions, loading, hasMore, loadMore } = usePaginatedList(getTransactions, {
    itemsKey: 'transactions',
    limit: 20
  });

  const handleSubmitDispute = async () => {
    const args = disputeArgsFor(disputeTx);
    if (!args) return;
    if (!note.trim()) {
      toast.error('Please describe the issue');
      return;
    }
    setSubmitting(true);
    try {
      await createDispute({ storeId: disputeTx.storeId, customerNote: note, ...args });
      toast.success('Dispute submitted');
      setDisputeTx(null);
      setNote('');
    } catch (err) {
      toast.error(err.message || 'Could not submit dispute');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2xl max-w-[1100px] mx-auto">
      <h1 className="font-display text-display-md-mobile md:text-display-md">Wallet</h1>

      <section className="flex flex-col gap-lg">
        <h2 className="font-display text-headline-sm">Balances</h2>
        {me.memberships.length === 0 ? (
          <Card className="text-body-sm text-on-surface-variant">Join a shop to start earning points.</Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
            {me.memberships.map((m) => (
              <Card key={m.storeId} hoverable className="flex flex-col gap-xs">
                <p className="font-body text-body-sm font-semibold text-on-surface-variant">
                  {storeNames[m.storeId] || 'Shop'}
                </p>
                <p className="font-display text-headline-sm text-primary">{m.pointsBalance.toLocaleString()} pts</p>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-lg">
        <h2 className="font-display text-headline-sm">Transaction history</h2>
        {transactions.length === 0 && loading ? (
          <LoadingSpinner />
        ) : transactions.length === 0 ? (
          <Card className="text-body-sm text-on-surface-variant">No transactions yet.</Card>
        ) : (
          <>
            <Card className="divide-y divide-outline-variant !p-0">
              {transactions.map((tx) => (
                <div key={tx._id} className="flex items-center justify-between px-xl py-lg gap-md">
                  <div className="min-w-0">
                    <p className="font-body text-body-md font-semibold">{TYPE_LABELS[tx.type] || tx.type}</p>
                    <p className="text-body-sm text-on-surface-variant truncate">
                      {storeNames[tx.storeId] || 'Shop'} &middot; {formatDate(tx.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-md shrink-0">
                    <p className={`font-mono font-bold ${tx.points >= 0 ? 'text-tertiary' : 'text-error'}`}>
                      {formatPoints(tx.points)} pts
                    </p>
                    {disputeArgsFor(tx) && (
                      <button
                        type="button"
                        onClick={() => setDisputeTx(tx)}
                        aria-label="Flag this transaction"
                        className="text-on-surface-variant hover:text-error transition-colors"
                      >
                        <span className="material-symbols-outlined">flag</span>
                      </button>
                    )}
                  </div>
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
      </section>

      <Modal
        open={Boolean(disputeTx)}
        title="Flag this transaction"
        confirmText="Submit"
        confirming={submitting}
        onConfirm={handleSubmitDispute}
        onCancel={() => {
          setDisputeTx(null);
          setNote('');
        }}
      >
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What went wrong?"
          rows={4}
          className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-md font-body text-body-md placeholder:text-outline outline-none focus:border-primary transition-all"
        />
      </Modal>
    </div>
  );
}
