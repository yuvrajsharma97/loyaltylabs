import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getQrToken } from '../../api/customer';
import { useCustomer } from './CustomerDashboard';
import Card from '../../shared/components/Card';
import LoadingSpinner from '../../shared/components/LoadingSpinner';

export default function CustomerQRScreen() {
  const { me } = useCustomer();
  const [qrToken, setQrToken] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getQrToken()
      .then((data) => setQrToken(data.qrToken))
      .catch((err) => setError(err));
  }, []);

  return (
    <div className="flex flex-col items-center gap-xl max-w-[480px] mx-auto text-center">
      <h1 className="font-display text-display-md-mobile md:text-display-md">Your loyalty QR code</h1>

      {error?.code === 'QR_NOT_ISSUED' ? (
        <Card className="w-full">
          <p className="text-body-md">Verify your email address to activate your loyalty QR code.</p>
        </Card>
      ) : error ? (
        <Card className="w-full text-error">{error.message || 'Could not load your QR code'}</Card>
      ) : !qrToken ? (
        <LoadingSpinner />
      ) : (
        <Card className="w-full flex flex-col items-center gap-lg">
          <div className="bg-white p-lg rounded-lg">
            <QRCodeSVG value={qrToken} size={220} />
          </div>
          <p className="text-body-sm text-on-surface-variant">
            Show this to a staff member at checkout to earn points or redeem active rewards.
          </p>

          <div className="w-full flex items-center gap-lg py-sm">
            <div className="flex-grow border-t border-outline-variant" />
            <span className="flex-shrink text-outline font-mono text-[10px] uppercase tracking-widest">
              If the scanner can't read it
            </span>
            <div className="flex-grow border-t border-outline-variant" />
          </div>

          <div className="w-full flex flex-col items-center gap-xs">
            <p className="text-body-sm text-on-surface-variant">Give staff this code</p>
            <p className="font-mono text-headline-sm tracking-[0.2em] text-primary">{me.slug}</p>
          </div>
        </Card>
      )}
    </div>
  );
}
