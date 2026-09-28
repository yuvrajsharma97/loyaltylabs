import { Outlet, useNavigate } from 'react-router-dom';
import AppShell from '../../shared/components/AppShell';
import { useAuth } from '../../shared/hooks/useAuth';
import Icon from '../../shared/components/Icon';
import IconButton from '../../shared/components/IconButton';

const NAV_ITEMS = [
  { to: '/store/overview', icon: 'dashboard', label: 'Overview' },
  { to: '/store/till', icon: 'point_of_sale', label: 'Till' },
  { to: '/store/rewards', icon: 'redeem', label: 'Rewards' },
  { to: '/store/transactions', icon: 'receipt_long', label: 'Transactions' },
  { to: '/store/disputes', icon: 'flag', label: 'Disputes' },
  { to: '/store/settings', icon: 'settings', label: 'Settings' },
];

const OwnerShell = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/sign-in?as=store');
  };

  return (
    <AppShell
      navItems={NAV_ITEMS}
      headerAction={
        <IconButton label="Log out" onClick={handleLogout}>
          <Icon name="logout" />
        </IconButton>
      }
      railFooter={
        <div className="flex items-center justify-between gap-2 rounded-card border border-border bg-canvas p-3">
          <span className="truncate text-body-sm text-text-secondary">{user?.name}</span>
          <button type="button" onClick={handleLogout} aria-label="Log out" className="text-text-muted hover:text-error">
            <Icon name="logout" />
          </button>
        </div>
      }
    >
      <Outlet />
    </AppShell>
  );
};

export default OwnerShell;
