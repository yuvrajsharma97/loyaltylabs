import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getMe } from '../../api/customer';
import { useAuth } from '../../shared/hooks/useAuth';
import DashboardShell from '../../shared/components/DashboardShell';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import CustomerHome from './CustomerHome';
import StoreDirectory from './StoreDirectory';
import ShopRewards from './ShopRewards';
import CustomerQRScreen from './CustomerQRScreen';
import Wallet from './Wallet';
import AccountSettings from './AccountSettings';

const CustomerContext = createContext(null);

export function useCustomer() {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error('useCustomer must be used within CustomerDashboard');
  return ctx;
}

const NAV_ITEMS = [
  { to: '/customer', icon: 'home', label: 'Dashboard', end: true },
  { to: '/customer/shops', icon: 'storefront', label: 'Shops' },
  { to: '/customer/scan', icon: 'qr_code_2', label: 'Scan' },
  { to: '/customer/wallet', icon: 'account_balance_wallet', label: 'Wallet' },
  { to: '/customer/account', icon: 'person', label: 'Account' }
];

export default function CustomerDashboard() {
  const { logout } = useAuth();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const data = await getMe();
      setMe(data);
    } catch (err) {
      toast.error(err.message || 'Could not load your account');
    }
  }, []);

  useEffect(() => {
    getMe()
      .then(setMe)
      .catch((err) => toast.error(err.message || 'Could not load your account'))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !me) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <CustomerContext.Provider value={{ me, refetch }}>
      <DashboardShell
        brandTitle="LoyaltyLabs"
        brandSubtitle="Your rewards"
        navItems={NAV_ITEMS}
        footer={
          <div className="flex items-center justify-between px-sm">
            <div className="min-w-0">
              <p className="font-body text-body-sm font-semibold text-on-surface truncate">{me.name}</p>
              <p className="text-body-sm text-on-surface-variant truncate">{me.email}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              aria-label="Log out"
              className="text-on-surface-variant hover:text-error transition-colors shrink-0"
            >
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        }
      >
        <Routes>
          <Route index element={<CustomerHome />} />
          <Route path="shops" element={<StoreDirectory />} />
          <Route path="shops/:storeId" element={<ShopRewards />} />
          <Route path="scan" element={<CustomerQRScreen />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="account" element={<AccountSettings />} />
          <Route path="*" element={<Navigate to="/customer" replace />} />
        </Routes>
      </DashboardShell>
    </CustomerContext.Provider>
  );
}
