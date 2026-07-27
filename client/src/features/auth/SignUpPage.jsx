import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../shared/hooks/useAuth';
import PasswordInput from '../../shared/components/PasswordInput';

export default function SignUpPage() {
  const navigate = useNavigate();
  const { registerCustomer, registerStore } = useAuth();
  const [accountType, setAccountType] = useState('customer');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (accountType === 'store' && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      if (accountType === 'customer') {
        await registerCustomer({ name, email, password });
        toast.success('Account created - check your email to verify');
        setSubmitted(true);
      } else {
        // Owner name, store name, address, category, loyalty config, and
        // till PIN are all collected next in store onboarding instead.
        await registerStore({ email, password });
        toast.success('Store account created - sign in to finish setup');
        navigate('/sign-in', { replace: true });
      }
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-on-surface px-container-margin text-center gap-lg">
        <span className="material-symbols-outlined text-primary text-[56px]">mark_email_read</span>
        <h1 className="font-display text-display-md">Check your email</h1>
        <p className="font-body text-body-md text-on-surface-variant max-w-[24rem]">
          We sent a verification link to <span className="font-semibold">{email}</span>. Verify your
          address to activate your account and QR code.
        </p>
        <Link to="/sign-in" className="text-primary font-bold hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface font-body">
      <header className="w-full flex items-center justify-between px-container-margin py-md sticky top-0 z-50 bg-surface/80 backdrop-blur-md">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-sm rounded-full hover:bg-surface-container-high transition-colors flex items-center justify-center text-on-surface-variant active:scale-90"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="font-display text-primary text-body-md font-bold">LoyaltyLabs</div>
        <div className="w-10" />
      </header>

      <main className="flex-grow flex items-center justify-center px-container-margin py-3xl">
        <div className="w-full max-w-[420px] space-y-xl">
          <div className="text-center space-y-sm">
            <h1 className="font-display text-display-lg-mobile md:text-display-lg text-on-surface tracking-tight">
              {accountType === 'customer' ? 'Create your account' : 'Register your shop'}
            </h1>
            <p className="font-body text-body-md text-on-surface-variant">
              {accountType === 'customer'
                ? 'Join our neighborhood rewards community'
                : 'Set up a loyalty program for your customers'}
            </p>
          </div>

          <div className="flex rounded-lg bg-surface-container-low p-1 gap-1">
            {[
              ['customer', 'Customer'],
              ['store', 'Store owner']
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setAccountType(value)}
                className={`flex-1 py-sm rounded-md font-body text-body-sm font-semibold transition-colors ${
                  accountType === value
                    ? 'bg-surface-container-lowest text-primary shadow-sm'
                    : 'text-on-surface-variant'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="bg-surface-container-lowest p-xl rounded-xl shadow-sm">
            <form className="space-y-lg" onSubmit={handleSubmit}>
              {accountType === 'customer' && (
                <div className="space-y-xs">
                  <label htmlFor="name" className="font-body text-body-sm text-on-surface-variant ml-xs">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-md font-body text-body-md placeholder:text-outline outline-none focus:border-primary transition-all"
                  />
                </div>
              )}

              <div className="space-y-xs">
                <label htmlFor="email" className="font-body text-body-sm text-on-surface-variant ml-xs">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-md font-body text-body-md placeholder:text-outline outline-none focus:border-primary transition-all"
                />
              </div>

              <div className="space-y-xs">
                <label htmlFor="password" className="font-body text-body-sm text-on-surface-variant ml-xs">
                  Password
                </label>
                <PasswordInput
                  id="password"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
              </div>

              {accountType === 'store' && (
                <div className="space-y-xs">
                  <label htmlFor="confirmPassword" className="font-body text-body-sm text-on-surface-variant ml-xs">
                    Repeat password
                  </label>
                  <PasswordInput
                    id="confirmPassword"
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                  />
                </div>
              )}

              <div className="pt-md">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary text-on-primary font-display text-body-md py-md rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-60 pointer:cursor"
                >
                  {submitting
                    ? 'Creating account...'
                    : accountType === 'customer'
                      ? 'Create Account'
                      : 'Register Store'}
                  {!submitting && <span className="material-symbols-outlined text-body-lg">arrow_forward</span>}
                </button>
              </div>
            </form>
          </div>

          <div className="text-center">
            <p className="font-body text-body-md text-on-surface-variant">
              Already have an account?{' '}
              <Link to="/sign-in" className="text-primary font-bold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
