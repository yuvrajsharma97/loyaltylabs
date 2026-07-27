import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getMyStore } from '../../api/storeOwner';
import { useAuth } from '../../shared/hooks/useAuth';
import DashboardShell from '../../shared/components/DashboardShell';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import Analytics from './Analytics';
import RewardEditor from './RewardEditor';
import OwnerTransactionHistory from './OwnerTransactionHistory';
import DisputesPanel from './DisputesPanel';
import Settings from './Settings';
import TillHome from './till/TillHome';

const StoreContext = createContext(null);

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within OwnerDashboard');
  return ctx;
}

const NAV_ITEMS = [
  { to: '/store', icon: 'analytics', label: 'Overview', end: true },
  { to: '/store/rewards', icon: 'redeem', label: 'Rewards' },
  { to: '/store/till', icon: 'point_of_sale', label: 'Till' },
  { to: '/store/transactions', icon: 'receipt_long', label: 'Transactions' },
  { to: '/store/disputes', icon: 'flag', label: 'Disputes' },
  { to: '/store/settings', icon: 'settings', label: 'Settings' }
];

export default function OwnerDashboard() {
  const { logout } = useAuth();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const data = await getMyStore();
      setStore(data);
    } catch (err) {
      toast.error(err.message || 'Could not load your store');
    }
  }, []);

  useEffect(() => {
    getMyStore()
      .then(setStore)
      .catch((err) => toast.error(err.message || 'Could not load your store'))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !store) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <StoreContext.Provider value={{ store, refetch }}>
      <DashboardShell
        brandTitle={store.name}
        brandSubtitle="Store dashboard"
        navItems={NAV_ITEMS}
        footer={
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-md px-md py-sm w-full text-on-surface-variant hover:text-error transition-colors"
          >
            <span className="material-symbols-outlined">logout</span>
            Log out
          </button>
        }
      >
        <Routes>
          <Route index element={<Analytics />} />
          <Route path="rewards" element={<RewardEditor />} />
          <Route path="till/*" element={<TillHome />} />
          <Route path="transactions" element={<OwnerTransactionHistory />} />
          <Route path="disputes" element={<DisputesPanel />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/store" replace />} />
        </Routes>
      </DashboardShell>
    </StoreContext.Provider>
  );
}
