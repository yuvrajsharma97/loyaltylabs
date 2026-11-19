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
import PlanPicker from '../../shared/components/PlanPicker';
import { DEFAULT_PLAN_ID, TRIAL_WEEKS, findPlan } from '../../shared/utils/plans';
import {
  LIMITS,
  hasErrors,
  sanitizePhone,
  validateEmail,
  validatePassword,
  validatePersonName,
  validatePhone,
  validateTitle,
} from '../../shared/utils/validation';

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
  const [plan, setPlan] = useState(findPlan(searchParams.get('plan'))?.id || DEFAULT_PLAN_ID);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isStore = accountKind === 'store';

  // Clears a field's error as soon as the user edits it.
  const clearError = (field) => setFieldErrors((current) => ({ ...current, [field]: undefined }));

  const validate = () => ({
    // Store owners can fill their name and shop name in during onboarding.
    name: validatePersonName(name, { label: isStore ? 'Your name' : 'Full name', required: !isStore }),
    storeName: isStore ? validateTitle(storeName, { label: 'Store name', required: false }) : null,
    email: validateEmail(email),
    password: validatePassword(password),
    phone: validatePhone(phone),
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const errors = validate();
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    const cleanEmail = email.trim();
    const cleanPhone = phone.trim() || undefined;
    setIsSubmitting(true);

    try {
      if (!isStore) {
        await authApi.registerCustomer({ name: name.trim(), email: cleanEmail, password, phone: cleanPhone });
        // Unverified customers can sign in and earn points; verifying is only
        // needed to redeem, and the link is already in their inbox.
        const session = await authApi.login({ email: cleanEmail, password, accountType: 'customer' });
        await login(session);
        showSuccessToast(`Welcome! We sent a verification link to ${cleanEmail}.`);
        navigate('/');
      } else {
        await authApi.registerStore({
          ownerName: name.trim() || undefined,
          storeName: storeName.trim() || undefined,
          email: cleanEmail,
          password,
          phone: cleanPhone,
          plan,
        });
        // Store-owner login isn't gated on email verification, so we can
        // sign them straight into onboarding instead of a "check your
        // email" holding screen.
        const session = await authApi.login({ email: cleanEmail, password, accountType: 'user' });
        await login(session);
        navigate('/onboarding/store');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard title="Create your account">
      <div className="mb-5 flex justify-center">
        <SegmentedControl
          options={ACCOUNT_KINDS}
          value={accountKind}
          onChange={(kind) => {
            setAccountKind(kind);
            setFieldErrors({});
          }}
        />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label={isStore ? 'Your name (optional)' : 'Full name'}
          autoComplete="name"
          maxLength={LIMITS.personName}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            clearError('name');
          }}
          error={fieldErrors.name}
        />
        {isStore && (
          <Input
            label="Store name (optional)"
            autoComplete="organization"
            maxLength={LIMITS.storeName}
            value={storeName}
            onChange={(event) => {
              setStoreName(event.target.value);
              clearError('storeName');
            }}
            error={fieldErrors.storeName}
            hint="You can add this during setup."
          />
        )}
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          maxLength={LIMITS.email}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            clearError('email');
          }}
          error={fieldErrors.email}
        />
        <PasswordInput
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            clearError('password');
          }}
          autoComplete="new-password"
          maxLength={LIMITS.password}
          error={fieldErrors.password}
        />
        {!fieldErrors.password && (
          <p className="-mt-2 text-body-sm text-text-muted">At least 8 characters, with a letter and a number.</p>
        )}
        <Input
          label="Phone (optional)"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="07700 900123"
          value={phone}
          onChange={(event) => {
            setPhone(sanitizePhone(event.target.value));
            clearError('phone');
          }}
          error={fieldErrors.phone}
        />

        {isStore && (
          <div className="flex flex-col gap-1">
            <PlanPicker value={plan} onChange={setPlan} />
            <p className="text-body-sm text-text-secondary">
              Your first {TRIAL_WEEKS} weeks are free. You can change plan any time in Settings.
            </p>
          </div>
        )}

        {error && <p className="text-body-sm text-error-text">{error}</p>}

        <Button type="submit" isLoading={isSubmitting}>
          {isStore ? `Start ${TRIAL_WEEKS} weeks free` : 'Create account'}
        </Button>
        <p className="text-center text-body-sm text-text-muted">
          By continuing, you agree to us using your details as described in our{' '}
          <Link to="/privacy" className="text-primary">
            privacy policy
          </Link>
          .
        </p>
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
