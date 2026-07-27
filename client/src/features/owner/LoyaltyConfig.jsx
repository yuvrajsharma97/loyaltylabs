import { useState } from 'react';
import toast from 'react-hot-toast';
import { updateLoyaltyConfig } from '../../api/storeOwner';
import { useStore } from './OwnerDashboard';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';

const inputClass =
  'w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-md font-body text-body-md outline-none focus:border-primary transition-all';
const labelClass = 'font-body text-body-sm text-on-surface-variant ml-xs';

export default function LoyaltyConfig() {
  const { store, refetch } = useStore();
  const program = store.loyaltyProgram;
  const [mode, setMode] = useState(program.mode);
  const [pointsPerUnit, setPointsPerUnit] = useState(program.pointsPerUnit ?? 1);
  const [fixedPointsPerVisit, setFixedPointsPerVisit] = useState(program.fixedPointsPerVisit ?? 10);
  const [minPurchase, setMinPurchase] = useState(program.minPurchase ?? 0);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateLoyaltyConfig(store._id, {
        mode,
        pointsPerUnit: mode === 'per_currency' ? Number(pointsPerUnit) : undefined,
        fixedPointsPerVisit: mode === 'per_visit' ? Number(fixedPointsPerVisit) : undefined,
        minPurchase: Number(minPurchase)
      });
      await refetch();
      toast.success('Saved');
    } catch (err) {
      toast.error(err.message || 'Could not save loyalty program settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="flex flex-col gap-lg">
      <h2 className="font-display text-headline-sm">Loyalty program</h2>
      <div className="flex rounded-lg bg-surface-container-low p-1 gap-1">
        {[
          ['per_currency', 'Per amount spent'],
          ['per_visit', 'Fixed per visit']
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={`flex-1 py-sm rounded-md font-body text-body-sm font-semibold transition-colors ${
              mode === value ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {mode === 'per_currency' ? (
        <div className="space-y-xs">
          <label className={labelClass}>Points per $1 spent</label>
          <input
            type="number"
            min="0"
            value={pointsPerUnit}
            onChange={(e) => setPointsPerUnit(e.target.value)}
            className={inputClass}
          />
        </div>
      ) : (
        <div className="space-y-xs">
          <label className={labelClass}>Points per visit</label>
          <input
            type="number"
            min="0"
            value={fixedPointsPerVisit}
            onChange={(e) => setFixedPointsPerVisit(e.target.value)}
            className={inputClass}
          />
        </div>
      )}
      <div className="space-y-xs">
        <label className={labelClass}>Minimum purchase ($)</label>
        <input
          type="number"
          min="0"
          value={minPurchase}
          onChange={(e) => setMinPurchase(e.target.value)}
          className={inputClass}
        />
      </div>
      <Button loading={saving} onClick={handleSave} className="w-fit px-xl">
        Save
      </Button>
    </Card>
  );
}
