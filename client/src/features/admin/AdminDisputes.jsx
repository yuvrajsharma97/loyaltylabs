import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { listDisputes } from '../../api/admin';
import Card from '../../shared/components/Card';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import { formatDate } from '../../shared/utils/formatters';

const TABS = [
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'all', label: 'All' }
];

// Read-only, platform-wide - resolving a dispute stays a store-owner action
// (see the store dashboard's DisputesPanel); admin only needs visibility here.
export default function AdminDisputes() {
  const [status, setStatus] = useState('open');
  const [disputes, setDisputes] = useState(null);

  useEffect(() => {
    listDisputes({ status })
      .then(setDisputes)
      .catch((err) => toast.error(err.message || 'Could not load disputes'));
  }, [status]);

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
        <Card className="text-body-sm text-on-surface-variant">No {status === 'all' ? '' : status} disputes.</Card>
      ) : (
        <div className="flex flex-col gap-md">
          {disputes.map((dispute) => (
            <Card key={dispute._id} className="flex flex-col gap-xs">
              <p className="font-body text-body-sm font-semibold text-on-surface-variant uppercase">
                {dispute.transactionType}
              </p>
              <p className="text-body-md">{dispute.customerNote}</p>
              <p className="text-body-sm text-on-surface-variant">{formatDate(dispute.createdAt)}</p>
              {dispute.ownerNote && (
                <p className="text-body-sm text-on-surface-variant italic">Store note: {dispute.ownerNote}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
