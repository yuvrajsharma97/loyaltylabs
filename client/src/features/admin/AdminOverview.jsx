import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getMetrics } from '../../api/admin';
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

export default function AdminOverview() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    getMetrics()
      .then(setMetrics)
      .catch((err) => toast.error(err.message || 'Could not load metrics'));
  }, []);

  return (
    <div className="flex flex-col gap-2xl max-w-[1100px] mx-auto">
      <h1 className="font-display text-display-md-mobile md:text-display-md">Platform overview</h1>

      {!metrics ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-lg">
          <StatCard label="Total stores" value={metrics.totalStores.toLocaleString()} />
          <StatCard label="Active stores" value={metrics.activeStores.toLocaleString()} />
          <StatCard label="Suspended stores" value={metrics.suspendedStores.toLocaleString()} />
          <StatCard label="Total customers" value={metrics.totalCustomers.toLocaleString()} />
          <StatCard label="Total memberships" value={metrics.totalMemberships.toLocaleString()} />
          <StatCard label="Active memberships" value={metrics.activeMemberships.toLocaleString()} />
          <StatCard label="Open disputes" value={metrics.openDisputes.toLocaleString()} />
          <StatCard label="Points issued" value={metrics.totalPointsIssued.toLocaleString()} />
          <StatCard label="Points redeemed" value={metrics.totalPointsRedeemed.toLocaleString()} />
        </div>
      )}
    </div>
  );
}
