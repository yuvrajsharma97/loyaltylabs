import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { listStoreDisputes } from '../../api/storeOwner';
import { resolveDispute } from '../../api/disputes';
import { useStore } from './OwnerDashboard';
import Card from '../../shared/components/Card';
import Modal from '../../shared/components/Modal';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import { formatDate } from '../../shared/utils/formatters';

const TABS = [
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' }
];

export default function DisputesPanel() {
  const { store } = useStore();
  const [status, setStatus] = useState('open');
  const [disputes, setDisputes] = useState(null);
  const [resolving, setResolving] = useState(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setDisputes(null);
    listStoreDisputes(store._id, { status })
      .then(setDisputes)
      .catch((err) => toast.error(err.message || 'Could not load disputes'));
  };

  useEffect(() => {
    listStoreDisputes(store._id, { status })
      .then(setDisputes)
      .catch((err) => toast.error(err.message || 'Could not load disputes'));
  }, [store._id, status]);

  const handleResolve = async () => {
    setSubmitting(true);
    try {
      await resolveDispute(resolving._id, note || undefined);
      setResolving(null);
      setNote('');
      load();
      toast.success('Dispute resolved');
    } catch (err) {
      toast.error(err.message || 'Could not resolve dispute');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-xl max-w-[1100px] mx-auto">
      <h1 className="font-display text-display-md-mobile md:text-display-md">Disputes</h1>

      <div className="flex rounded-lg bg-surface-container-low p-1 gap-1 w-fit">
        {TABS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatus(value)}
            className={`px-xl py-sm rounded-md font-body text-body-sm font-semibold transition-colors ${
              status === value ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {!disputes ? (
        <LoadingSpinner />
      ) : disputes.length === 0 ? (
        <Card className="text-body-sm text-on-surface-variant">No {status} disputes.</Card>
      ) : (
        <div className="flex flex-col gap-md">
          {disputes.map((dispute) => (
            <Card key={dispute._id} className="flex flex-col sm:flex-row items-start justify-between gap-lg">
              <div className="flex flex-col gap-xs flex-1 min-w-0">
                <p className="font-body text-body-sm font-semibold text-on-surface-variant uppercase">
                  {dispute.transactionType}
                </p>
                <p className="text-body-md">{dispute.customerNote}</p>
                <p className="text-body-sm text-on-surface-variant">{formatDate(dispute.createdAt)}</p>
                {dispute.ownerNote && (
                  <p className="text-body-sm text-on-surface-variant italic">Your note: {dispute.ownerNote}</p>
                )}
              </div>
              {status === 'open' && (
                <button
                  type="button"
                  onClick={() => setResolving(dispute)}
                  className="font-body text-body-sm font-semibold text-primary hover:underline shrink-0"
                >
                  Resolve
                </button>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(resolving)}
        title="Resolve this dispute?"
        confirmText="Resolve"
        confirming={submitting}
        onConfirm={handleResolve}
        onCancel={() => {
          setResolving(null);
          setNote('');
        }}
      >
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note for your records"
          rows={3}
          className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-md font-body text-body-md placeholder:text-outline outline-none focus:border-primary transition-all"
        />
      </Modal>
    </div>
  );
}
