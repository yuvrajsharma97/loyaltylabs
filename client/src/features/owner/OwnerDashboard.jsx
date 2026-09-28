import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as storesApi from '../../api/stores';
import { useAuth } from '../../shared/hooks/useAuth';
import KpiTile from '../../shared/components/KpiTile';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';
import Icon from '../../shared/components/Icon';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import EmptyState from '../../shared/components/EmptyState';
import OnboardingChecklist from './OnboardingChecklist';

const OwnerDashboard = () => {
  const { user: store, refreshProfile } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Onboarding flags change elsewhere (e.g. a first till scan), so refresh
    // the store profile whenever the overview is opened.
    refreshProfile();
    storesApi
      .getStoreAnalytics(store._id)
      .then(setAnalytics)
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store._id]);

  if (isLoading) {
    return <LoadingSpinner className="py-16" />;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-page-title text-text-primary">Overview</h1>
          <p className="mt-1 text-body-sm text-text-secondary">What&apos;s happened at {store.name}.</p>
        </div>
        <Link to="/store/till">
          <Button size="sm">
            <Icon name="point_of_sale" style={{ fontSize: '1.1rem' }} />
            Open till
          </Button>
        </Link>
      </div>

      {store.status === 'suspended' && (
        <Card className="mt-5 flex items-start gap-3 border-error bg-error-bg">
          <Icon name="block" className="text-error" />
          <p className="text-body-sm text-error-text">
            This store is suspended. Customers can&apos;t earn or redeem points here until it&apos;s reactivated - contact support.
          </p>
        </Card>
      )}

      <div className="mt-5">
        <OnboardingChecklist onboarding={store.onboardingCompleted} />
      </div>

      {analytics && (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 rail:grid-cols-3">
            <KpiTile label="Visits" value={analytics.totalVisits.toLocaleString()} />
            <KpiTile label="Redemptions" value={analytics.totalRedemptions.toLocaleString()} />
            <KpiTile label="Fulfilment rate" value={`${Math.round(analytics.redemptionRate * 100)}%`} />
            <KpiTile label="Points issued" value={analytics.totalPointsIssued.toLocaleString()} />
            <KpiTile label="Points redeemed" value={analytics.totalPointsRedeemed.toLocaleString()} />
            <KpiTile label="Fulfilled" value={analytics.fulfilledRedemptions.toLocaleString()} />
          </div>

          <h2 className="mt-6 text-label text-text-muted">Top rewards</h2>
          <Card className="mt-2">
            {analytics.topRewards.length === 0 && <EmptyState icon="redeem" title="No redemptions yet" />}
            {analytics.topRewards.map((reward, index) => (
              <div
                key={reward.rewardId}
                className="flex items-center gap-3 border-b border-divider py-2.5 last:border-0"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-tint tabular-nums text-label text-primary">
                  {index + 1}
                </span>
                <span className="flex-1 text-body text-text-primary">{reward.title}</span>
                <span className="tabular-nums text-body-sm text-text-secondary">{reward.count} redeemed</span>
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
};

export default OwnerDashboard;
