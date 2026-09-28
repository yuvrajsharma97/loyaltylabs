import { useEffect, useState } from 'react';
import * as adminApi from '../../api/admin';
import KpiTile from '../../shared/components/KpiTile';
import LoadingSpinner from '../../shared/components/LoadingSpinner';

const AdminOverview = () => {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    adminApi.getMetrics().then(setMetrics);
  }, []);

  if (!metrics) {
    return <LoadingSpinner className="py-16" />;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-page-title text-text-primary">Platform stats</h1>

      <div className="mt-5 grid grid-cols-2 gap-3 rail:grid-cols-4">
        <KpiTile label="Total stores" value={metrics.totalStores} />
        <KpiTile label="Active stores" value={metrics.activeStores} />
        <KpiTile label="Suspended stores" value={metrics.suspendedStores} />
        <KpiTile label="Total customers" value={metrics.totalCustomers} />
        <KpiTile label="Total memberships" value={metrics.totalMemberships} />
        <KpiTile label="Active memberships" value={metrics.activeMemberships} />
        <KpiTile label="Open disputes" value={metrics.openDisputes} />
        <KpiTile label="Points issued" value={metrics.totalPointsIssued} />
        <KpiTile label="Points redeemed" value={metrics.totalPointsRedeemed} />
      </div>
    </div>
  );
};

export default AdminOverview;
