import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { verifyEmail, resendVerification } from '../../api/auth';
import LoadingSpinner from '../../shared/components/LoadingSpinner';

const VALID_ACCOUNT_TYPES = ['customer', 'user'];

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const accountType = searchParams.get('accountType');

  const linkLooksValid = Boolean(token) && VALID_ACCOUNT_TYPES.includes(accountType);

  // verifying | success | already-verified | problem
  const [status, setStatus] = useState(() => (linkLooksValid ? 'verifying' : 'problem'));
  const [problemMessage, setProblemMessage] = useState(() =>
    linkLooksValid ? '' : 'This verification link is invalid.'
  );
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!linkLooksValid) return;

    verifyEmail({ token, accountType })
      .then(() => setStatus('success'))
      .catch((err) => {
        if (err.code === 'ALREADY_VERIFIED') {
          setStatus('already-verified');
        } else {
          setStatus('problem');
          setProblemMessage(err.message || 'This verification link is invalid or has expired.');
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResend = async (e) => {
    e.preventDefault();
    setResending(true);
    try {
      await resendVerification({ email, accountType });
      setResent(true);
    } catch (err) {
      toast.error(err.message || 'Could not send a new link');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-on-surface font-body px-container-margin text-center gap-lg">
      {status === 'verifying' && (
        <>
          <LoadingSpinner />
          <h1 className="font-display text-display-md">Verifying your email...</h1>
        </>
      )}

      {status === 'success' && (
        <>
          <span className="material-symbols-outlined text-primary text-[56px]">verified</span>
          <h1 className="font-display text-display-md">Email verified</h1>
          <p className="font-body text-body-md text-on-surface-variant max-w-[24rem]">
            Your account is active. You can sign in now.
          </p>
          <Link to="/sign-in" className="text-primary font-bold hover:underline">
            Continue to sign in
          </Link>
        </>
      )}

      {status === 'already-verified' && (
        <>
          <span className="material-symbols-outlined text-primary text-[56px]">verified</span>
          <h1 className="font-display text-display-md">Already verified</h1>
          <p className="font-body text-body-md text-on-surface-variant max-w-[24rem]">
            This email address is already verified - you can sign in.
          </p>
          <Link to="/sign-in" className="text-primary font-bold hover:underline">
            Continue to sign in
          </Link>
        </>
      )}

      {status === 'problem' && (
        <>
          <span className="material-symbols-outlined text-error text-[56px]">error</span>
          <h1 className="font-display text-display-md">Link expired or invalid</h1>
          <p className="font-body text-body-md text-on-surface-variant max-w-[24rem]">{problemMessage}</p>

          {resent ? (
            <p className="font-body text-body-md text-on-surface-variant max-w-[24rem]">
              If an account exists for that address, a new link is on its way.
            </p>
          ) : VALID_ACCOUNT_TYPES.includes(accountType) ? (
            <form onSubmit={handleResend} className="w-full max-w-[360px] flex flex-col gap-md">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-md font-body text-body-md placeholder:text-outline outline-none focus:border-primary transition-all"
              />
              <button
                type="submit"
                disabled={resending}
                className="w-full bg-primary text-on-primary py-md rounded-lg font-bold hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {resending ? 'Sending...' : 'Send a new link'}
              </button>
            </form>
          ) : (
            <Link to="/sign-in" className="text-primary font-bold hover:underline">
              Back to sign in
            </Link>
          )}
        </>
      )}
    </div>
  );
}
