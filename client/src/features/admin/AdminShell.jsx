import { Outlet, useNavigate } from 'react-router-dom';
import AppShell from '../../shared/components/AppShell';
import { useAuth } from '../../shared/hooks/useAuth';
import Icon from '../../shared/components/Icon';
import IconButton from '../../shared/components/IconButton';

const NAV_ITEMS = [
  { to: '/admin/stats', icon: 'bar_chart', label: 'Stats' },
  { to: '/admin/stores', icon: 'storefront', label: 'Stores' },
  { to: '/admin/customers', icon: 'group', label: 'Customers' },
  { to: '/admin/disputes', icon: 'flag', label: 'Disputes' },
  { to: '/admin/health', icon: 'monitor_heart', label: 'Health' },
];

const AdminShell = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
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
          <span className="text-body-sm text-text-secondary">Super admin</span>
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

export default AdminShell;
