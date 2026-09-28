import { useState } from 'react';
import * as storesApi from '../../api/stores';
import { useAuth } from '../../shared/hooks/useAuth';
import { showSuccessToast, showErrorToast } from '../../shared/utils/toast';
import { getPlaceholderImageUrl } from '../../shared/utils/placeholderImage';
import { CATEGORIES } from '../../shared/utils/labels';
import Button from '../../shared/components/Button';
import Input from '../../shared/components/Input';
import ToggleSwitch from '../../shared/components/ToggleSwitch';

const StoreSettings = () => {
  const { user: store, refreshProfile } = useAuth();
  const [name, setName] = useState(store.name);
  const [address, setAddress] = useState(store.address || '');
  const [logoUrl, setLogoUrl] = useState(store.logoUrl || '');
  const [category, setCategory] = useState(store.category);
  const [discoverable, setDiscoverable] = useState(store.discoverable);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      showErrorToast('Store name is required.');
      return;
    }
    setIsSaving(true);
    try {
      await storesApi.updateStore(store._id, {
        name: name.trim(),
        address,
        logoUrl: logoUrl.trim(),
        category,
        discoverable,
      });
      await refreshProfile();
      showSuccessToast('Store profile updated.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Input label="Store name" value={name} onChange={(event) => setName(event.target.value)} required />
      <Input label="Address" value={address} onChange={(event) => setAddress(event.target.value)} />

      <div className="flex items-end gap-3">
        <img
          src={logoUrl.trim() || getPlaceholderImageUrl(name)}
          alt=""
          className="h-11 w-11 shrink-0 rounded-button border border-border object-cover"
        />
        <div className="min-w-0 flex-1">
          <Input
            label="Logo URL (optional)"
            type="url"
            placeholder="https://..."
            value={logoUrl}
            onChange={(event) => setLogoUrl(event.target.value)}
            className="w-full"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-label text-text-secondary">Category</label>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="h-11 rounded-input border border-border bg-surface px-3 text-body text-text-primary outline-none focus:border-primary"
        >
          {CATEGORIES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <ToggleSwitch
        label="Discoverable in the shop directory"
        checked={discoverable}
        onChange={setDiscoverable}
      />

      <Button isLoading={isSaving} onClick={handleSave} className="self-start">
        Save changes
      </Button>
    </div>
  );
};

export default StoreSettings;
