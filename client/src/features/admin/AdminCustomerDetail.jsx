import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getCustomer } from '../../api/admin';
import Card from '../../shared/components/Card';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import { formatDate } from '../../shared/utils/formatters';

export default function AdminCustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    getCustomer(id)
      .then(setData)
      .catch((err) => {
        toast.error(err.message || 'Could not load this customer');
        navigate('/admin/customers', { replace: true });
      });
  }, [id, navigate]);

  if (!data) {
    return <LoadingSpinner />;
  }

  const { customer, memberships } = data;

  return (
    <div className="flex flex-col gap-xl max-w-[1100px] mx-auto">
      <button
        type="button"
        onClick={() => navigate('/admin/customers')}
        className="flex items-center gap-xs text-body-sm font-semibold text-on-surface-variant hover:text-primary transition-colors w-fit"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to customers
      </button>

      <div className="flex flex-col gap-xs">
        <h1 className="font-display text-display-md-mobile md:text-display-md">{customer.name}</h1>
        <p className="text-on-surface-variant">{customer.email}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-lg">
        <Card className="flex flex-col gap-xs">
          <p className="font-mono text-label-mono text-on-surface-variant uppercase">Email verified</p>
          <p className="font-display text-headline-sm text-primary">{customer.emailVerified ? 'Yes' : 'No'}</p>
        </Card>
        <Card className="flex flex-col gap-xs">
          <p className="font-mono text-label-mono text-on-surface-variant uppercase">Onboarded</p>
          <p className="font-display text-headline-sm text-primary">{customer.onboardingCompleted ? 'Yes' : 'No'}</p>
        </Card>
        <Card className="flex flex-col gap-xs">
          <p className="font-mono text-label-mono text-on-surface-variant uppercase">Phone</p>
          <p className="font-display text-headline-sm text-primary">{customer.phone || '-'}</p>
        </Card>
        <Card className="flex flex-col gap-xs">
          <p className="font-mono text-label-mono text-on-surface-variant uppercase">Joined</p>
          <p className="font-display text-headline-sm text-primary">{formatDate(customer.createdAt)}</p>
        </Card>
      </div>

      <section className="flex flex-col gap-lg">
        <h2 className="font-display text-headline-sm">Store memberships</h2>
        {memberships.length === 0 ? (
          <Card className="text-body-sm text-on-surface-variant">Not a member of any store yet.</Card>
        ) : (
          <Card className="divide-y divide-outline-variant !p-0">
            {memberships.map((m) => (
              <div
                key={m.storeId || m.storeName}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-md px-xl py-lg"
              >
                <div className="flex items-center gap-sm min-w-0">
                  <p className="font-body text-body-md font-semibold truncate">{m.storeName}</p>
                  {m.storeStatus === 'suspended' && (
                    <span className="font-mono text-label-mono uppercase px-xs py-[2px] rounded bg-error-container text-on-error-container shrink-0">
                      Suspended
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-xl text-body-sm text-on-surface-variant shrink-0">
                  <span>Joined {formatDate(m.joinedAt)}</span>
                  <span>{m.lastActivityAt ? `Last visit ${formatDate(m.lastActivityAt)}` : 'No activity yet'}</span>
                  <span className="font-mono text-body-md font-semibold text-primary">
                    {m.pointsBalance.toLocaleString()} pts
                  </span>
                </div>
              </div>
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}
