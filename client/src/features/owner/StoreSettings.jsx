import { useState } from 'react';
import * as storesApi from '../../api/stores';
import { useAuth } from '../../shared/hooks/useAuth';
import { showSuccessToast } from '../../shared/utils/toast';
import { getPlaceholderImageUrl } from '../../shared/utils/placeholderImage';
import { CATEGORIES } from '../../shared/utils/labels';
import { LIMITS, hasErrors, validateHttpUrl, validateText, validateTitle } from '../../shared/utils/validation';
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
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const clearError = (field) => setErrors((current) => ({ ...current, [field]: undefined }));

  // Only preview a URL that would actually be saved.
  const previewUrl = logoUrl.trim() && !validateHttpUrl(logoUrl) ? logoUrl.trim() : getPlaceholderImageUrl(name);

  const handleSave = async (event) => {
    event.preventDefault();
    const nextErrors = {
      name: validateTitle(name, { label: 'Store name' }),
      address: validateText(address, { label: 'Address', max: LIMITS.address }),
      logoUrl: validateHttpUrl(logoUrl, { label: 'Logo URL' }),
    };
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    setIsSaving(true);
    try {
      await storesApi.updateStore(store._id, {
        name: name.trim(),
        address: address.trim(),
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
    <form onSubmit={handleSave} className="flex flex-col gap-4" noValidate>
      <Input
        label="Store name"
        autoComplete="organization"
        maxLength={LIMITS.storeName}
        value={name}
        onChange={(event) => {
          setName(event.target.value);
          clearError('name');
        }}
        error={errors.name}
      />
      <Input
        label="Address (optional)"
        autoComplete="street-address"
        maxLength={LIMITS.address}
        value={address}
        onChange={(event) => {
          setAddress(event.target.value);
          clearError('address');
        }}
        error={errors.address}
      />

      <div className="flex items-start gap-3">
        <img
          src={previewUrl}
          alt=""
          className="mt-[26px] h-11 w-11 shrink-0 rounded-button border border-border object-cover"
        />
        <div className="min-w-0 flex-1">
          <Input
            label="Logo URL (optional)"
            type="url"
            inputMode="url"
            placeholder="https://..."
            maxLength={LIMITS.url}
            value={logoUrl}
            onChange={(event) => {
              setLogoUrl(event.target.value);
              clearError('logoUrl');
            }}
            className="w-full"
            error={errors.logoUrl}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="store-category" className="text-label text-text-secondary">
          Category
        </label>
        <select
          id="store-category"
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

      <Button type="submit" isLoading={isSaving} className="self-start">
        Save changes
      </Button>
    </form>
  );
};

export default StoreSettings;
