import { useState } from 'react';
import Button from '../../../shared/components/Button';

const inputClass =
  'w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-md font-body text-body-md outline-none focus:border-primary transition-all';
const labelClass = 'font-body text-body-sm text-on-surface-variant ml-xs';

export default function EarnForm({ onSubmit, submitting }) {
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [tillPin, setTillPin] = useState('');

  const handleSubmit = () => {
    onSubmit({ purchaseAmount: Number(purchaseAmount), tillPin });
  };

  return (
    <div className="flex flex-col gap-lg">
      <div className="space-y-xs">
        <label className={labelClass}>Purchase amount ($)</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={purchaseAmount}
          onChange={(e) => setPurchaseAmount(e.target.value)}
          className={inputClass}
          autoFocus
        />
      </div>
      <div className="space-y-xs">
        <label className={labelClass}>Your till PIN</label>
        <input
          value={tillPin}
          onChange={(e) => setTillPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          inputMode="numeric"
          placeholder="1234"
          className={`${inputClass} font-mono tracking-[0.2em] text-center`}
        />
      </div>
      <Button
        loading={submitting}
        disabled={!purchaseAmount || tillPin.length !== 4}
        onClick={handleSubmit}
      >
        Confirm & award points
      </Button>
    </div>
  );
}
