import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as adminApi from '../../api/admin';
import { formatDate } from '../../shared/utils/formatters';
import { CATEGORY_LABELS } from '../../shared/utils/labels';
import Card from '../../shared/components/Card';
import Avatar from '../../shared/components/Avatar';
import Badge from '../../shared/components/Badge';
import Button from '../../shared/components/Button';
import Icon from '../../shared/components/Icon';
import KpiTile from '../../shared/components/KpiTile';
import EmptyState from '../../shared/components/EmptyState';
import LoadingSpinner from '../../shared/components/LoadingSpinner';

const AdminCustomerDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setData(null);
    setError(null);
    adminApi
      .getCustomer(id)
      .then(setData)
      .catch((err) => setError(err));
  }, [id]);

  const backLink = (
    <Link to="/admin/customers" className="inline-flex items-center gap-1 text-label text-text-secondary hover:text-text-primary">
      <Icon name="arrow_back" style={{ fontSize: '1.1rem' }} />
      Back to customers
    </Link>
  );

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        {backLink}
        <div className="mt-4">
          <EmptyState
            icon="person_off"
            title="Customer not found"
            body={error.message}
            action={
              <Link to="/admin/customers">
                <Button size="sm">Back to customers</Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  if (!data) {
    return <LoadingSpinner className="py-16" />;
  }

  const { customer, memberships } = data;
  const totalPoints = memberships.reduce((sum, membership) => sum + membership.pointsBalance, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {backLink}

      <Card className="mt-4 flex items-center gap-4">
        <Avatar name={customer.name} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-page-title text-text-primary">{customer.name}</h1>
          <p className="truncate text-body-sm text-text-secondary">{customer.email}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone={customer.emailVerified ? 'success' : 'warning'}>
              {customer.emailVerified ? 'Email verified' : 'Email unverified'}
            </Badge>
            <Badge tone={customer.onboardingCompleted ? 'success' : 'neutral'}>
              {customer.onboardingCompleted ? 'Onboarded' : 'Not onboarded'}
            </Badge>
          </div>
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-3 rail:grid-cols-4">
        <KpiTile label="Shops joined" value={memberships.length} />
        <KpiTile label="Points held" value={totalPoints.toLocaleString()} />
        <KpiTile label="Phone" value={customer.phone || '-'} />
        <KpiTile label="Joined" value={formatDate(customer.createdAt)} />
      </div>

      {customer.interests?.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-label text-text-muted">Interests</span>
          {customer.interests.map((interest) => (
            <span key={interest} className="rounded-pill border border-border bg-surface px-3 py-1 text-label text-text-secondary">
              {CATEGORY_LABELS[interest] || interest}
            </span>
          ))}
        </div>
      )}

      <h2 className="mt-6 text-label text-text-muted">Shop memberships</h2>
      <Card className="mt-2 py-1">
        {memberships.length === 0 ? (
          <div className="py-3">
            <EmptyState icon="storefront" title="Not a member of any shop yet" />
          </div>
        ) : (
          memberships.map((membership) => (
            <div
              key={membership.storeId || membership.storeName}
              className="flex flex-col gap-1 border-b border-divider py-3 last:border-0 wide:flex-row wide:items-center wide:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={membership.storeName} shape="square" size="sm" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-card-title text-text-primary">{membership.storeName}</p>
                    {membership.storeStatus === 'suspended' && <Badge tone="error">Suspended</Badge>}
                  </div>
                  <p className="text-body-sm text-text-muted">
                    Joined {formatDate(membership.joinedAt)} ·{' '}
                    {membership.lastActivityAt ? `last visit ${formatDate(membership.lastActivityAt)}` : 'no activity yet'}
                  </p>
                </div>
              </div>
              <span className="tabular-nums text-amount text-primary wide:text-right">
                {membership.pointsBalance.toLocaleString()} pts
              </span>
            </div>
          ))
        )}
      </Card>
    </div>
  );
};

export default AdminCustomerDetail;
