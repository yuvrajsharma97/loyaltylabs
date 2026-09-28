import { useState } from 'react';
import * as customerApi from '../../api/customer';
import { useAuth } from '../../shared/hooks/useAuth';
import { showSuccessToast } from '../../shared/utils/toast';
import { LIMITS, hasErrors, sanitizePhone, validatePersonName, validatePhone } from '../../shared/utils/validation';
import { CATEGORIES } from '../../shared/utils/labels';
import Card from '../../shared/components/Card';
import Input from '../../shared/components/Input';
import Button from '../../shared/components/Button';
import Avatar from '../../shared/components/Avatar';
import Icon from '../../shared/components/Icon';
import ChangePasswordCard from '../../shared/components/ChangePasswordCard';
import SessionsCard from '../../shared/components/SessionsCard';

const AccountSettings = () => {
  const { user, refreshProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [interests, setInterests] = useState(user?.interests || []);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges =
    name.trim() !== (user?.name || '') ||
    phone.trim() !== (user?.phone || '') ||
    [...interests].sort().join() !== [...(user?.interests || [])].sort().join();

  const toggleInterest = (value) => {
    setInterests((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const nextErrors = { name: validatePersonName(name, { label: 'Full name' }), phone: validatePhone(phone) };
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    setIsSaving(true);
    try {
      await customerApi.updateMe({ name: name.trim(), phone: phone.trim(), interests });
      await refreshProfile();
      showSuccessToast('Profile updated.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-page-title text-text-primary">Account</h1>
      <p className="mt-1 text-body-sm text-text-secondary">Your details, password and signed-in devices.</p>

      <div className="mt-5 flex flex-col gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <Avatar name={name || user?.name} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-card-title text-text-primary">{name || user?.name}</p>
              <p className="truncate text-body-sm text-text-secondary">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="mt-5 flex flex-col gap-4" noValidate>
            <Input
              label="Full name"
              autoComplete="name"
              maxLength={LIMITS.personName}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setErrors((current) => ({ ...current, name: undefined }));
              }}
              className="w-full"
              error={errors.name}
            />
            <div className="flex flex-col gap-1.5">
              <Input label="Email" type="email" value={user?.email || ''} disabled readOnly className="w-full" />
              <span className="flex items-center gap-1 text-body-sm text-text-muted">
                <Icon name="lock" style={{ fontSize: '0.95rem' }} />
                Your email is your sign-in, so it can&apos;t be changed here.
              </span>
            </div>
            <Input
              label="Phone (optional)"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="07700 900123"
              value={phone}
              onChange={(event) => {
                setPhone(sanitizePhone(event.target.value));
                setErrors((current) => ({ ...current, phone: undefined }));
              }}
              className="w-full"
              error={errors.phone}
            />

            <div>
              <span className="text-label text-text-secondary">Interests</span>
              <p className="text-body-sm text-text-muted">We use these to suggest shops you might like.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {CATEGORIES.map((option) => {
                  const isSelected = interests.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => toggleInterest(option.value)}
                      className={`flex items-center gap-1.5 rounded-pill border px-3.5 py-1.5 text-label transition-colors duration-150 ${
                        isSelected
                          ? 'border-primary bg-primary-tint text-primary'
                          : 'border-border bg-surface text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <Icon name={option.icon} style={{ fontSize: '1.05rem' }} />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button type="submit" isLoading={isSaving} disabled={!hasChanges} className="self-start">
              Save changes
            </Button>
          </form>
        </Card>

        {/* Google-only customers have no password yet - they can set one. */}
        <ChangePasswordCard hasPassword={user?.authProvider !== 'google'} onPasswordChanged={refreshProfile} />

        <SessionsCard />
      </div>
    </div>
  );
};

export default AccountSettings;
