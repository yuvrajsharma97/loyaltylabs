import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import * as authApi from '../../api/auth';
import { showSuccessToast } from '../../shared/utils/toast';
import AuthCard from './AuthCard';
import Input from '../../shared/components/Input';
import Button from '../../shared/components/Button';
import Icon from '../../shared/components/Icon';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import { LIMITS, validateEmail } from '../../shared/utils/validation';

const STATUS_CONTENT = {
  done: { icon: 'check_circle', title: 'Email verified', body: 'Your account is ready - you can sign in now.' },
  already: { icon: 'check_circle', title: 'Already verified', body: 'This account is already verified - just sign in.' },
  expired: { icon: 'error', title: 'Link expired', body: 'That verification link has expired. Send a new one below.' },
  invalid: { icon: 'error', title: 'Link invalid', body: 'That verification link isn’t valid. Send a new one below.' },
};

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const accountType = searchParams.get('accountType') || 'customer';

  const [status, setStatus] = useState(token ? 'working' : 'pending');
  const [email, setEmail] = useState(searchParams.get('email') || '');

  useEffect(() => {
    if (!token) return;

    authApi
      .verifyEmail({ token, accountType })
      .then(() => setStatus('done'))
      .catch((err) => {
        if (err.code === 'ALREADY_VERIFIED') setStatus('already');
        else if (err.code === 'LINK_EXPIRED') setStatus('expired');
        else setStatus('invalid');
      });
  }, [token, accountType]);

  const [emailError, setEmailError] = useState(null);

  const handleResend = async (event) => {
    event.preventDefault();
    const problem = validateEmail(email);
    setEmailError(problem);
    if (problem) return;
    await authApi.resendVerification({ email: email.trim(), accountType });
    showSuccessToast('Verification email sent again.');
  };

  const emailField = (
    <Input
      label="Email"
      type="email"
      autoComplete="email"
      maxLength={LIMITS.email}
      value={email}
      onChange={(event) => {
        setEmail(event.target.value);
        setEmailError(null);
      }}
      error={emailError}
    />
  );

  if (status === 'working') {
    return (
      <AuthCard title="Verifying...">
        <LoadingSpinner />
      </AuthCard>
    );
  }

  if (status === 'pending') {
    return (
      <AuthCard title="Check your email" subtitle="Follow the link we sent you to verify your account.">
        <form onSubmit={handleResend} className="flex flex-col gap-4" noValidate>
          {emailField}
          <Button type="submit" variant="secondary">
            Resend email
          </Button>
        </form>
        <Link to="/sign-in" className="mt-6 block text-center text-body-sm text-primary">
          Back to sign in
        </Link>
      </AuthCard>
    );
  }

  const content = STATUS_CONTENT[status];

  return (
    <AuthCard title={content.title}>
      <div className="flex flex-col items-center gap-3 text-center">
        <Icon
          name={content.icon}
          isFilled
          className={status === 'done' || status === 'already' ? 'text-success' : 'text-error'}
          style={{ fontSize: '2rem' }}
        />
        <p className="text-body text-text-secondary">{content.body}</p>

        {(status === 'expired' || status === 'invalid') && (
          <form onSubmit={handleResend} className="flex w-full flex-col gap-3 text-left" noValidate>
            {emailField}
            <Button type="submit" variant="secondary">
              Send new link
            </Button>
          </form>
        )}

        <Link to="/sign-in" className="text-body-sm text-primary">
          Back to sign in
        </Link>
      </div>
    </AuthCard>
  );
};

export default VerifyEmailPage;
