import { useEffect, useState } from 'react';
import * as customerApi from '../../api/customer';
import { useAuth } from '../../shared/hooks/useAuth';
import QRPanel from '../../shared/components/QRPanel';
import Card from '../../shared/components/Card';
import EmptyState from '../../shared/components/EmptyState';
import LoadingSpinner from '../../shared/components/LoadingSpinner';

const CustomerQRScreen = () => {
  const { user } = useAuth();
  const [qrToken, setQrToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    customerApi
      .getQrToken()
      .then(({ qrToken: token }) => setQrToken(token))
      .catch((err) => setError(err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <LoadingSpinner className="py-16" />;
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 px-4 py-10 text-center">
      <h1 className="text-page-title text-text-primary">Your code</h1>

      {error?.code === 'QR_NOT_ISSUED' ? (
        <EmptyState
          icon="lock"
          title="Verify your email first"
          body="Your code is issued once your email address is verified."
        />
      ) : error ? (
        <EmptyState icon="error" title="Couldn't load your code" body={error.message} />
      ) : (
        <>
          <QRPanel qrToken={qrToken} />
          <p className="text-body-sm text-text-secondary">
            Show this to the till to earn points or collect a reward.
          </p>

          {user?.slug && (
            <Card className="flex w-full flex-col items-center gap-1">
              <p className="font-mono text-caption-mono uppercase text-text-muted">If the scanner can&apos;t read it</p>
              <p className="text-body-sm text-text-secondary">Give staff this code</p>
              <p className="break-all font-mono text-section tracking-wider text-primary">{user.slug}</p>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default CustomerQRScreen;
