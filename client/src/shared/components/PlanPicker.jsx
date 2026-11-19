import { PLANS, formatPlanLimit, formatPlanPrice } from '../utils/plans';

// Radio-card list of billing plans. Used at store sign-up and in
// Settings > Billing. `disabledPlanIds` greys out plans that can't be chosen
// (only plans with a customer limit, and every current plan is unlimited).
const PlanPicker = ({ value, onChange, name = 'plan', disabledPlanIds = [], currentPlanId = null }) => {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-label text-text-secondary">Plan</legend>
      {PLANS.map((plan) => {
        const isSelected = plan.id === value;
        const isDisabled = disabledPlanIds.includes(plan.id);
        return (
          <label
            key={plan.id}
            className={`flex items-center gap-3 rounded-card border p-3 transition-colors duration-150 ${
              isSelected ? 'border-primary bg-primary-tint' : 'border-border bg-surface'
            } ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-primary'}`}
          >
            <input
              type="radio"
              name={name}
              value={plan.id}
              checked={isSelected}
              disabled={isDisabled}
              onChange={() => onChange(plan.id)}
              className="h-4 w-4 accent-[var(--color-primary)]"
            />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-card-title text-text-primary">
                {plan.name}
                {plan.id === currentPlanId && <span className="ml-2 text-body-sm text-text-muted">(current)</span>}
              </span>
              <span className="text-body-sm text-text-secondary">{formatPlanLimit(plan)}</span>
            </span>
            <span className="shrink-0 tabular-nums text-body-sm text-text-primary">{formatPlanPrice(plan)}</span>
          </label>
        );
      })}
      <p className="text-body-sm text-text-muted">Prices exclude VAT.</p>
    </fieldset>
  );
};

export default PlanPicker;
