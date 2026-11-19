import { Outlet } from 'react-router-dom';
import AppShell from '../../shared/components/AppShell';
import { useAuth } from '../../shared/hooks/useAuth';

const NAV_ITEMS = [
  { to: '/customer/home', icon: 'home', label: 'Home' },
  { to: '/customer/shops', icon: 'storefront', label: 'Shops' },
  { to: '/customer/scan', icon: 'qr_code_2', label: 'Scan' },
  { to: '/customer/wallet', icon: 'account_balance_wallet', label: 'Wallet' },
  { to: '/customer/account', icon: 'person', label: 'Account' },
];

const CustomerShell = () => {
  const { user } = useAuth();
  const totalPoints = user?.memberships?.reduce((sum, membership) => sum + membership.pointsBalance, 0) ?? 0;

  return (
    <AppShell
      navItems={NAV_ITEMS}
      railFooter={
        <div className="rounded-card border border-border bg-canvas p-3">
          <p className="text-label text-text-muted">Total balance</p>
          <p className="tabular-nums text-card-title text-text-primary">{totalPoints} pts</p>
        </div>
      }
    >
      <Outlet />
    </AppShell>
  );
};

export default CustomerShell;
