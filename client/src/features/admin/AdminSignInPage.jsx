import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../shared/hooks/useAuth';
import PasswordInput from '../../shared/components/PasswordInput';

// Deliberately not linked from anywhere in the app (no nav item, no link on
// the customer/store SignInPage) - reachable only by typing /admin/login
// directly, per the "admin always has to manually type the URL" requirement.
// accountType is fixed to 'user' (the users collection holds both store
// owners and super admins) and the resolved role is checked after login so
// a store owner's credentials don't silently land them on this page's flow.
export default function AdminSignInPage() {
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { role } = await login({ email, password, accountType: 'user' });
      if (role !== 'super_admin') {
        await logout();
        toast.error('This account is not an admin account');
        return;
      }
      toast.success('Signed in');
      navigate('/admin', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-body bg-background text-on-surface">
      <main className="flex-grow flex items-center justify-center px-container-margin py-3xl">
        <div className="w-full max-w-[420px] flex flex-col gap-2xl">
          <div className="text-center md:text-left">
            <div className="mb-lg flex justify-center md:justify-start">
              <div className="w-12 h-12 bg-inverse-surface rounded-xl flex items-center justify-center shadow-sm">
                <span
                  className="material-symbols-outlined text-inverse-on-surface"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  shield_person
                </span>
              </div>
            </div>
            <h1 className="font-display text-display-md-mobile md:text-display-md text-on-surface mb-xs">
              Admin sign in
            </h1>
            <p className="text-on-surface-variant font-body text-body-md">
              Restricted access. Authorized administrators only.
            </p>
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
                  placeholder="admin@example.com"
                  className="w-full pl-11 pr-md py-[14px] bg-surface-container-low border border-outline-variant rounded-lg text-on-surface placeholder:text-outline focus:border-primary focus:ring-0 transition-all outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-sm">
              <label htmlFor="password" className="font-body text-body-sm text-on-surface-variant ml-xs">
                Password
              </label>
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
                className="w-full bg-inverse-surface text-inverse-on-surface py-lg rounded-lg font-display text-headline-sm shadow-sm hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
