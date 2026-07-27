import { useState } from 'react';
import toast from 'react-hot-toast';
import { updateStore } from '../../api/storeOwner';
import { useStore } from './OwnerDashboard';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';

const CATEGORIES = [
  { value: 'cafe', label: 'Cafe' },
  { value: 'retail', label: 'Retail' },
  { value: 'services', label: 'Services' },
  { value: 'other', label: 'Other' }
];

const inputClass =
  'w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-md font-body text-body-md placeholder:text-outline outline-none focus:border-primary transition-all';
const labelClass = 'font-body text-body-sm text-on-surface-variant ml-xs';

export default function StoreSettings() {
  const { store, refetch } = useStore();
  const [name, setName] = useState(store.name);
  const [address, setAddress] = useState(store.address || '');
  const [logoUrl, setLogoUrl] = useState(store.logoUrl || '');
  const [category, setCategory] = useState(store.category);
  const [discoverable, setDiscoverable] = useState(store.discoverable);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Store name is required');
      return;
    }
    setSaving(true);
    try {
      await updateStore(store._id, {
        name,
        address: address || undefined,
        logoUrl: logoUrl || undefined,
        category,
        discoverable
      });
      await refetch();
      toast.success('Saved');
    } catch (err) {
      toast.error(err.message || 'Could not save store settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="flex flex-col gap-lg">
      <h2 className="font-display text-headline-sm">Store information</h2>
      <div className="space-y-xs">
        <label className={labelClass}>Store name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </div>
      <div className="space-y-xs">
        <label className={labelClass}>Address</label>
        <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
      </div>
      <div className="space-y-xs">
        <label className={labelClass}>Logo URL</label>
        <input
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://..."
          className={inputClass}
        />
      </div>
      <div className="space-y-xs">
        <label className={labelClass}>Category</label>
        <div className="grid grid-cols-2 gap-sm">
          {CATEGORIES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(value)}
              className={`py-md rounded-lg font-body text-body-sm font-semibold border-2 transition-all ${
                category === value
                  ? 'border-primary bg-primary-container/20 text-primary'
                  : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <label className="flex items-center justify-between px-md py-md rounded-lg bg-surface-container-low">
        <span className="font-body text-body-md">Discoverable in the shop directory</span>
        <input
          type="checkbox"
          checked={discoverable}
          onChange={(e) => setDiscoverable(e.target.checked)}
          className="w-5 h-5 accent-primary"
        />
      </label>
      <Button loading={saving} onClick={handleSave} className="w-fit px-xl">
        Save
      </Button>
    </Card>
  );
}
