import { useEffect, useState } from 'react';
import * as storesApi from '../../api/stores';
import { useAuth } from '../../shared/hooks/useAuth';
import { showSuccessToast } from '../../shared/utils/toast';
import {
  NUMBER_RULES,
  hasErrors,
  sanitizeDecimal,
  sanitizeInteger,
  validateNumber,
} from '../../shared/utils/validation';
import Button from '../../shared/components/Button';
import Input from '../../shared/components/Input';
import SegmentedControl from '../../shared/components/SegmentedControl';
import LoadingSpinner from '../../shared/components/LoadingSpinner';

const MODE_OPTIONS = [
  { value: 'per_currency', label: 'Per £ spent' },
  { value: 'per_visit', label: 'Per visit' },
];

// The API returns numbers (and null for "not set"); the form edits strings
// so a half-typed "1." isn't coerced away.
const toFormValue = (value) => (value === null || value === undefined ? '' : String(value));

function toForm(config) {
  return {
    mode: config.mode,
    pointsPerUnit: toFormValue(config.pointsPerUnit),
    fixedPointsPerVisit: toFormValue(config.fixedPointsPerVisit),
    minPurchase: config.minPurchase ? toFormValue(config.minPurchase) : '',
    pointsExpiryDays: toFormValue(config.pointsExpiryDays),
    maxPointsBalance: toFormValue(config.maxPointsBalance),
  };
}

const LoyaltyConfig = () => {
  const { user: store } = useAuth();
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    storesApi
      .getLoyaltyConfig(store._id)
      .then((config) => setForm(toForm(config)))
      .finally(() => setIsLoading(false));
  }, [store._id]);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const isPerCurrency = form.mode === 'per_currency';
    const nextErrors = {
      pointsPerUnit: isPerCurrency ? validateNumber(form.pointsPerUnit, NUMBER_RULES.pointsPerPound) : null,
      fixedPointsPerVisit: isPerCurrency ? null : validateNumber(form.fixedPointsPerVisit, NUMBER_RULES.pointsPerVisit),
      minPurchase: validateNumber(form.minPurchase, NUMBER_RULES.minPurchase),
      pointsExpiryDays: validateNumber(form.pointsExpiryDays, NUMBER_RULES.expiryDays),
      maxPointsBalance: validateNumber(form.maxPointsBalance, NUMBER_RULES.maxBalance),
    };
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    setIsSaving(true);
    try {
      const updated = await storesApi.updateLoyaltyConfig(store._id, {
        mode: form.mode,
        pointsPerUnit: isPerCurrency ? Number(form.pointsPerUnit) : undefined,
        fixedPointsPerVisit: isPerCurrency ? undefined : Number(form.fixedPointsPerVisit),
        minPurchase: Number(form.minPurchase) || 0,
        pointsExpiryDays: form.pointsExpiryDays ? Number(form.pointsExpiryDays) : null,
        maxPointsBalance: form.maxPointsBalance ? Number(form.maxPointsBalance) : null,
      });
      setForm(toForm(updated));
      showSuccessToast('Earning rules updated.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !form) {
    return <LoadingSpinner className="py-8" />;
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4" noValidate>
      <SegmentedControl
        options={MODE_OPTIONS}
        value={form.mode}
        onChange={(mode) => {
          setForm((current) => ({ ...current, mode }));
          setErrors({});
        }}
      />

      {form.mode === 'per_currency' ? (
        <Input
          label="Points per £1 spent"
          inputMode="decimal"
          value={form.pointsPerUnit}
          onChange={(event) => setField('pointsPerUnit', sanitizeDecimal(event.target.value, { maxIntegerDigits: 4 }))}
          error={errors.pointsPerUnit}
          hint="Decimals are fine, e.g. 1.5 points per £1."
        />
      ) : (
        <Input
          label="Points per visit"
          inputMode="numeric"
          value={form.fixedPointsPerVisit}
          onChange={(event) => setField('fixedPointsPerVisit', sanitizeInteger(event.target.value, 5))}
          error={errors.fixedPointsPerVisit}
        />
      )}

      <Input
        label="Minimum purchase (£, optional)"
        inputMode="decimal"
        placeholder="0.00"
        value={form.minPurchase}
        onChange={(event) => setField('minPurchase', sanitizeDecimal(event.target.value, { maxIntegerDigits: 5 }))}
        error={errors.minPurchase}
      />
      <Input
        label="Points expire after (days, optional)"
        inputMode="numeric"
        placeholder="Never"
        value={form.pointsExpiryDays}
        onChange={(event) => setField('pointsExpiryDays', sanitizeInteger(event.target.value, 4))}
        error={errors.pointsExpiryDays}
      />
      <Input
        label="Maximum points balance (optional)"
        inputMode="numeric"
        placeholder="No limit"
        value={form.maxPointsBalance}
        onChange={(event) => setField('maxPointsBalance', sanitizeInteger(event.target.value))}
        error={errors.maxPointsBalance}
      />

      <Button type="submit" isLoading={isSaving} className="self-start">
        Save changes
      </Button>
    </form>
  );
};

export default LoyaltyConfig;
