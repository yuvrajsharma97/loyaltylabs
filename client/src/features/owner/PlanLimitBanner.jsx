import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as billingApi from '../../api/billing';
import { useAuth } from '../../shared/hooks/useAuth';

// Share of the customer limit at which owners get an early warning.
const WARN_AT = 0.9;

// Shown across the owner app when the shop is at (or close to) its plan's
// active-customer limit. At the limit the till refuses new customers (hard
// stop, no grace period), so the banner asks the owner to upgrade.
const PlanLimitBanner = () => {
  const { user: store } = useAuth();
  const { pathname, search } = useLocation();
  const [usage, setUsage] = useState(null);

  // Refetched on navigation so it clears soon after an upgrade or once
  // customers drop out of the active window.
  useEffect(() => {
    if (!store?._id) return;
    billingApi
      .getUsage(store._id)
      .then(setUsage)
      .catch(() => setUsage(null)); // no billing record yet: nothing to warn about
  }, [store?._id, pathname, search]);

  if (!usage || usage.customerLimit === null) return null;

  const isAtLimit = usage.limitReached;
  const isNearLimit = !isAtLimit && usage.activeCustomerCount >= Math.ceil(usage.customerLimit * WARN_AT);
  if (!isAtLimit && !isNearLimit) return null;

  return (
    <div
      role={isAtLimit ? 'alert' : 'status'}
      className={`mx-auto mt-4 flex max-w-4xl flex-wrap items-center justify-between gap-3 rounded-card border p-4 ${
        isAtLimit ? 'border-error bg-error-bg' : 'border-warning bg-warning-bg'
      }`}
    >
      <p className={`min-w-0 flex-1 basis-[260px] text-body-sm ${isAtLimit ? 'text-error-text' : 'text-warning-text'}`}>
        {isAtLimit
          ? `You've reached ${usage.customerLimit} active customers, the limit on your ${usage.planName} plan. New customers can't collect points until you upgrade.`
          : `You have ${usage.activeCustomerCount} of ${usage.customerLimit} active customers on your ${usage.planName} plan. New customers will be refused at the till once you reach ${usage.customerLimit}.`}
      </p>
      <Link
        to="/store/settings?section=billing"
        className="inline-flex h-11 shrink-0 items-center rounded-button bg-primary px-4 text-label font-semibold text-on-primary hover:bg-primary-hover"
      >
        Upgrade plan
      </Link>
    </div>
  );
};

export default PlanLimitBanner;
