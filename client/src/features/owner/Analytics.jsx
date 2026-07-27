import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getStoreAnalytics } from '../../api/storeOwner';
import { useStore } from './OwnerDashboard';
import OnboardingChecklist from './OnboardingChecklist';
import Card from '../../shared/components/Card';
import LoadingSpinner from '../../shared/components/LoadingSpinner';

function StatCard({ label, value }) {
  return (
    <Card hoverable className="flex flex-col gap-xs">
      <p className="font-mono text-label-mono text-on-surface-variant uppercase">{label}</p>
      <p className="font-display text-headline-sm text-primary">{value}</p>
    </Card>
  );
}

export default function Analytics() {
  const { store } = useStore();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getStoreAnalytics(store._id)
      .then(setStats)
      .catch((err) => toast.error(err.message || 'Could not load analytics'));
  }, [store._id]);

  return (
    <div className="flex flex-col gap-2xl max-w-[1100px] mx-auto">
      <h1 className="font-display text-display-md-mobile md:text-display-md">Overview</h1>

      <OnboardingChecklist onboarding={store.onboardingCompleted} />

      {!stats ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-lg">
            <StatCard label="Total visits" value={stats.totalVisits.toLocaleString()} />
            <StatCard label="Redemptions" value={stats.totalRedemptions.toLocaleString()} />
            <StatCard label="Redemption rate" value={`${Math.round(stats.redemptionRate * 100)}%`} />
            <StatCard label="Points issued" value={stats.totalPointsIssued.toLocaleString()} />
          </div>

          <section className="flex flex-col gap-lg">
            <h2 className="font-display text-headline-sm">Top rewards</h2>
            {stats.topRewards.length === 0 ? (
              <Card className="text-body-sm text-on-surface-variant">No fulfilled redemptions yet.</Card>
            ) : (
              <Card className="divide-y divide-outline-variant !p-0">
                {stats.topRewards.map((reward) => (
                  <div key={reward.rewardId} className="flex items-center justify-between px-xl py-lg">
                    <p className="font-body text-body-md font-semibold">{reward.title}</p>
                    <p className="font-mono text-body-sm text-on-surface-variant">{reward.count} redeemed</p>
                  </div>
                ))}
              </Card>
            )}
          </section>
        </>
      )}
    </div>
  );
}
