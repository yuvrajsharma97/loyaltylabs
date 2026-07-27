import { Link } from 'react-router-dom';
import Card from '../../shared/components/Card';

const STEPS = [
  { key: 'loyaltyRuleSet', label: 'Set up your loyalty program', to: '/store/settings' },
  { key: 'firstRewardAdded', label: 'Add your first reward', to: '/store/rewards' },
  { key: 'tillModeTested', label: 'Run a test scan in Till Mode', to: '/store/till' }
];

// Auto-hides once every onboardingCompleted flag on the store is true.
export default function OnboardingChecklist({ onboarding }) {
  const remaining = STEPS.filter((step) => !onboarding[step.key]);
  if (remaining.length === 0) return null;

  return (
    <Card className="flex flex-col gap-md border-2 border-primary-container">
      <p className="font-display text-body-lg font-bold">Finish setting up your store</p>
      <div className="flex flex-col gap-sm">
        {remaining.map((step) => (
          <Link
            key={step.key}
            to={step.to}
            className="flex items-center justify-between px-md py-sm rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors"
          >
            <span className="font-body text-body-md">{step.label}</span>
            <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
          </Link>
        ))}
      </div>
    </Card>
  );
}
