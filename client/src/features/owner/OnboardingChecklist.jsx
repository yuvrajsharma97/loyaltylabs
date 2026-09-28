import { Link } from 'react-router-dom';
import Card from '../../shared/components/Card';
import Icon from '../../shared/components/Icon';

const STEPS = [
  { key: 'loyaltyRuleSet', label: 'Set up how customers earn points', to: '/store/settings' },
  { key: 'firstRewardAdded', label: 'Add your first reward', to: '/store/rewards' },
  { key: 'tillModeTested', label: 'Run a test transaction in Till Mode', to: '/store/till' },
];

// Hides itself once every onboardingCompleted flag on the store is true.
const OnboardingChecklist = ({ onboarding = {} }) => {
  const doneCount = STEPS.filter((step) => onboarding[step.key]).length;
  if (doneCount === STEPS.length) return null;

  return (
    <Card className="flex flex-col gap-3 border-primary">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-card-title text-text-primary">Finish setting up your shop</h2>
        <span className="tabular-nums text-label text-text-muted">
          {doneCount}/{STEPS.length} done
        </span>
      </div>
      <div className="flex flex-col gap-1">
        {STEPS.map((step) => {
          const isDone = Boolean(onboarding[step.key]);
          return (
            <Link
              key={step.key}
              to={step.to}
              className="flex items-center gap-3 rounded-button px-2 py-2.5 transition-colors duration-150 hover:bg-primary-tint"
            >
              <Icon
                name={isDone ? 'check_circle' : 'radio_button_unchecked'}
                isFilled={isDone}
                className={isDone ? 'text-success' : 'text-text-muted'}
              />
              <span className={`flex-1 text-body ${isDone ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                {step.label}
              </span>
              {!isDone && <Icon name="chevron_right" className="text-text-muted" />}
            </Link>
          );
        })}
      </div>
    </Card>
  );
};

export default OnboardingChecklist;
