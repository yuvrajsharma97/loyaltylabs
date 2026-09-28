import { useEffect, useState } from 'react';
import * as storesApi from '../../api/stores';
import { useAuth } from '../../shared/hooks/useAuth';
import { showSuccessToast, showErrorToast } from '../../shared/utils/toast';
import Button from '../../shared/components/Button';
import Input from '../../shared/components/Input';
import ToggleSwitch from '../../shared/components/ToggleSwitch';
import IconButton from '../../shared/components/IconButton';
import Icon from '../../shared/components/Icon';
import Card from '../../shared/components/Card';
import EmptyState from '../../shared/components/EmptyState';
import LoadingSpinner from '../../shared/components/LoadingSpinner';

// The backend replaces the whole PIN list on every save - there is no
// per-PIN patch endpoint, so this screen edits a local copy and always
// submits the full array.
const TillPinManager = () => {
  const { user: store } = useAuth();
  const [pins, setPins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    storesApi
      .getTillPins(store._id)
      .then(({ tillPins }) => setPins(tillPins))
      .finally(() => setIsLoading(false));
  }, [store._id]);

  const updatePin = (index, changes) => {
    setPins((current) => current.map((pin, i) => (i === index ? { ...pin, ...changes } : pin)));
  };

  const addPin = () => {
    setPins((current) => [...current, { pin: '', label: '', active: true }]);
  };

  const removePin = (index) => {
    setPins((current) => current.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const seenPins = new Set();
    for (const entry of pins) {
      if (!/^\d{4}$/.test(entry.pin)) {
        showErrorToast('Every PIN must be exactly 4 digits.');
        return;
      }
      if (seenPins.has(entry.pin)) {
        showErrorToast('PIN values must be unique.');
        return;
      }
      seenPins.add(entry.pin);
    }

    setIsSaving(true);
    try {
      const { tillPins } = await storesApi.updateTillPins(store._id, pins);
      setPins(tillPins);
      showSuccessToast('Till PINs updated.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner className="py-8" />;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-body-sm text-text-secondary">
        Staff enter a till PIN when awarding points or fulfilling rewards. Turn a PIN off to block it without deleting it.
      </p>

      {pins.length === 0 && (
        <EmptyState icon="pin" title="No till PINs yet" body="Add a PIN for each till or staff member." />
      )}

      {pins.map((entry, index) => (
        <Card key={index} className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="min-w-0 flex-1">
              <Input
                label="Label"
                placeholder="e.g. Front till"
                value={entry.label}
                onChange={(event) => updatePin(index, { label: event.target.value })}
                className="w-full"
              />
            </div>
            <div className="w-24 shrink-0">
              <Input
                label="PIN"
                placeholder="0000"
                value={entry.pin}
                onChange={(event) => updatePin(index, { pin: event.target.value.replace(/\D/g, '').slice(0, 4) })}
                inputMode="numeric"
                autoComplete="off"
                className="w-full text-center font-mono tabular-nums tracking-[0.3em]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-divider pt-3">
            <ToggleSwitch
              label={entry.active ? 'Active' : 'Disabled'}
              labelPlacement="end"
              checked={entry.active}
              onChange={(checked) => updatePin(index, { active: checked })}
            />
            <IconButton label="Remove PIN" onClick={() => removePin(index)}>
              <Icon name="delete" />
            </IconButton>
          </div>
        </Card>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={addPin}>
          Add till PIN
        </Button>
        <Button isLoading={isSaving} onClick={handleSave}>
          Save changes
        </Button>
      </div>
    </div>
  );
};

export default TillPinManager;
