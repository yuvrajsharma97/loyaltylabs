import { useState } from 'react';
import * as scanApi from '../../../api/scan';
import { useAuth } from '../../../shared/hooks/useAuth';
import { showSuccessToast, showErrorToast } from '../../../shared/utils/toast';
import ScannerView from './ScannerView';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import Avatar from '../../../shared/components/Avatar';
import Icon from '../../../shared/components/Icon';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import { formatCurrency } from '../../../shared/utils/formatters';
import {
  LIMITS,
  NUMBER_RULES,
  sanitizeDecimal,
  validateCustomerCode,
  validateNumber,
  validatePin,
  validateRedemptionCode,
} from '../../../shared/utils/validation';

const PIN_ERROR_CODES = ['TILL_PIN_INVALID', 'TILL_PIN_REQUIRED'];
const PIN_ERROR_MESSAGE = 'Incorrect till PIN - try again.';

// Redemption failures the customer can fix by generating a fresh code get a
// warning tone; everything else is a hard error.
const RECOVERABLE_REDEEM_CODES = ['REDEMPTION_EXPIRED'];

// Staff confirm every till action (manual lookup, awarding points, redeeming)
// with their 4-digit PIN, so each transaction is attributable to a PIN. The
// PIN is never remembered between actions. inputMode="numeric" brings up the
// phone's number pad; on a desktop the keyboard works directly.
const TillPinField = ({ value, onChange, autoFocus = false }) => (
  <div className="flex w-full flex-col gap-1.5 text-left">
    <label htmlFor="till-pin" className="text-label text-text-secondary">
      Your till PIN
    </label>
    <input
      id="till-pin"
      type="password"
      inputMode="numeric"
      autoComplete="off"
      autoFocus={autoFocus}
      maxLength={4}
      placeholder="••••"
      value={value}
      onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 4))}
      className="h-12 w-full rounded-input border border-border bg-surface text-center font-mono text-section tracking-[0.5em] text-text-primary outline-none placeholder:text-text-disabled focus:border-primary"
    />
  </div>
);

