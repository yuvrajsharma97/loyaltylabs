import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as storesApi from '../../api/stores';
import * as rewardsApi from '../../api/rewards';
import { useAuth } from '../../shared/hooks/useAuth';
import Button from '../../shared/components/Button';
import Input from '../../shared/components/Input';
import SegmentedControl from '../../shared/components/SegmentedControl';
import Icon from '../../shared/components/Icon';
import { CATEGORIES } from '../../shared/utils/labels';
import {
  LIMITS,
  NUMBER_RULES,
  hasErrors,
  sanitizeDecimal,
  sanitizeInteger,
  sanitizePin,
  validateNumber,
  validatePin,
  validateText,
  validateTitle,
} from '../../shared/utils/validation';

const STEPS = ['Profile', 'Earning', 'Till code', 'Reward', 'Live'];

const MODE_OPTIONS = [
  { value: 'per_currency', label: 'Per £ spent' },
  { value: 'per_visit', label: 'Per visit' },
];

const StepIndicator = ({ currentStep }) => (
  <div className="mb-8 flex items-center justify-center gap-2">
    {STEPS.map((step, index) => (
      <span
        key={step}
        className={`h-1.5 w-7 rounded-pill ${index <= currentStep ? 'bg-primary' : 'bg-border'}`}
      />
    ))}
  </div>
);

