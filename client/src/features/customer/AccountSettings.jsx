import { useState } from 'react';
import toast from 'react-hot-toast';
import { updateMe } from '../../api/customer';
import { useAuth } from '../../shared/hooks/useAuth';
import { useCustomer } from './CustomerDashboard';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';

const CATEGORIES = [
  { value: 'cafe', label: 'Cafe' },
  { value: 'retail', label: 'Retail' },
  { value: 'services', label: 'Services' },
  { value: 'other', label: 'Other' }
];

export default function AccountSettings() {
  const { logout } = useAuth();
  const { me, refetch } = useCustomer();
  const [phone, setPhone] = useState(me.phone || '');
  const [interests, setInterests] = useState(me.interests || []);
  const [saving, setSaving] = useState(false);

  const toggleInterest = (value) => {
    setInterests((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMe({ phone: phone || undefined, interests });
      await refetch();
      toast.success('Saved');
    } catch (err) {
      toast.error(err.message || 'Could not save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-xl max-w-[560px] mx-auto">
      <h1 className="font-display text-display-md-mobile md:text-display-md">Account</h1>

      <Card className="flex flex-col gap-lg">
        <div className="space-y-xs">
          <label className="font-body text-body-sm text-on-surface-variant ml-xs">Name</label>
          <p className="px-md py-md font-body text-body-md">{me.name}</p>
        </div>
        <div className="space-y-xs">
          <label className="font-body text-body-sm text-on-surface-variant ml-xs">Email</label>
          <p className="px-md py-md font-body text-body-md">{me.email}</p>
        </div>
        <div className="space-y-xs">
          <label className="font-body text-body-sm text-on-surface-variant ml-xs">Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555 012 3456"
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-md font-body text-body-md placeholder:text-outline outline-none focus:border-primary transition-all"
          />
        </div>
        <div className="space-y-xs">
          <label className="font-body text-body-sm text-on-surface-variant ml-xs">Interests</label>
          <div className="grid grid-cols-2 gap-sm">
            {CATEGORIES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => toggleInterest(value)}
                className={`py-md rounded-lg font-body text-body-sm font-semibold border-2 transition-all ${
                  interests.includes(value)
                    ? 'border-primary bg-primary-container/20 text-primary'
                    : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <Button loading={saving} onClick={handleSave}>
          Save changes
        </Button>
      </Card>

      <Button variant="text" onClick={logout} className="w-fit mx-auto px-xl border border-outline-variant">
        Log out
      </Button>
    </div>
  );
}
