import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import toast, { Toaster, ToastBar } from 'react-hot-toast';
import { AuthProvider, useAuth, resolvePostAuthPath } from './shared/hooks/useAuth';
import { useTheme } from './shared/hooks/useTheme';
import ProtectedRoute from './shared/components/ProtectedRoute';
import SignInPage from './features/auth/SignInPage';
import SignUpPage from './features/auth/SignUpPage';
import VerifyEmailPage from './features/auth/VerifyEmailPage';
import CustomerOnboarding from './features/onboarding/CustomerOnboarding';
import StoreOnboarding from './features/onboarding/StoreOnboarding';
import CustomerDashboard from './features/customer/CustomerDashboard';
import OwnerDashboard from './features/owner/OwnerDashboard';

function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="fixed bottom-lg right-lg z-50 w-11 h-11 rounded-full bg-surface-container-high text-on-surface shadow-lg flex items-center justify-center hover:bg-surface-container-highest transition-colors"
    >
      <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
    </button>
  );
}

// Decides dashboard vs. onboarding for both a fresh login and a page
// refresh while already authenticated - resolvePostAuthPath hits the API
// since onboarding status isn't in the JWT/session.
function RoleHomeRedirect() {
  const { isAuthenticated, role } = useAuth();
  const [path, setPath] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    resolvePostAuthPath(role).then(setPath).catch(() => setPath('/sign-in'));
  }, [isAuthenticated, role]);

  if (!isAuthenticated) return <Navigate to="/sign-in" replace />;
  if (!path) return null;
  return <Navigate to={path} replace />;
}

// Placeholder landing page - the admin dashboard hasn't been built yet
// (customer/store-owner now have real dashboards below).
function RolePlaceholder({ label }) {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-lg bg-background text-on-surface font-body">
      <h1 className="font-display text-display-md">{label}</h1>
      <p className="text-on-surface-variant">This dashboard is built next.</p>
      <button
        type="button"
        onClick={logout}
        className="text-primary font-bold hover:underline"
      >
        Log out
      </button>
    </div>
  );
}

function App() {
  useTheme();

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RoleHomeRedirect />} />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route
            path="/onboarding/customer"
            element={
              <ProtectedRoute role="customer">
                <CustomerOnboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/onboarding/store"
            element={
              <ProtectedRoute role="store_owner">
                <StoreOnboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/*"
            element={
              <ProtectedRoute role="customer">
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/store/*"
            element={
              <ProtectedRoute role="store_owner">
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute role="super_admin">
                <RolePlaceholder label="Admin dashboard" />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ThemeToggleButton />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 10000,
            style: {
              background: 'var(--color-surface-container-high)',
              color: 'var(--color-on-surface)',
              border: '1px solid var(--color-outline-variant)'
            },
            success: { iconTheme: { primary: 'var(--color-primary)', secondary: 'var(--color-on-primary)' } },
            error: { iconTheme: { primary: 'var(--color-error)', secondary: 'var(--color-on-error)' } }
          }}
        >
          {(t) => (
            <ToastBar toast={t}>
              {({ icon, message }) => (
                <>
                  {icon}
                  {message}
                  {t.type !== 'loading' && (
                    <button
                      type="button"
                      onClick={() => toast.dismiss(t.id)}
                      aria-label="Dismiss notification"
                      className="flex items-center justify-center rounded-full p-1 text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  )}
                </>
              )}
            </ToastBar>
          )}
        </Toaster>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
