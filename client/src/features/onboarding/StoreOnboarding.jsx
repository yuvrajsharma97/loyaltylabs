import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getMyStore, updateStore, updateLoyaltyConfig, updateTillPins, createReward } from '../../api/storeOwner';

const CATEGORIES = [
  { value: 'cafe', label: 'Cafe' },
  { value: 'retail', label: 'Retail' },
  { value: 'services', label: 'Services' },
  { value: 'other', label: 'Other' }
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

const STEPS = ['profile', 'loyalty', 'till-pin', 'reward'];

export default function StoreOnboarding() {
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  const [storeName, setStoreName] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('other');
  const [mode, setMode] = useState('per_currency');
  const [pointsPerUnit, setPointsPerUnit] = useState(1);
  const [fixedPointsPerVisit, setFixedPointsPerVisit] = useState(10);
  const [minPurchase, setMinPurchase] = useState(0);
  const [pin, setPin] = useState('');
  const [pinLabel, setPinLabel] = useState('');
  const [rewardTitle, setRewardTitle] = useState('');
  const [rewardPoints, setRewardPoints] = useState(100);

  useEffect(() => {
    getMyStore()
      .then((s) => {
        setStore(s);
        setStoreName(s.name || '');
        setAddress(s.address || '');
        setCategory(s.category || 'other');
        // Resume at the first incomplete required step.
        if (s.onboardingCompleted?.loyaltyRuleSet) {
          setStepIndex(2);
        }
      })
      .catch((err) => toast.error(err.message || 'Could not load your store'))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-on-surface-variant">
        Loading...
      </div>
    );
  }

  const saveProfile = async () => {
    if (!storeName.trim()) {
      toast.error('Store name is required');
      return;
    }
    setSaving(true);
    try {
      await updateStore(store._id, { name: storeName, address: address || undefined, category });
      setStepIndex(1);
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const saveLoyalty = async () => {
    setSaving(true);
    try {
      await updateLoyaltyConfig(store._id, {
        mode,
        pointsPerUnit: mode === 'per_currency' ? Number(pointsPerUnit) : undefined,
        fixedPointsPerVisit: mode === 'per_visit' ? Number(fixedPointsPerVisit) : undefined,
        minPurchase: Number(minPurchase)
      });
      setStepIndex(2);
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const saveTillPin = async () => {
    if (!/^\d{4}$/.test(pin)) {
      toast.error('PIN must be exactly 4 digits');
      return;
    }
    setSaving(true);
    try {
      await updateTillPins(store._id, [{ pin, label: pinLabel || 'Staff', active: true }]);
      setStepIndex(3);
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const saveReward = async () => {
    setSaving(true);
    try {
      await createReward(store._id, {
        title: rewardTitle,
        pointsRequired: Number(rewardPoints),
        rewardType: 'free_item'
      });
      navigate('/store', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const skipToDashboard = () => navigate('/store', { replace: true });

  if (STEPS[stepIndex] === 'profile') {
    return (
      <StepShell step={0} total={4} title="Tell us about your shop" subtitle="Let's get your storefront set up">
        <div className="bg-surface-container-lowest p-xl rounded-xl shadow-sm flex flex-col gap-lg">
          <div className="space-y-xs">
            <label className="font-body text-body-sm text-on-surface-variant ml-xs">Store name</label>
            <input
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Main Street Coffee"
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-md font-body text-body-md placeholder:text-outline outline-none focus:border-primary transition-all"
            />
          </div>
          <div className="space-y-xs">
            <label className="font-body text-body-sm text-on-surface-variant ml-xs">Address</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="124 Main Street, Springfield"
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-md font-body text-body-md placeholder:text-outline outline-none focus:border-primary transition-all"
            />
          </div>
          <div className="space-y-xs">
            <label className="font-body text-body-sm text-on-surface-variant ml-xs">Category</label>
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
          <button
            type="button"
            disabled={saving}
            onClick={saveProfile}
            className="w-full bg-primary text-on-primary py-md rounded-lg font-bold hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </StepShell>
    );
  }

  if (STEPS[stepIndex] === 'loyalty') {
    return (
      <StepShell step={1} total={4} title="Set up your loyalty program" subtitle="How do customers earn points?">
        <div className="bg-surface-container-lowest p-xl rounded-xl shadow-sm flex flex-col gap-lg">
          <div className="flex rounded-lg bg-surface-container-low p-1 gap-1">
            {[
              ['per_currency', 'Per amount spent'],
              ['per_visit', 'Fixed per visit']
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={`flex-1 py-sm rounded-md font-body text-body-sm font-semibold transition-colors ${
                  mode === value ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === 'per_currency' ? (
            <div className="space-y-xs">
              <label className="font-body text-body-sm text-on-surface-variant ml-xs">Points per $1 spent</label>
              <input
                type="number"
                min="0"
                value={pointsPerUnit}
                onChange={(e) => setPointsPerUnit(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-md font-body text-body-md outline-none focus:border-primary transition-all"
              />
            </div>
          ) : (
            <div className="space-y-xs">
              <label className="font-body text-body-sm text-on-surface-variant ml-xs">Points per visit</label>
              <input
                type="number"
                min="0"
                value={fixedPointsPerVisit}
                onChange={(e) => setFixedPointsPerVisit(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-md font-body text-body-md outline-none focus:border-primary transition-all"
              />
            </div>
          )}

          <div className="space-y-xs">
            <label className="font-body text-body-sm text-on-surface-variant ml-xs">Minimum purchase ($)</label>
            <input
              type="number"
              min="0"
              value={minPurchase}
              onChange={(e) => setMinPurchase(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-md font-body text-body-md outline-none focus:border-primary transition-all"
            />
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={saveLoyalty}
            className="w-full bg-primary text-on-primary py-md rounded-lg font-bold hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </StepShell>
    );
  }

  if (STEPS[stepIndex] === 'till-pin') {
    return (
      <StepShell step={2} total={4} title="Add an employee code" subtitle="Required before your till can scan customers">
        <div className="bg-surface-container-lowest p-xl rounded-xl shadow-sm flex flex-col gap-lg">
          <div className="space-y-xs">
            <label className="font-body text-body-sm text-on-surface-variant ml-xs">4-digit PIN</label>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="1234"
              inputMode="numeric"
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-md font-mono text-body-lg tracking-[0.3em] outline-none focus:border-primary transition-all"
            />
          </div>
          <div className="space-y-xs">
            <label className="font-body text-body-sm text-on-surface-variant ml-xs">Label</label>
            <input
              value={pinLabel}
              onChange={(e) => setPinLabel(e.target.value)}
              placeholder="e.g. Owner, Morning shift"
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-md font-body text-body-md placeholder:text-outline outline-none focus:border-primary transition-all"
            />
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={saveTillPin}
            className="w-full bg-primary text-on-primary py-md rounded-lg font-bold hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </StepShell>
    );
  }

  return (
    <StepShell step={3} total={4} title="Add your first reward" subtitle="Optional - you can add more later">
      <div className="bg-surface-container-lowest p-xl rounded-xl shadow-sm flex flex-col gap-lg">
        <div className="space-y-xs">
          <label className="font-body text-body-sm text-on-surface-variant ml-xs">Reward name</label>
          <input
            value={rewardTitle}
            onChange={(e) => setRewardTitle(e.target.value)}
            placeholder="Free coffee of any size"
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-md font-body text-body-md placeholder:text-outline outline-none focus:border-primary transition-all"
          />
        </div>
        <div className="space-y-xs">
          <label className="font-body text-body-sm text-on-surface-variant ml-xs">Points required</label>
          <input
            type="number"
            min="1"
            value={rewardPoints}
            onChange={(e) => setRewardPoints(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-md font-body text-body-md outline-none focus:border-primary transition-all"
          />
        </div>
        <div className="flex gap-md">
          <button
            type="button"
            onClick={skipToDashboard}
            className="flex-1 py-md rounded-lg font-body text-body-md font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors"
          >
            Skip for now
          </button>
          <button
            type="button"
            disabled={saving || !rewardTitle}
            onClick={saveReward}
            className="flex-1 bg-primary text-on-primary py-md rounded-lg font-bold hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Finish'}
          </button>
        </div>
      </div>
    </StepShell>
  );
}
