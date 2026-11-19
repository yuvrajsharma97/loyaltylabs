import { useCallback, useEffect, useState } from 'react';
import * as billingApi from '../../api/billing';
import { useAuth } from '../../shared/hooks/useAuth';
import { usePaginatedList } from '../../shared/hooks/usePaginatedList';
import KpiTile from '../../shared/components/KpiTile';
import ScrollPanel from '../../shared/components/ScrollPanel';
import Badge from '../../shared/components/Badge';
import Button from '../../shared/components/Button';
import Card from '../../shared/components/Card';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import Pagination from '../../shared/components/Pagination';
import PlanPicker from '../../shared/components/PlanPicker';
import { formatCurrency, formatDate } from '../../shared/utils/formatters';
import { showSuccessToast } from '../../shared/utils/toast';
import { DEFAULT_PLAN_ID, PLANS, TRIAL_WEEKS, findPlan, formatPlanPrice } from '../../shared/utils/plans';

const HISTORY_PAGE_SIZE = 10;

const SNAPSHOT_STATUS_TONES = { paid: 'success', invoiced: 'info', pending: 'warning' };

const STATUS_LABELS = {
  trialing: { label: 'Free trial', tone: 'info' },
  active: { label: 'Active', tone: 'success' },
  past_due: { label: 'Payment overdue', tone: 'warning' },
  suspended: { label: 'Suspended', tone: 'error' },
};