const StoreOnboarding = () => {
  const navigate = useNavigate();
  const { user: store, refreshProfile } = useAuth();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Step 1 - profile
  const [name, setName] = useState(store?.name || '');
  const [address, setAddress] = useState(store?.address || '');
  const [category, setCategory] = useState(store?.category || 'other');

  // Step 2 - earning (kept as strings while typing; validated on Continue)
  const [mode, setMode] = useState('per_currency');
  const [pointsPerUnit, setPointsPerUnit] = useState('1');
  const [minPurchase, setMinPurchase] = useState('');

  // Step 3 - till code
  const [tillPin, setTillPin] = useState('');
  const [tillLabel, setTillLabel] = useState('Front till');

  // Step 4 - reward
  const [rewardTitle, setRewardTitle] = useState('');
  const [rewardPoints, setRewardPoints] = useState('100');

  const clearError = (field) => setErrors((current) => ({ ...current, [field]: undefined }));

  // Validates one step's fields; returns true when they're all valid.
  const checkStep = (stepErrors) => {
    setErrors(stepErrors);
    return !hasErrors(stepErrors);
  };

  const handleSaveProfile = async () => {
    const isValid = checkStep({
      name: validateTitle(name, { label: 'Shop name' }),
      address: validateText(address, { label: 'Address', max: LIMITS.address }),
    });
    if (!isValid) return;

    setIsSaving(true);
    try {
      await storesApi.updateStore(store._id, { name: name.trim(), address: address.trim(), category });
      setCurrentStep(1);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEarning = async () => {
    const isValid = checkStep({
      pointsPerUnit: validateNumber(
        pointsPerUnit,
        mode === 'per_currency' ? NUMBER_RULES.pointsPerPound : NUMBER_RULES.pointsPerVisit
      ),
      minPurchase: mode === 'per_currency' ? validateNumber(minPurchase, NUMBER_RULES.minPurchase) : null,
    });
    if (!isValid) return;

    setIsSaving(true);
    try {
      await storesApi.updateLoyaltyConfig(store._id, {
        mode,
        pointsPerUnit: mode === 'per_currency' ? Number(pointsPerUnit) : undefined,
        fixedPointsPerVisit: mode === 'per_visit' ? Number(pointsPerUnit) : undefined,
        minPurchase: mode === 'per_currency' ? Number(minPurchase) || 0 : 0,
      });
      await refreshProfile();
      setCurrentStep(2);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTillPin = async () => {
    const isValid = checkStep({
      tillLabel: validateTitle(tillLabel, { label: 'Till label', max: LIMITS.tillLabel }),
      tillPin: validatePin(tillPin),
    });
    if (!isValid) return;

    setIsSaving(true);
    try {
      await storesApi.updateTillPins(store._id, [{ pin: tillPin, label: tillLabel.trim(), active: true }]);
      setCurrentStep(3);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveReward = async () => {
    const isValid = checkStep({
      rewardTitle: validateTitle(rewardTitle, { label: 'Reward title', max: LIMITS.rewardTitle }),
      rewardPoints: validateNumber(rewardPoints, NUMBER_RULES.rewardPoints),
    });
    if (!isValid) return;

    setIsSaving(true);
    try {
      await rewardsApi.createReward(store._id, {
        title: rewardTitle.trim(),
        pointsRequired: Number(rewardPoints),
        rewardType: 'free_item',
      });
      await refreshProfile();
      setCurrentStep(4);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoToTill = () => navigate('/store/till');
  const handleSkipToDashboard = () => navigate('/store/overview');

  return (
    <div className="flex min-h-screen flex-col items-center bg-canvas px-4 py-10">
      <div className="w-full max-w-md">
        <StepIndicator currentStep={currentStep} />

        {currentStep === 0 && (
          <div className="flex flex-col gap-4">
            <h1 className="text-page-title text-text-primary">Tell us about your shop</h1>
            <Input
              label="Shop name"
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
            <div className="flex flex-col gap-1.5">
              <span className="text-label text-text-secondary">What kind of shop is it?</span>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setCategory(option.value)}
                    className={`flex items-center gap-2 rounded-button border px-3 py-2.5 text-label transition-colors duration-150 ${
                      category === option.value
                        ? 'border-primary bg-primary-tint text-primary'
                        : 'border-border bg-surface text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <Icon name={option.icon} style={{ fontSize: '1.1rem' }} />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <Button isLoading={isSaving} onClick={handleSaveProfile}>
              Continue
            </Button>
          </div>
        )}

        {currentStep === 1 && (
          <div className="flex flex-col gap-4">
            <h1 className="text-page-title text-text-primary">How do customers earn?</h1>
            <SegmentedControl
              options={MODE_OPTIONS}
              value={mode}
              onChange={(nextMode) => {
                setMode(nextMode);
                // Per-visit points are whole numbers; drop any decimals when switching.
                if (nextMode === 'per_visit') setPointsPerUnit((current) => sanitizeInteger(current.split('.')[0]));
                setErrors({});
              }}
            />
            <Input
              label={mode === 'per_currency' ? 'Points per £1 spent' : 'Points per visit'}
              inputMode={mode === 'per_currency' ? 'decimal' : 'numeric'}
              value={pointsPerUnit}
              onChange={(event) => {
                setPointsPerUnit(
                  mode === 'per_currency' ? sanitizeDecimal(event.target.value) : sanitizeInteger(event.target.value, 5)
                );
                clearError('pointsPerUnit');
              }}
              error={errors.pointsPerUnit}
            />
            {mode === 'per_currency' && (
              <Input
                label="Minimum purchase (£, optional)"
                inputMode="decimal"
                placeholder="0.00"
                value={minPurchase}
                onChange={(event) => {
                  setMinPurchase(sanitizeDecimal(event.target.value, { maxIntegerDigits: 5 }));
                  clearError('minPurchase');
                }}
                error={errors.minPurchase}
              />
            )}
            <Button isLoading={isSaving} onClick={handleSaveEarning}>
              Continue
            </Button>
          </div>
        )}

        {currentStep === 2 && (
          <div className="flex flex-col gap-4">
            <h1 className="text-page-title text-text-primary">Set a till code</h1>
            <p className="text-body-sm text-text-secondary">
              Staff enter this 4-digit code to award or redeem points at the till. You can add more later
              in Settings.
            </p>
            <Input
              label="Till label"
              maxLength={LIMITS.tillLabel}
              value={tillLabel}
              onChange={(event) => {
                setTillLabel(event.target.value);
                clearError('tillLabel');
              }}
              error={errors.tillLabel}
            />
            <Input
              label="4-digit PIN"
              value={tillPin}
              onChange={(event) => {
                setTillPin(sanitizePin(event.target.value));
                clearError('tillPin');
              }}
              inputMode="numeric"
              autoComplete="off"
              className="w-full font-mono tracking-[0.3em]"
              error={errors.tillPin}
            />
            <Button isLoading={isSaving} onClick={handleSaveTillPin}>
              Continue
            </Button>
          </div>
        )}

        {currentStep === 3 && (
          <div className="flex flex-col gap-4">
            <h1 className="text-page-title text-text-primary">Add your first reward</h1>
            <Input
              label="Reward title"
              placeholder="Free coffee"
              maxLength={LIMITS.rewardTitle}
              value={rewardTitle}
              onChange={(event) => {
                setRewardTitle(event.target.value);
                clearError('rewardTitle');
              }}
              error={errors.rewardTitle}
            />
            <Input
              label="Points required"
              inputMode="numeric"
              value={rewardPoints}
              onChange={(event) => {
                setRewardPoints(sanitizeInteger(event.target.value));
                clearError('rewardPoints');
              }}
              error={errors.rewardPoints}
            />
            <Button isLoading={isSaving} onClick={handleSaveReward}>
              Continue
            </Button>
          </div>
        )}

        {currentStep === 4 && (
          <div className="flex flex-col items-center gap-4 text-center">
            <Icon name="storefront" isFilled className="text-success" style={{ fontSize: '2.5rem' }} />
            <h1 className="text-page-title text-text-primary">Almost live</h1>
            <p className="text-body-sm text-text-secondary">
              Your shop goes live once you run a test transaction in Till Mode.
            </p>
            <Button onClick={handleGoToTill}>Try Till Mode</Button>
            <button type="button" onClick={handleSkipToDashboard} className="text-body-sm text-text-secondary">
              I&apos;ll test it later
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreOnboarding;
