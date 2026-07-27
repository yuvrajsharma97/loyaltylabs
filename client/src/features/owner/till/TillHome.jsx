import { useState } from 'react';
import toast from 'react-hot-toast';
import { identify, identifyBySlug, earn, redeem } from '../../../api/scan';
import { useStore } from '../OwnerDashboard';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import ScannerView from './ScannerView';
import CustomerCard from './CustomerCard';
import EarnForm from './EarnForm';
import SlugSearch from './SlugSearch';
import SuccessScreen from './SuccessScreen';
import RedeemResult from './RedeemResult';

const MENU_ITEMS = [
  { mode: 'scan', icon: 'qr_code_scanner', label: 'Scan customer QR' },
  { mode: 'slug', icon: 'search', label: 'Enter username manually' },
  { mode: 'redeem-code', icon: 'confirmation_number', label: 'Redeem a code' }
];

export default function TillHome() {
  const { store, refetch } = useStore();
  const [mode, setMode] = useState('menu');
  const [customer, setCustomer] = useState(null);
  const [verificationMethod, setVerificationMethod] = useState(null);
  const [busy, setBusy] = useState(false);
  const [earnResult, setEarnResult] = useState(null);
  const [redeemOutcome, setRedeemOutcome] = useState(null); // { success } | { error }
  const [redemptionCode, setRedemptionCode] = useState('');
  const [redeemPin, setRedeemPin] = useState('');

  const reset = () => {
    setMode('menu');
    setCustomer(null);
    setVerificationMethod(null);
    setEarnResult(null);
    setRedeemOutcome(null);
    setRedemptionCode('');
    setRedeemPin('');
  };

  const handleDecode = async (qrToken) => {
    setBusy(true);
    try {
      const result = await identify(store._id, qrToken);
      setCustomer(result);
      setVerificationMethod('qr_scan');
      setMode('earn');
    } catch (err) {
      toast.error(err.message || 'Could not identify this customer');
      setMode('menu');
    } finally {
      setBusy(false);
    }
  };

  const handleSlugSubmit = async ({ slug, tillPin }) => {
    setBusy(true);
    try {
      const result = await identifyBySlug(store._id, slug, tillPin);
      setCustomer(result);
      setVerificationMethod('slug_manual');
      setMode('earn');
    } catch (err) {
      toast.error(err.message || 'Could not identify this customer');
    } finally {
      setBusy(false);
    }
  };

  const handleEarnSubmit = async ({ purchaseAmount, tillPin }) => {
    setBusy(true);
    try {
      const result = await earn({
        storeId: store._id,
        customerId: customer.customerId,
        purchaseAmount,
        tillPin,
        idempotencyKey: customer.idempotencyKey,
        verificationMethod
      });
      setEarnResult(result);
      setMode('success');
      refetch();
    } catch (err) {
      toast.error(err.message || 'Could not award points');
    } finally {
      setBusy(false);
    }
  };

  const handleRedeemSubmit = async () => {
    setBusy(true);
    try {
      const result = await redeem({ storeId: store._id, redemptionCode, tillPin: redeemPin });
      setRedeemOutcome({ success: result });
      refetch();
    } catch (err) {
      setRedeemOutcome({ error: err });
    } finally {
      setBusy(false);
      setMode('redeem-result');
    }
  };

  if (mode === 'scan') {
    return (
      <div className="max-w-[480px] mx-auto">
        <ScannerView
          onDecode={handleDecode}
          onError={(msg) => {
            toast.error(msg);
            setMode('menu');
          }}
          onCancel={reset}
        />
      </div>
    );
  }

  if (mode === 'slug') {
    return (
      <div className="max-w-[480px] mx-auto">
        <Card>
          <SlugSearch onSubmit={handleSlugSubmit} submitting={busy} onCancel={reset} />
        </Card>
      </div>
    );
  }

  if (mode === 'earn') {
    return (
      <div className="max-w-[480px] mx-auto flex flex-col gap-lg">
        <CustomerCard customer={customer} />
        <Card>
          <EarnForm onSubmit={handleEarnSubmit} submitting={busy} />
        </Card>
      </div>
    );
  }

  if (mode === 'success') {
    return (
      <div className="max-w-[480px] mx-auto">
        <SuccessScreen result={earnResult} onDone={reset} />
      </div>
    );
  }

  if (mode === 'redeem-code') {
    return (
      <div className="max-w-[480px] mx-auto">
        <Card className="flex flex-col gap-lg">
          <div className="space-y-xs">
            <label className="font-body text-body-sm text-on-surface-variant ml-xs">Redemption code</label>
            <input
              value={redemptionCode}
              onChange={(e) => setRedemptionCode(e.target.value.toUpperCase())}
              placeholder="Code from customer's screen"
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-md font-mono text-body-lg tracking-[0.15em] text-center outline-none focus:border-primary transition-all"
            />
          </div>
          <div className="space-y-xs">
            <label className="font-body text-body-sm text-on-surface-variant ml-xs">Your till PIN</label>
            <input
              value={redeemPin}
              onChange={(e) => setRedeemPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              inputMode="numeric"
              placeholder="1234"
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-md font-mono text-body-lg tracking-[0.2em] text-center outline-none focus:border-primary transition-all"
            />
          </div>
          <div className="flex gap-md">
            <Button variant="text" className="flex-1 border border-outline-variant" onClick={reset}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              loading={busy}
              disabled={!redemptionCode || redeemPin.length !== 4}
              onClick={handleRedeemSubmit}
            >
              Redeem
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (mode === 'redeem-result') {
    return (
      <div className="max-w-[480px] mx-auto">
        <RedeemResult success={redeemOutcome?.success} error={redeemOutcome?.error} onDone={reset} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-xl max-w-[480px] mx-auto">
      <h1 className="font-display text-display-md-mobile md:text-display-md text-center">Till Mode</h1>
      <div className="flex flex-col gap-md">
        {MENU_ITEMS.map(({ mode: m, icon, label }) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className="flex items-center gap-md px-xl py-lg rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-all text-left"
          >
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 32 }}>
              {icon}
            </span>
            <span className="font-body text-body-lg font-semibold">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