function formatPeriod(start) {
  return new Date(start).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

const BillingHistory = ({ storeId }) => {
  const fetchPage = useCallback(
    (page) =>
      billingApi
        .getHistory(storeId, { page, limit: HISTORY_PAGE_SIZE })
        .then(({ snapshots, pagination }) => ({ items: snapshots, pagination })),
    [storeId]
  );
  const { items: snapshots, pagination, setPage, isLoading } = usePaginatedList(fetchPage);

  return (
    <section className="mt-6">
      <h2 className="text-label text-text-muted">Past billing periods</h2>
      {/* Sits inside the Settings tabs rather than filling a page, so it's capped
          to half the screen and scrolls within that. */}
      <ScrollPanel
        resetKey={snapshots[0]?._id}
        className={`mt-2 max-h-[50dvh] rounded-card border border-border bg-surface px-4 py-1 shadow-card transition-opacity duration-150 ${
          isLoading && snapshots.length > 0 ? 'opacity-50' : ''
        }`}
      >
        {isLoading && snapshots.length === 0 && <LoadingSpinner className="py-6" />}
        {!isLoading && snapshots.length === 0 && (
          <p className="py-3 text-body-sm text-text-secondary">No closed billing periods yet.</p>
        )}
        {snapshots.map((snapshot) => (
          <div
            key={snapshot._id}
            className="flex items-center justify-between gap-3 border-b border-divider py-3 last:border-0"
          >
            <div className="min-w-0">
              <p className="text-card-title text-text-primary">{formatPeriod(snapshot.periodStart)}</p>
              <p className="tabular-nums text-body-sm text-text-muted">
                {findPlan(snapshot.plan)?.name || snapshot.plan} · {snapshot.activeCustomerCount} active
                {snapshot.proRated && ' · pro-rated'}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="tabular-nums text-body text-text-primary">{formatCurrency(snapshot.amountDue)}</span>
              <Badge tone={SNAPSHOT_STATUS_TONES[snapshot.status] || 'neutral'}>{snapshot.status}</Badge>
            </div>
          </div>
        ))}
      </ScrollPanel>
      <Pagination
        pagination={pagination}
        onPageChange={setPage}
        isDisabled={isLoading}
        itemLabel="periods"
        className="mt-3"
      />
    </section>
  );
};

// Plan choice for a store with no billing record yet (registered before
// plans existed). Choosing one starts the free trial.
const ChoosePlan = ({ storeId, onChosen }) => {
  const [plan, setPlan] = useState(DEFAULT_PLAN_ID);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleStart = async () => {
    setIsSaving(true);
    setError('');
    try {
      onChosen(await billingApi.changePlan(storeId, plan));
      showSuccessToast(`Your ${TRIAL_WEEKS}-week free trial has started.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="text-card-title text-text-primary">Choose a plan</h2>
        <p className="mt-1 text-body-sm text-text-secondary">
          Your first {TRIAL_WEEKS} weeks are free on whichever plan you pick.
        </p>
      </div>
      <PlanPicker value={plan} onChange={setPlan} />
      {error && <p className="text-body-sm text-error-text">{error}</p>}
      <Button onClick={handleStart} isLoading={isSaving}>
        Start {TRIAL_WEEKS} weeks free
      </Button>
    </Card>
  );
};

const ChangePlan = ({ storeId, usage, onChanged }) => {
  const [plan, setPlan] = useState(usage.plan);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const selected = findPlan(plan);
  const isTrialing = usage.status === 'trialing';
  // A plan whose limit is below today's active customers can't be chosen.
  const disabledPlanIds = PLANS.filter(
    (option) => option.customerLimit !== null && option.customerLimit < usage.activeCustomerCount
  ).map((option) => option.id);

  const handleSwitch = async () => {
    setIsSaving(true);
    setError('');
    try {
      const updated = await billingApi.changePlan(storeId, plan);
      onChanged(updated);
      showSuccessToast(`Switched to the ${updated.planName} plan.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card id="change-plan" className="mt-5 flex flex-col gap-4">
      <h2 className="text-card-title text-text-primary">Change plan</h2>
      <PlanPicker value={plan} onChange={setPlan} disabledPlanIds={disabledPlanIds} currentPlanId={usage.plan} />
      {plan !== usage.plan && (
        <div className="flex flex-col gap-3 rounded-card bg-surface-secondary p-3">
          <p className="text-body-sm text-text-secondary">
            {isTrialing
              ? `You'll stay on your free trial until ${formatDate(usage.trialEndsAt)}, then pay ${formatPlanPrice(selected)} + VAT.`
              : `The switch happens now. You'll pay ${formatPlanPrice(selected)} + VAT from your next billing date.`}
          </p>
          <Button onClick={handleSwitch} isLoading={isSaving}>
            Switch to {selected.name}
          </Button>
        </div>
      )}
      {error && <p className="text-body-sm text-error-text">{error}</p>}
    </Card>
  );
};

const BillingUsage = () => {
  const { user: store } = useAuth();
  const [usage, setUsage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSetUp, setIsSetUp] = useState(true);

  useEffect(() => {
    billingApi
      .getUsage(store._id)
      .then(setUsage)
      .catch((err) => {
        if (err.code === 'BILLING_NOT_SETUP') setIsSetUp(false);
        else throw err;
      })
      .finally(() => setIsLoading(false));
  }, [store._id]);

  const handleBillingChanged = (updated) => {
    setUsage(updated);
    setIsSetUp(true);
  };

  if (isLoading) {
    return <LoadingSpinner className="py-8" />;
  }

  if (!isSetUp) {
    return <ChoosePlan storeId={store._id} onChosen={handleBillingChanged} />;
  }

  const status = STATUS_LABELS[usage.status] || { label: usage.status, tone: 'neutral' };
  const isTrialing = usage.status === 'trialing';
  const customersValue =
    usage.customerLimit === null ? usage.activeCustomerCount : `${usage.activeCustomerCount} / ${usage.customerLimit}`;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge tone={status.tone}>{status.label}</Badge>
        {isTrialing && (
          <span className="text-body-sm text-text-secondary">Free until {formatDate(usage.trialEndsAt)}</span>
        )}
      </div>

      {usage.limitReached && (
        <Card className="mb-3 border-error bg-error-bg">
          <p className="text-body-sm text-error-text">
            You&apos;ve reached your {usage.customerLimit} active customer limit. New customers can&apos;t collect
            points until you move to a bigger plan below.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <KpiTile label="Plan" value={usage.planName} />
        <KpiTile label="Active customers" value={customersValue} />
        <KpiTile label="Price" value={`${formatCurrency(usage.price)} / ${usage.interval}`} />
        <KpiTile label={isTrialing ? 'First payment' : 'Next payment'} value={formatDate(usage.nextChargeAt)} />
      </div>
      <p className="mt-2 text-body-sm text-text-muted">
        Prices exclude VAT. An active customer is someone who collected or redeemed points here in the last{' '}
        {usage.activeWindowDays} days.
      </p>

      <ChangePlan key={usage.plan} storeId={store._id} usage={usage} onChanged={handleBillingChanged} />

      <BillingHistory storeId={store._id} />
    </div>
  );
};

export default BillingUsage;
