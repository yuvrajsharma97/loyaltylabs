import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './shared/hooks/useAuth';
import LoadingSpinner from './shared/components/LoadingSpinner';
import ProtectedRoute from './shared/components/ProtectedRoute';

const LandingPage = lazy(() => import('./features/landing/LandingPage'));
const SignInPage = lazy(() => import('./features/auth/SignInPage'));
const SignUpPage = lazy(() => import('./features/auth/SignUpPage'));
const VerifyEmailPage = lazy(() => import('./features/auth/VerifyEmailPage'));
const ResetPasswordPage = lazy(() => import('./features/auth/ResetPasswordPage'));
const AdminSignInPage = lazy(() => import('./features/auth/AdminSignInPage'));
const CustomerOnboarding = lazy(() => import('./features/onboarding/CustomerOnboarding'));
const StoreOnboarding = lazy(() => import('./features/onboarding/StoreOnboarding'));
const CustomerShell = lazy(() => import('./features/customer/CustomerShell'));
const CustomerHome = lazy(() => import('./features/customer/CustomerHome'));
const StoreDirectory = lazy(() => import('./features/customer/StoreDirectory'));
const StoreDetail = lazy(() => import('./features/customer/StoreDetail'));
const CustomerQRScreen = lazy(() => import('./features/customer/CustomerQRScreen'));
const Wallet = lazy(() => import('./features/customer/Wallet'));
const AccountSettings = lazy(() => import('./features/customer/AccountSettings'));
const OwnerShell = lazy(() => import('./features/owner/OwnerShell'));
const OwnerDashboard = lazy(() => import('./features/owner/OwnerDashboard'));
const Till = lazy(() => import('./features/owner/till/Till'));
const Rewards = lazy(() => import('./features/owner/Rewards'));
const OwnerTransactionHistory = lazy(() => import('./features/owner/OwnerTransactionHistory'));
const DisputesPanel = lazy(() => import('./features/owner/DisputesPanel'));
const Settings = lazy(() => import('./features/owner/Settings'));
const AdminShell = lazy(() => import('./features/admin/AdminShell'));
const AdminOverview = lazy(() => import('./features/admin/AdminOverview'));
const AdminStores = lazy(() => import('./features/admin/AdminStores'));
const AdminDisputes = lazy(() => import('./features/admin/AdminDisputes'));
const AdminCustomers = lazy(() => import('./features/admin/AdminCustomers'));
const AdminCustomerDetail = lazy(() => import('./features/admin/AdminCustomerDetail'));
const AdminHealth = lazy(() => import('./features/admin/AdminHealth'));

function isStoreFullyOnboarded(store) {
  const steps = store?.onboardingCompleted;
  return Boolean(steps?.loyaltyRuleSet && steps?.firstRewardAdded && steps?.tillModeTested);
}

const RootRedirect = () => {
  const { isAuthenticated, isLoading, role, user } = useAuth();

  if (isLoading) {
    return <LoadingSpinner className="h-screen" />;
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  if (role === 'customer') {
    return <Navigate to={user?.onboardingCompleted ? '/customer/home' : '/onboarding/customer'} replace />;
  }

  if (role === 'store_owner') {
    return <Navigate to={isStoreFullyOnboarded(user) ? '/store/overview' : '/onboarding/store'} replace />;
  }

  if (role === 'super_admin') {
    return <Navigate to="/admin/stats" replace />;
  }

  return <Navigate to="/sign-in" replace />;
};

const App = () => {
  return (
    <Suspense fallback={<LoadingSpinner className="h-screen" />}>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/admin/login" element={<AdminSignInPage />} />

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
          path="/customer"
          element={
            <ProtectedRoute role="customer">
              <CustomerShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<CustomerHome />} />
          <Route path="shops" element={<StoreDirectory />} />
          <Route path="shops/:storeId" element={<StoreDetail />} />
          <Route path="scan" element={<CustomerQRScreen />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="account" element={<AccountSettings />} />
        </Route>

        <Route
          path="/store"
          element={
            <ProtectedRoute role="store_owner">
              <OwnerShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<OwnerDashboard />} />
          <Route path="till" element={<Till />} />
          <Route path="rewards" element={<Rewards />} />
          <Route path="transactions" element={<OwnerTransactionHistory />} />
          <Route path="disputes" element={<DisputesPanel />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="super_admin">
              <AdminShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="stats" replace />} />
          <Route path="stats" element={<AdminOverview />} />
          <Route path="stores" element={<AdminStores />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="customers/:id" element={<AdminCustomerDetail />} />
          <Route path="disputes" element={<AdminDisputes />} />
          <Route path="approvals" element={<Navigate to="/admin/disputes" replace />} />
          <Route path="health" element={<AdminHealth />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;
