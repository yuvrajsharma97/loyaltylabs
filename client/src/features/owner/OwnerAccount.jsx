import { useEffect, useState } from 'react';
import * as authApi from '../../api/auth';
import { showErrorToast, showSuccessToast } from '../../shared/utils/toast';
import Card from '../../shared/components/Card';
import Input from '../../shared/components/Input';
import Button from '../../shared/components/Button';
import Avatar from '../../shared/components/Avatar';
import Icon from '../../shared/components/Icon';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import ChangePasswordCard from '../../shared/components/ChangePasswordCard';
import SessionsCard from '../../shared/components/SessionsCard';

// The store owner's own login account - separate from the shop's public
// profile (Settings > Profile).
const OwnerAccount = () => {
  const [account, setAccount] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    authApi.getAccount().then((fetched) => {
      setAccount(fetched);
      setName(fetched.name || '');
      setPhone(fetched.phone || '');
    });
  }, []);

  if (!account) {
    return <LoadingSpinner className="py-8" />;
  }

  const hasChanges = name.trim() !== (account.name || '') || phone.trim() !== (account.phone || '');

  const handleSave = async (event) => {
    event.preventDefault();
    if (!name.trim()) {
      showErrorToast('Name cannot be empty.');
      return;
    }
    setIsSaving(true);
    try {
      const updated = await authApi.updateAccount({ name: name.trim(), phone: phone.trim() });
      setAccount(updated);
      showSuccessToast('Account updated.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex items-center gap-3">
          <Avatar name={name || account.name} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-card-title text-text-primary">{name || account.name}</p>
            <p className="truncate text-body-sm text-text-secondary">Store owner · {account.email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-5 flex flex-col gap-4">
          <Input
            label="Your name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full"
            required
          />
          <div className="flex flex-col gap-1.5">
            <Input label="Email" type="email" value={account.email} disabled readOnly className="w-full" />
            <span className="flex items-center gap-1 text-body-sm text-text-muted">
              <Icon name="lock" style={{ fontSize: '0.95rem' }} />
              Your email is your sign-in, so it can&apos;t be changed here.
            </span>
          </div>
          <Input
            label="Phone (optional)"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="w-full"
          />
          <Button type="submit" isLoading={isSaving} disabled={!hasChanges} className="self-start">
            Save changes
          </Button>
        </form>
      </Card>

      <ChangePasswordCard />

      <SessionsCard signInPath="/sign-in?as=store" />
    </div>
  );
};

export default OwnerAccount;
