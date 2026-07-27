import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth, resolvePostAuthPath } from '../../shared/hooks/useAuth';
import PasswordInput from '../../shared/components/PasswordInput';

export default function SignInPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [accountType, setAccountType] = useState('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { role } = await login({ email, password, accountType });
      toast.success('Signed in');
      const path = await resolvePostAuthPath(role);
      navigate(path, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-body bg-background text-on-surface">
      <header className="w-full flex items-center px-container-margin py-lg sticky top-0 z-50">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="p-sm rounded-full hover:bg-surface-container-low transition-colors active:scale-90"
        >
          <span className="material-symbols-outlined text-primary text-[28px]">arrow_back</span>
        </button>
      </header>

      <main className="flex-grow flex items-center justify-center px-container-margin py-3xl">
        <div className="w-full max-w-[420px] flex flex-col gap-2xl">
          <div className="text-center md:text-left">
            <div className="mb-lg flex justify-center md:justify-start">
              <div className="w-12 h-12 bg-secondary-container rounded-xl flex items-center justify-center shadow-sm">
                <span
                  className="material-symbols-outlined text-on-secondary-container"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  local_cafe
                </span>
              </div>
            </div>
            <h1 className="font-display text-display-md-mobile md:text-display-md text-on-surface mb-xs">
              Welcome back
            </h1>
            <p className="text-on-surface-variant font-body text-body-md">
              Sign in to your LoyaltyLabs account to continue earning stamps.
            </p>
          </div>

          <div className="flex rounded-lg bg-surface-container-low p-1 gap-1">
            {[
              ['customer', 'Customer'],
              ['user', 'Store owner']
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

          <form className="flex flex-col gap-xl" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-sm">
              <label htmlFor="email" className="font-body text-body-sm text-on-surface-variant ml-xs">
                Email address
              </label>
              <div className="relative flex items-center rounded-lg">
                <span className="material-symbols-outlined absolute left-md text-outline">mail</span>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-11 pr-md py-[14px] bg-surface-container-low border border-outline-variant rounded-lg text-on-surface placeholder:text-outline focus:border-primary focus:ring-0 transition-all outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-sm">
              <div className="flex justify-between items-center px-xs">
                <label htmlFor="password" className="font-body text-body-sm text-on-surface-variant">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-primary font-body text-body-sm hover:underline decoration-primary/30"
                >
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>

            <div className="pt-md">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary-container text-on-primary py-lg rounded-lg font-display text-headline-sm shadow-sm hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </form>

          {accountType === 'customer' && (
            <>
              <div className="relative flex items-center py-md">
                <div className="flex-grow border-t border-outline-variant" />
                <span className="flex-shrink mx-lg text-outline font-mono text-[10px] uppercase tracking-widest">
                  or continue with
                </span>
                <div className="flex-grow border-t border-outline-variant" />
              </div>
              <button
                type="button"
                className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface py-md rounded-lg flex items-center justify-center gap-md hover:bg-surface-container-low transition-colors active:scale-[0.98]"
              >
                <span className="font-body text-body-md font-medium">Continue with Google</span>
              </button>
            </>
          )}

          <p className="text-center font-body text-body-md text-on-surface-variant">
            New to LoyaltyLabs?{' '}
            <Link to="/sign-up" className="text-primary font-bold hover:underline ml-xs">
              Create one
            </Link>
          </p>
        </div>
      </main>

      <div className="fixed -bottom-24 -right-24 opacity-[0.03] pointer-events-none select-none overflow-hidden">
        <span className="material-symbols-outlined text-[400px]">verified</span>
      </div>
    </div>
  );
}
