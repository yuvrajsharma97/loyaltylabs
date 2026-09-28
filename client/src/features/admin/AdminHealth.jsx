import { useEffect, useState } from 'react';
import * as healthApi from '../../api/health';
import Badge from '../../shared/components/Badge';
import Card from '../../shared/components/Card';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import { formatDateTime } from '../../shared/utils/formatters';

const AdminHealth = () => {
  const [health, setHealth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    healthApi
      .getHealth()
      .then(setHealth)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="text-page-title text-text-primary">System health</h1>

      {isLoading ? (
        <LoadingSpinner className="py-16" />
      ) : (
        <Card className="mt-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-body text-text-secondary">API</span>
            <Badge tone={health?.status === 'ok' ? 'success' : 'error'}>{health?.status || 'unreachable'}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-body text-text-secondary">Database</span>
            <Badge tone={health?.db === 'connected' ? 'success' : 'error'}>{health?.db || 'unknown'}</Badge>
          </div>
          {health?.timestamp && (
            <div className="flex items-center justify-between">
              <span className="text-body text-text-secondary">Last checked</span>
              <span className="font-mono text-body-sm text-text-muted">{formatDateTime(health.timestamp)}</span>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default AdminHealth;
