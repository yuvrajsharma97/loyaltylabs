import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { updateMe } from '../../api/customer';
import { listStores, joinStore } from '../../api/stores';

const CATEGORIES = [
  { value: 'cafe', label: 'Cafes', icon: 'local_cafe' },
  { value: 'retail', label: 'Retail', icon: 'storefront' },
  { value: 'services', label: 'Services', icon: 'content_cut' },
  { value: 'other', label: 'Other', icon: 'apps' }
];

function StepShell({ step, total, title, subtitle, children }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface font-body">
      <header className="w-full px-container-margin py-lg">
        <div className="w-full max-w-[560px] mx-auto flex gap-xs">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < step ? 'bg-primary' : 'bg-surface-container-high'
              }`}
            />
          ))}
        </div>
      </header>
      <main className="flex-grow flex flex-col items-center px-container-margin py-xl">
        <div className="w-full max-w-[560px] flex flex-col gap-xl">
          <div className="text-center">
            <h1 className="font-display text-display-md-mobile md:text-display-md mb-xs">{title}</h1>
            {subtitle && <p className="text-on-surface-variant text-body-md">{subtitle}</p>}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

export default function CustomerOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState('');
  const [interests, setInterests] = useState([]);
  const [stores, setStores] = useState([]);
  const [joinedIds, setJoinedIds] = useState(new Set());
  const [loadingStores, setLoadingStores] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleInterest = (value) => {
    setInterests((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };

  const goToStores = async () => {
    setSaving(true);
    try {
      await updateMe({ phone: phone || undefined, interests });
      setLoadingStores(true);
      const results = await listStores({ category: interests });
      setStores(results.length > 0 ? results : await listStores());
      setStep(2);
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
      setLoadingStores(false);
    }
  };

  const handleJoin = async (storeId) => {
    try {
      await joinStore(storeId);
      setJoinedIds((prev) => new Set(prev).add(storeId));
      toast.success('Joined!');
    } catch (err) {
      if (err.code === 'ALREADY_A_MEMBER') {
        setJoinedIds((prev) => new Set(prev).add(storeId));
      } else {
        toast.error(err.message || 'Something went wrong');
      }
    }
  };

  const finish = async () => {
    setSaving(true);
    try {
      await updateMe({ onboardingCompleted: true });
      navigate('/customer', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  if (step === 0) {
    return (
      <StepShell step={0} total={3} title="A couple details first" subtitle="Optional, but helps us reach you">
        <div className="bg-surface-container-lowest p-xl rounded-xl shadow-sm flex flex-col gap-lg">
          <div className="space-y-xs">
            <label htmlFor="phone" className="font-body text-body-sm text-on-surface-variant ml-xs">
              Phone number
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 012-3456"
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-md font-body text-body-md placeholder:text-outline outline-none focus:border-primary transition-all"
            />
          </div>
          <div className="flex gap-md">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 py-md rounded-lg font-body text-body-md font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 bg-primary text-on-primary py-md rounded-lg font-bold hover:shadow-md active:scale-[0.98] transition-all"
            >
              Continue
            </button>
          </div>
        </div>
      </StepShell>
    );
  }

  if (step === 1) {
    return (
      <StepShell step={1} total={3} title="What are you into?" subtitle="Pick as many as you like">
        <div className="grid grid-cols-2 gap-md">
          {CATEGORIES.map(({ value, label, icon }) => {
            const selected = interests.includes(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleInterest(value)}
                className={`flex flex-col items-center gap-sm p-xl rounded-xl border-2 transition-all ${
                  selected
                    ? 'border-primary bg-primary-container/20'
                    : 'border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low'
                }`}
              >
                <span className={`material-symbols-outlined text-3xl ${selected ? 'text-primary' : 'text-on-surface-variant'}`}>
                  {icon}
                </span>
                <span className="font-body text-body-md font-semibold">{label}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={goToStores}
          className="w-full bg-primary text-on-primary py-md rounded-lg font-bold hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Continue'}
        </button>
      </StepShell>
    );
  }

  return (
    <StepShell step={2} total={3} title="Join a few shops" subtitle="You can always browse more later">
      {loadingStores ? (
        <p className="text-center text-on-surface-variant">Loading shops...</p>
      ) : (
        <div className="flex flex-col gap-md">
          {stores.length === 0 && (
            <p className="text-center text-on-surface-variant">No shops available to join yet.</p>
          )}
          {stores.map((store) => {
            const joined = joinedIds.has(store._id);
            return (
              <div
                key={store._id}
                className="bg-surface-container-lowest rounded-xl p-lg flex items-center justify-between gap-md shadow-sm"
              >
                <div>
                  <p className="font-body text-body-md font-bold">{store.name}</p>
                  {store.address && <p className="text-body-sm text-on-surface-variant">{store.address}</p>}
                </div>
                <button
                  type="button"
                  disabled={joined}
                  onClick={() => handleJoin(store._id)}
                  className={`px-lg py-sm rounded-lg font-bold text-body-sm whitespace-nowrap transition-all ${
                    joined
                      ? 'bg-surface-container-high text-on-surface-variant'
                      : 'bg-primary text-on-primary hover:shadow-md active:scale-[0.98]'
                  }`}
                >
                  {joined ? 'Joined' : 'Join'}
                </button>
              </div>
            );
          })}
        </div>
      )}
      <button
        type="button"
        disabled={saving}
        onClick={finish}
        className="w-full bg-primary text-on-primary py-md rounded-lg font-bold hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-60"
      >
        {saving ? 'Finishing...' : 'Go to my dashboard'}
      </button>
    </StepShell>
  );
}
