import { useState } from 'react';
import toast from 'react-hot-toast';
import { updateTillPins } from '../../api/storeOwner';
import { useStore } from './OwnerDashboard';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';

const inputClass =
  'w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-md font-body text-body-md placeholder:text-outline outline-none focus:border-primary transition-all';

export default function TillPinManager() {
  const { store, refetch } = useStore();
  const [pins, setPins] = useState(store.tillPins || []);
  const [newPin, setNewPin] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [saving, setSaving] = useState(false);

  const addPin = () => {
    if (!/^\d{4}$/.test(newPin)) {
      toast.error('PIN must be exactly 4 digits');
      return;
    }
    setPins((prev) => [...prev, { pin: newPin, label: newLabel || 'Staff', active: true }]);
    setNewPin('');
    setNewLabel('');
  };

  const removePin = (index) => {
    setPins((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleActive = (index) => {
    setPins((prev) => prev.map((p, i) => (i === index ? { ...p, active: !p.active } : p)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTillPins(store._id, pins);
      await refetch();
      toast.success('Saved');
    } catch (err) {
      toast.error(err.message || 'Could not save till PINs');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="flex flex-col gap-lg">
      <h2 className="font-display text-headline-sm">Employee till PINs</h2>

      {pins.length === 0 ? (
        <p className="text-body-sm text-on-surface-variant">No PINs yet - add one below.</p>
      ) : (
        <div className="flex flex-col gap-sm">
          {pins.map((p, i) => (
            <div key={i} className="flex items-center gap-sm md:gap-md px-md py-sm rounded-lg bg-surface-container-low">
              <span className="font-mono text-body-lg tracking-[0.2em] shrink-0">{p.pin}</span>
              <span className="flex-grow min-w-0 truncate font-body text-body-sm text-on-surface-variant">
                {p.label}
              </span>
              <button
                type="button"
                onClick={() => toggleActive(i)}
                className={`shrink-0 font-body text-body-sm font-semibold px-sm md:px-md py-2xs rounded-full whitespace-nowrap ${
                  p.active ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                {p.active ? 'Active' : 'Inactive'}
              </button>
              <button
                type="button"
                onClick={() => removePin(i)}
                aria-label="Remove PIN"
                className="shrink-0 text-on-surface-variant hover:text-error transition-colors"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-sm sm:items-end">
        <div className="w-full sm:w-24 shrink-0">
          <input
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="1234"
            inputMode="numeric"
            className={`${inputClass} font-mono tracking-[0.2em] text-center`}
          />
        </div>
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Label, e.g. Morning shift"
          className={`${inputClass} flex-grow`}
        />
        <Button variant="text" className="border border-outline-variant px-lg" onClick={addPin}>
          Add
        </Button>
      </div>

      <Button loading={saving} onClick={handleSave} className="w-fit px-xl">
        Save
      </Button>
    </Card>
  );
}
