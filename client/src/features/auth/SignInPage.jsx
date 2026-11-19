import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import * as authApi from '../../api/auth';
import { useAuth } from '../../shared/hooks/useAuth';
import { showSuccessToast } from '../../shared/utils/toast';
import AuthCard from './AuthCard';
import Input from '../../shared/components/Input';
import PasswordInput from '../../shared/components/PasswordInput';
import Button from '../../shared/components/Button';
import SegmentedControl from '../../shared/components/SegmentedControl';
import GoogleSignInButton from '../../shared/components/GoogleSignInButton';
import Modal from '../../shared/components/Modal';
import { LIMITS, hasErrors, validateEmail } from '../../shared/utils/validation';

const ACCOUNT_KINDS = [
  { value: 'customer', label: 'Customer' },
  { value: 'store', label: 'Store owner' },
];

const SignInPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();

  const [accountKind, setAccountKind] = useState(searchParams.get('as') === 'store' ? 'store' : 'customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    // Only format checks here - strength rules apply when a password is set,
    // not when signing in with an existing one.
    const errors = { email: validateEmail(email), password: password ? null : 'Enter your password.' };
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    setIsSubmitting(true);
    try {
      const accountType = accountKind === 'customer' ? 'customer' : 'user';
      const session = await authApi.login({ email: email.trim(), password, accountType });
      await login(session);
      navigate('/');
    } catch (err) {
      if (err.code === 'EMAIL_NOT_VERIFIED') {
        navigate(`/verify-email?email=${encodeURIComponent(email)}&accountType=customer`);
        return;
      }
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleCredential = async (idToken) => {
    setError('');
    try {
      const session = await authApi.loginWithGoogle({ idToken });
      await login(session);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AuthCard title="Sign in" subtitle="Welcome back.">
      <div className="mb-5 flex justify-center">
        <SegmentedControl options={ACCOUNT_KINDS} value={accountKind} onChange={setAccountKind} />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          maxLength={LIMITS.email}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setFieldErrors((current) => ({ ...current, email: undefined }));
          }}
          error={fieldErrors.email}
        />
        <PasswordInput
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setFieldErrors((current) => ({ ...current, password: undefined }));
          }}
          autoComplete="current-password"
          maxLength={LIMITS.password}
          error={fieldErrors.password}
        />

        {error && <p className="text-body-sm text-error-text">{error}</p>}

        <button
          type="button"
          onClick={() => setIsForgotOpen(true)}
          className="self-end text-body-sm text-text-secondary hover:text-primary"
        >
          Forgot password?
        </button>

        <Button type="submit" isLoading={isSubmitting}>
          Sign in
        </Button>
      </form>

      {accountKind === 'customer' && (
        <div className="mt-4 flex flex-col items-center gap-3">
          <span className="text-body-sm text-text-muted">or</span>
          <GoogleSignInButton onCredential={handleGoogleCredential} />
        </div>
      )}

      <p className="mt-6 text-center text-body-sm text-text-secondary">
        Don&apos;t have an account?{' '}
        <Link to={`/sign-up${accountKind === 'store' ? '?as=store' : ''}`} className="text-primary">
          Sign up
        </Link>
      </p>

      <ForgotPasswordModal
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
        accountKind={accountKind}
      />
    </AuthCard>
  );
};

const ForgotPasswordModal = ({ isOpen, onClose, accountKind }) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const problem = validateEmail(email);
    setEmailError(problem);
    if (problem) return;

    setIsSubmitting(true);
    try {
      const accountType = accountKind === 'customer' ? 'customer' : 'user';
      await authApi.forgotPassword({ email: email.trim(), accountType });
      showSuccessToast('If that account exists, a reset link is on its way.');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reset your password">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <p className="text-body-sm text-text-secondary">
          We&apos;ll email you a link to set a new password.
        </p>
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
        <Button type="submit" isLoading={isSubmitting}>
          Send reset link
        </Button>
      </form>
    </Modal>
  );
};

export default SignInPage;
