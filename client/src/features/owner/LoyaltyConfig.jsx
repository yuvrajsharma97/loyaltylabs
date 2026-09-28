import { useEffect, useState } from 'react';
import * as storesApi from '../../api/stores';
import { useAuth } from '../../shared/hooks/useAuth';
import { showSuccessToast } from '../../shared/utils/toast';
import Button from '../../shared/components/Button';
import Input from '../../shared/components/Input';
import SegmentedControl from '../../shared/components/SegmentedControl';
import LoadingSpinner from '../../shared/components/LoadingSpinner';

const MODE_OPTIONS = [
  { value: 'per_currency', label: 'Per £ spent' },
  { value: 'per_visit', label: 'Per visit' },
];

const LoyaltyConfig = () => {
  const { user: store } = useAuth();
  const [config, setConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    storesApi
      .getLoyaltyConfig(store._id)
      .then(setConfig)
      .finally(() => setIsLoading(false));
  }, [store._id]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await storesApi.updateLoyaltyConfig(store._id, {
        mode: config.mode,
        pointsPerUnit: config.mode === 'per_currency' ? Number(config.pointsPerUnit) : undefined,
        fixedPointsPerVisit: config.mode === 'per_visit' ? Number(config.fixedPointsPerVisit) : undefined,
        minPurchase: Number(config.minPurchase) || 0,
        pointsExpiryDays: config.pointsExpiryDays ? Number(config.pointsExpiryDays) : null,
        maxPointsBalance: config.maxPointsBalance ? Number(config.maxPointsBalance) : null,
      });
      setConfig(updated);
      showSuccessToast('Earning rules updated.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !config) {
    return <LoadingSpinner className="py-8" />;
  }

  return (
    <div className="flex flex-col gap-4">
      <SegmentedControl
        options={MODE_OPTIONS}
        value={config.mode}
        onChange={(mode) => setConfig({ ...config, mode })}
      />

      {config.mode === 'per_currency' ? (
        <Input
          label="Points per £1 spent"
          type="number"
          min="0"
          value={config.pointsPerUnit}
          onChange={(event) => setConfig({ ...config, pointsPerUnit: event.target.value })}
        />
      ) : (
        <Input
          label="Points per visit"
          type="number"
          min="0"
          value={config.fixedPointsPerVisit}
          onChange={(event) => setConfig({ ...config, fixedPointsPerVisit: event.target.value })}
        />
      )}

      <Input
        label="Minimum purchase (£, optional)"
        type="number"
        min="0"
        value={config.minPurchase}
        onChange={(event) => setConfig({ ...config, minPurchase: event.target.value })}
      />
      <Input
        label="Points expire after (days, optional)"
        type="number"
        min="1"
        value={config.pointsExpiryDays || ''}
        onChange={(event) => setConfig({ ...config, pointsExpiryDays: event.target.value })}
      />
      <Input
        label="Maximum points balance (optional)"
        type="number"
        min="1"
        value={config.maxPointsBalance || ''}
        onChange={(event) => setConfig({ ...config, maxPointsBalance: event.target.value })}
      />

      <Button isLoading={isSaving} onClick={handleSave} className="self-start">
        Save changes
      </Button>
    </div>
  );
};

export default LoyaltyConfig;
