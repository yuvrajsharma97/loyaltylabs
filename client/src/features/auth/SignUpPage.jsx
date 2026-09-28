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
import Icon from '../../shared/components/Icon';

const ACCOUNT_KINDS = [
  { value: 'customer', label: 'Customer' },
  { value: 'store', label: 'Store owner' },
];

const SignUpPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();

  const [accountKind, setAccountKind] = useState(searchParams.get('as') === 'store' ? 'store' : 'customer');
  const [name, setName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (accountKind === 'customer') {
        await authApi.registerCustomer({ name, email, password, phone: phone || undefined });
        setIsRegistered(true);
      } else {
        await authApi.registerStore({
          ownerName: name || undefined,
          storeName: storeName || undefined,
          email,
          password,
          phone: phone || undefined,
        });
        // Store-owner login isn't gated on email verification, so we can
        // sign them straight into onboarding instead of a "check your
        // email" holding screen.
        const session = await authApi.login({ email, password, accountType: 'user' });
        await login(session);
        navigate('/onboarding/store');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    await authApi.resendVerification({ email, accountType: 'customer' });
    showSuccessToast('Verification email sent again.');
  };

  if (isRegistered) {
    return (
      <AuthCard title="Check your email">
        <div className="flex flex-col items-center gap-3 text-center">
          <Icon name="mail" className="text-primary" style={{ fontSize: '2rem' }} />
          <p className="text-body text-text-secondary">
            We sent a verification link to <strong>{email}</strong>. Follow it to activate your account.
          </p>
          <Button variant="secondary" onClick={handleResend}>
            Resend email
          </Button>
          <Link to="/sign-in" className="text-body-sm text-primary">
            Back to sign in
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Create your account">
      <div className="mb-5 flex justify-center">
        <SegmentedControl options={ACCOUNT_KINDS} value={accountKind} onChange={setAccountKind} />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label={accountKind === 'customer' ? 'Full name' : 'Your name'}
          value={name}
          onChange={(event) => setName(event.target.value)}
          required={accountKind === 'customer'}
        />
        {accountKind === 'store' && (
          <Input label="Store name" value={storeName} onChange={(event) => setStoreName(event.target.value)} />
        )}
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <PasswordInput
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          required
        />
        <Input
          label="Phone (optional)"
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />

        {error && <p className="text-body-sm text-error-text">{error}</p>}

        <Button type="submit" isLoading={isSubmitting}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-body-sm text-text-secondary">
        Already have an account?{' '}
        <Link to={`/sign-in${accountKind === 'store' ? '?as=store' : ''}`} className="text-primary">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
};

export default SignUpPage;