const Till = () => {
  const { user: store, refreshProfile } = useAuth();
  const [scanAttempt, setScanAttempt] = useState(0); // bump to remount the scanner for a retry

  const [step, setStep] = useState('menu');
  const [pin, setPin] = useState('');
  const [slug, setSlug] = useState('');
  const [customer, setCustomer] = useState(null); // { customerId, name, pointsBalance, idempotencyKey }
  const [verificationMethod, setVerificationMethod] = useState('qr_scan');
  const [amountText, setAmountText] = useState(''); // raw "12.50" as typed
  const [earnResult, setEarnResult] = useState(null);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemResult, setRedeemResult] = useState(null);
  const [redeemError, setRedeemError] = useState(null);
  const [actionError, setActionError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const amountValue = Number(amountText) || 0;
  const isPinComplete = pin.length === 4;

  // Pounds and pence only: up to 5 digits, optional point, up to 2 decimals.
  const handleAmountChange = (event) => {
    setAmountText(sanitizeDecimal(event.target.value, { maxIntegerDigits: 5 }));
    setActionError('');
  };

  // Shows a validation message in the step's error slot; returns true if valid.
  const passes = (message) => {
    if (message) setActionError(message);
    return !message;
  };

  const goTo = (nextStep) => {
    setPin('');
    setActionError('');
    setStep(nextStep);
  };

  const resetToMenu = () => {
    setCustomer(null);
    setAmountText('');
    setEarnResult(null);
    setSlug('');
    setRedeemCode('');
    setRedeemResult(null);
    setRedeemError(null);
    goTo('menu');
  };

  const handlePinRejected = () => {
    setPin('');
    setActionError(PIN_ERROR_MESSAGE);
  };

  const retryScan = () => {
    setActionError('');
    setScanAttempt((attempt) => attempt + 1);
  };

  const handleScanResult = async (qrToken) => {
    setActionError('');
    try {
      const result = await scanApi.identify({ storeId: store._id, qrToken });
      setCustomer(result);
      setVerificationMethod('qr_scan');
      goTo('amount');
    } catch (err) {
      if (err.code === 'STORE_NOT_ACTIVE') {
        showErrorToast(err.message);
        goTo('menu');
        return;
      }
      setActionError(err.message);
    }
  };

  const handleSlugSubmit = async (event) => {
    event.preventDefault();
    setActionError('');
    if (!passes(validateCustomerCode(slug) || validatePin(pin))) return;
    setIsSubmitting(true);
    try {
      const result = await scanApi.identifyBySlug({ storeId: store._id, slug: slug.trim(), tillPin: pin });
      setCustomer(result);
      setVerificationMethod('slug_manual');
      goTo('amount');
    } catch (err) {
      if (PIN_ERROR_CODES.includes(err.code)) {
        handlePinRejected();
        return;
      }
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmEarn = async (event) => {
    event.preventDefault();
    setActionError('');
    if (!passes(validateNumber(amountText, NUMBER_RULES.purchaseAmount) || validatePin(pin))) return;
    setIsSubmitting(true);
    try {
      const result = await scanApi.earn({
        storeId: store._id,
        customerId: customer.customerId,
        purchaseAmount: amountValue,
        tillPin: pin,
        idempotencyKey: customer.idempotencyKey,
        verificationMethod,
      });
      setEarnResult(result);
      goTo('earn-success');
      if (!result.duplicate) showSuccessToast(`${result.pointsAwarded} points awarded`);
      // A first successful transaction flips onboardingCompleted.tillModeTested server-side.
      refreshProfile();
    } catch (err) {
      if (PIN_ERROR_CODES.includes(err.code)) {
        handlePinRejected();
        return;
      }
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // A scanned reward code only fills the form - staff still confirm with their PIN.
  const handleRedeemCodeScanned = (code) => {
    setRedeemCode(code.trim());
    goTo('redeem');
  };

  const handleRedeemSubmit = async (event) => {
    event.preventDefault();
    setActionError('');
    if (!passes(validateRedemptionCode(redeemCode) || validatePin(pin))) return;
    setIsSubmitting(true);
    try {
      const result = await scanApi.redeem({ storeId: store._id, redemptionCode: redeemCode.trim(), tillPin: pin });
      setRedeemResult(result);
      goTo('redeem-success');
      refreshProfile();
    } catch (err) {
      if (PIN_ERROR_CODES.includes(err.code)) {
        handlePinRejected();
        return;
      }
      setRedeemError(err);
      goTo('redeem-failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'menu') {
    return (
      <div className="mx-auto flex max-w-xs flex-col gap-3 px-4 py-12">
        <h1 className="mb-2 text-center text-page-title text-text-primary">Till</h1>
        <Button onClick={() => goTo('scan')}>
          <Icon name="qr_code_scanner" /> Scan customer code
        </Button>
        <Button variant="secondary" onClick={() => goTo('slug')}>
          Enter code manually
        </Button>
        <Button variant="secondary" onClick={() => goTo('redeem')}>
          Redeem a reward code
        </Button>
        <p className="mt-2 flex items-center justify-center gap-1 text-center text-body-sm text-text-muted">
          <Icon name="lock" style={{ fontSize: '1rem' }} />
          Each transaction needs a till PIN
        </p>
      </div>
    );
  }

  if (step === 'scan') {
    return (
      <div className="mx-auto flex max-w-xs flex-col items-center gap-4 px-4 py-8 text-center">
        <h1 className="text-page-title text-text-primary">Scan customer code</h1>
        <ScannerView key={scanAttempt} onResult={handleScanResult} />
        {actionError && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-body-sm text-error-text">{actionError}</p>
            <Button size="sm" variant="secondary" onClick={retryScan}>
              Scan again
            </Button>
          </div>
        )}
        <button type="button" onClick={() => goTo('slug')} className="text-body-sm text-primary">
          Camera not working? Enter code manually
        </button>
        <button type="button" onClick={resetToMenu} className="text-body-sm text-text-muted">
          Back to menu
        </button>
      </div>
    );
  }

  if (step === 'slug') {
    return (
      <div className="mx-auto max-w-xs px-4 py-12">
        <h1 className="mb-4 text-center text-page-title text-text-primary">Enter customer code</h1>
        <form onSubmit={handleSlugSubmit} className="flex flex-col gap-3" noValidate>
          <Input
            label="Customer code"
            placeholder="e.g. alex-chen-1a2b3c4d"
            value={slug}
            onChange={(event) => {
              // Customer codes are lowercase letters, digits and dashes.
              setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, LIMITS.customerCode));
              setActionError('');
            }}
            autoFocus
            autoComplete="off"
            spellCheck={false}
            className="w-full"
          />
          <TillPinField value={pin} onChange={setPin} />
          {actionError && <p className="text-body-sm text-error-text">{actionError}</p>}
          <Button type="submit" isLoading={isSubmitting} disabled={!slug.trim() || !isPinComplete}>
            Look up customer
          </Button>
          <button type="button" onClick={resetToMenu} className="text-body-sm text-text-muted">
            Back to menu
          </button>
        </form>
      </div>
    );
  }

  if (step === 'amount') {
    return (
      <form
        onSubmit={handleConfirmEarn}
        noValidate
        className="mx-auto flex max-w-xs flex-col items-center gap-4 px-4 py-8 text-center"
      >
        <div className="flex w-full items-center gap-3 rounded-card border border-border bg-surface p-3 text-left">
          <Avatar name={customer.name} />
          <div className="min-w-0">
            <p className="truncate text-card-title text-text-primary">{customer.name}</p>
            <p className="tabular-nums text-body-sm text-text-muted">{customer.pointsBalance} pts on record</p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-1.5 text-left">
          <label htmlFor="till-amount" className="text-label text-text-secondary">
            Purchase amount
          </label>
          <div className="flex h-16 w-full items-center gap-1 rounded-input border border-border bg-surface px-4 focus-within:border-primary">
            <span className="text-display text-text-muted">£</span>
            <input
              id="till-amount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              autoFocus
              placeholder="0.00"
              value={amountText}
              onChange={handleAmountChange}
              className="min-w-0 flex-1 bg-transparent tabular-nums text-display text-text-primary outline-none placeholder:text-text-disabled"
            />
          </div>
        </div>

        <TillPinField value={pin} onChange={setPin} />

        {actionError && <p className="text-body-sm text-error-text">{actionError}</p>}
        <Button type="submit" className="w-full" isLoading={isSubmitting} disabled={amountValue <= 0 || !isPinComplete}>
          Award points{amountValue > 0 && ` for ${formatCurrency(amountValue)}`}
        </Button>
        <button type="button" onClick={resetToMenu} className="text-body-sm text-text-muted">
          Cancel
        </button>
      </form>
    );
  }

  if (step === 'earn-success') {
    return (
      <div className="mx-auto flex max-w-xs flex-col items-center gap-3 px-4 py-12 text-center">
        <Icon name="check_circle" isFilled className="text-success" style={{ fontSize: '2.5rem' }} />
        <h1 className="text-page-title text-text-primary">
          {earnResult.duplicate ? 'Already recorded' : 'Points awarded'}
        </h1>
        <p className="tabular-nums text-amount text-primary">+{earnResult.pointsAwarded} pts</p>
        <p className="tabular-nums text-body-sm text-text-secondary">New balance: {earnResult.newBalance} pts</p>
        {earnResult.pointsCapApplied && (
          <p className="text-body-sm text-warning-text">Points capped by this shop&apos;s balance limit.</p>
        )}
        <Button onClick={resetToMenu}>Next customer</Button>
      </div>
    );
  }

  if (step === 'redeem') {
    return (
      <div className="mx-auto max-w-xs px-4 py-12">
        <h1 className="mb-4 text-center text-page-title text-text-primary">Redeem a code</h1>
        {!redeemCode && (
          <>
            <Button className="w-full" onClick={() => goTo('redeem-scan')}>
              <Icon name="qr_code_scanner" /> Scan reward code
            </Button>
            <p className="my-4 text-center font-mono text-caption-mono uppercase text-text-muted">or type it in</p>
          </>
        )}
        <form onSubmit={handleRedeemSubmit} className="flex flex-col gap-3" noValidate>
          <Input
            label="Redemption code"
            value={redeemCode}
            onChange={(event) => {
              // Reward codes are hex strings.
              setRedeemCode(event.target.value.replace(/[^a-f0-9]/gi, '').toLowerCase().slice(0, LIMITS.redemptionCode));
              setActionError('');
            }}
            autoFocus={!redeemCode}
            autoComplete="off"
            spellCheck={false}
            className="w-full font-mono"
          />
          <TillPinField value={pin} onChange={setPin} autoFocus={Boolean(redeemCode)} />
          {actionError && <p className="text-body-sm text-error-text">{actionError}</p>}
          <Button type="submit" isLoading={isSubmitting} disabled={!redeemCode.trim() || !isPinComplete}>
            Redeem
          </Button>
          <button type="button" onClick={resetToMenu} className="text-body-sm text-text-muted">
            Back to menu
          </button>
        </form>
      </div>
    );
  }

  if (step === 'redeem-scan') {
    return (
      <div className="mx-auto flex max-w-xs flex-col items-center gap-4 px-4 py-8 text-center">
        <h1 className="text-page-title text-text-primary">Scan reward code</h1>
        {isSubmitting ? <LoadingSpinner className="py-8" /> : <ScannerView onResult={handleRedeemCodeScanned} />}
        <button type="button" onClick={() => goTo('redeem')} className="text-body-sm text-primary">
          Type the code instead
        </button>
        <button type="button" onClick={resetToMenu} className="text-body-sm text-text-muted">
          Back to menu
        </button>
      </div>
    );
  }

  if (step === 'redeem-success') {
    return (
      <div className="mx-auto flex max-w-xs flex-col items-center gap-3 px-4 py-12 text-center">
        <Icon name="check_circle" isFilled className="text-success" style={{ fontSize: '2.5rem' }} />
        <h1 className="text-page-title text-text-primary">Reward redeemed</h1>
        <p className="tabular-nums text-body-sm text-text-secondary">{redeemResult.pointsSpent} pts spent</p>
        <Button onClick={resetToMenu}>Next customer</Button>
      </div>
    );
  }

  if (step === 'redeem-failed') {
    const isRecoverable = RECOVERABLE_REDEEM_CODES.includes(redeemError?.code);
    return (
      <div className="mx-auto flex max-w-xs flex-col items-center gap-3 px-4 py-12 text-center">
        <Icon
          name={isRecoverable ? 'schedule' : 'cancel'}
          isFilled
          className={isRecoverable ? 'text-warning' : 'text-error'}
          style={{ fontSize: '2.5rem' }}
        />
        <h1 className="text-page-title text-text-primary">{isRecoverable ? 'Code expired' : "Couldn't redeem"}</h1>
        <p className="text-body-sm text-text-secondary">{redeemError?.message}</p>
        <Button
          variant="secondary"
          onClick={() => {
            setRedeemError(null);
            setRedeemCode('');
            goTo('redeem');
          }}
        >
          Try another code
        </Button>
        <button type="button" onClick={resetToMenu} className="text-body-sm text-text-muted">
          Back to menu
        </button>
      </div>
    );
  }

  return null;
};

export default Till;
