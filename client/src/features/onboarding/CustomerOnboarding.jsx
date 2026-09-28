import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as customerApi from '../../api/customer';
import * as storesApi from '../../api/stores';
import { useAuth } from '../../shared/hooks/useAuth';
import Button from '../../shared/components/Button';
import Input from '../../shared/components/Input';
import Card from '../../shared/components/Card';
import Icon from '../../shared/components/Icon';

const STEPS = ['Interests', 'Shops', 'Contact', 'Done'];

const INTEREST_OPTIONS = [
  { value: 'cafe', label: 'Cafes' },
  { value: 'retail', label: 'Retail' },
  { value: 'services', label: 'Services' },
  { value: 'other', label: 'Other' },
];

const StepIndicator = ({ currentStep }) => (
  <div className="mb-8 flex items-center justify-center gap-2">
    {STEPS.map((step, index) => (
      <span
        key={step}
        className={`h-1.5 w-8 rounded-pill ${index <= currentStep ? 'bg-primary' : 'bg-border'}`}
      />
    ))}
  </div>
);

const CustomerOnboarding = () => {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  const [currentStep, setCurrentStep] = useState(0);
  const [interests, setInterests] = useState([]);
  const [phone, setPhone] = useState('');
  const [stores, setStores] = useState([]);
  const [joinedStoreIds, setJoinedStoreIds] = useState([]);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleInterest = (value) => {
    setInterests((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  };

  const goToShopsStep = async () => {
    setCurrentStep(1);
    setIsLoadingStores(true);
    try {
      // A short list of suggestions is enough here - the directory pages through the rest.
      const { stores: fetchedStores } = await storesApi.listStores({
        category: interests.join(',') || undefined,
        limit: 10,
      });
      setStores(fetchedStores);
    } finally {
      setIsLoadingStores(false);
    }
  };

  const handleJoinStore = async (storeId) => {
    await storesApi.joinStore(storeId);
    setJoinedStoreIds((current) => [...current, storeId]);
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      await customerApi.updateMe({ interests, phone: phone || undefined, onboardingCompleted: true });
      await refreshProfile();
      navigate('/customer/home');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-canvas px-4 py-10">
      <div className="w-full max-w-md">
        <StepIndicator currentStep={currentStep} />

        {currentStep === 0 && (
          <div className="flex flex-col gap-5">
            <h1 className="text-page-title text-text-primary">What are you into?</h1>
            <p className="text-body-sm text-text-secondary">
              We&apos;ll use this to suggest shops worth joining.
            </p>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((option) => {
                const isSelected = interests.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleInterest(option.value)}
                    className={`rounded-pill border px-4 py-2 text-label transition-colors duration-150 ${
                      isSelected
                        ? 'border-primary bg-primary-tint text-primary'
                        : 'border-border text-text-secondary hover:border-primary'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <Button onClick={goToShopsStep}>Continue</Button>
          </div>
        )}

        {currentStep === 1 && (
          <div className="flex flex-col gap-4">
            <h1 className="text-page-title text-text-primary">Join a few shops</h1>
            <p className="text-body-sm text-text-secondary">You can always join more later.</p>

            {isLoadingStores ? (
              <p className="text-body-sm text-text-muted">Loading shops...</p>
            ) : (
              <div className="flex flex-col gap-2">
                {stores.map((store) => {
                  const isJoined = joinedStoreIds.includes(store._id);
                  return (
                    <Card key={store._id} className="flex items-center justify-between gap-3 p-3">
                      <div>
                        <p className="text-card-title text-text-primary">{store.name}</p>
                        <p className="text-body-sm text-text-secondary">{store.address}</p>
                      </div>
                      <Button
                        size="sm"
                        variant={isJoined ? 'secondary' : 'primary'}
                        disabled={isJoined}
                        onClick={() => handleJoinStore(store._id)}
                      >
                        {isJoined ? 'Joined' : 'Join'}
                      </Button>
                    </Card>
                  );
                })}
                {stores.length === 0 && <p className="text-body-sm text-text-muted">No shops to show yet.</p>}
              </div>
            )}

            <Button onClick={() => setCurrentStep(2)}>Continue</Button>
          </div>
        )}

        {currentStep === 2 && (
          <div className="flex flex-col gap-4">
            <h1 className="text-page-title text-text-primary">Stay in the loop</h1>
            <p className="text-body-sm text-text-secondary">Optional - add a phone number for updates.</p>
            <Input label="Phone (optional)" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
            <Button onClick={() => setCurrentStep(3)}>Continue</Button>
          </div>
        )}

        {currentStep === 3 && (
          <div className="flex flex-col items-center gap-4 text-center">
            <Icon name="check_circle" isFilled className="text-success" style={{ fontSize: '2.5rem' }} />
            <h1 className="text-page-title text-text-primary">You&apos;re all set</h1>
            <p className="text-body-sm text-text-secondary">Start earning points at the shops you joined.</p>
            <Button isLoading={isSubmitting} onClick={handleFinish}>
              Get started
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerOnboarding;
