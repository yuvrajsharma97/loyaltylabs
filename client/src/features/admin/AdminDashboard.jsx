import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../shared/hooks/useAuth';
import DashboardShell from '../../shared/components/DashboardShell';
import AdminOverview from './AdminOverview';
import AdminStores from './AdminStores';
import AdminCustomers from './AdminCustomers';
import AdminCustomerDetail from './AdminCustomerDetail';
import AdminDisputes from './AdminDisputes';

const NAV_ITEMS = [
  { to: '/admin', icon: 'analytics', label: 'Overview', end: true },
  { to: '/admin/stores', icon: 'storefront', label: 'Stores' },
  { to: '/admin/customers', icon: 'group', label: 'Customers' },
  { to: '/admin/disputes', icon: 'flag', label: 'Disputes' }
];

export default function AdminDashboard() {
  const { logout } = useAuth();

  return (
    <DashboardShell
      brandTitle="LoyaltyLabs"
      brandSubtitle="Admin"
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
        <Route index element={<AdminOverview />} />
        <Route path="stores" element={<AdminStores />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="customers/:id" element={<AdminCustomerDetail />} />
        <Route path="disputes" element={<AdminDisputes />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </DashboardShell>
  );
}
