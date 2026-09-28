import { NavLink, useLocation } from 'react-router-dom';
import Icon from './Icon';

const MobileNavItem = ({ to, icon, label, badgeCount }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `nav-item relative flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-button py-1.5 transition-colors duration-150 ${
        isActive ? 'bg-primary-tint text-primary' : 'text-text-muted'
      }`
    }
  >
    {({ isActive }) => (
      <>
        <Icon name={icon} isFilled={isActive} />
        <span className={`text-[10.5px] leading-none ${isActive ? 'font-semibold' : 'font-medium'}`}>{label}</span>
        {Boolean(badgeCount) && (
          <span className="absolute right-3 top-0.5 rounded-pill bg-accent px-1.5 text-[10px] font-semibold text-accent-text">
            {badgeCount}
          </span>
        )}
      </>
    )}
  </NavLink>
);

const RailNavItem = ({ to, icon, label, badgeCount }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `nav-item flex h-11 items-center gap-3 rounded-button px-3.5 text-body transition-colors duration-150 ${
        isActive ? 'bg-primary-tint text-primary' : 'text-text-secondary hover:bg-divider hover:text-text-primary'
      }`
    }
  >
    {({ isActive }) => (
      <>
        <Icon name={icon} isFilled={isActive} />
        <span className="flex-1">{label}</span>
        {Boolean(badgeCount) && (
          <span className="rounded-pill bg-accent px-1.5 text-[10px] font-semibold text-accent-text">
            {badgeCount}
          </span>
        )}
      </>
    )}
  </NavLink>
);

// One shell per role - bottom nav under 960px, a left side rail at/above it.
// Nav is always visible; no route ever renders outside this shell, so there
// is nothing to hide it (Till Mode included).
// headerAction renders on the right of the mobile header only - the rail
// footer covers the same job (e.g. log out) at desktop widths.
//
// The shell is locked to the viewport (100dvh) and <main> is the scroll
// container, so a page can size itself with h-full and give long lists their
// own inner scroll area (see ScrollPanel) while headers/filters stay put.
const AppShell = ({ navItems, railFooter, headerAction, children }) => {
  const location = useLocation();
  const activeItem = navItems.find((item) => location.pathname.startsWith(item.to));

  return (
    <div className="h-[100dvh] rail:flex">
      <aside className="hidden rail:flex rail:w-[236px] rail:flex-none rail:flex-col rail:overflow-y-auto rail:border-r rail:border-border rail:bg-surface">
        <div className="glass-chrome flex h-[72px] items-center gap-2 border-b border-border px-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-button bg-primary text-on-primary">
            <Icon name="loyalty" style={{ fontSize: '1rem' }} />
          </span>
          <span className="text-card-title text-text-primary">LoyaltyLabs</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map((item) => (
            <RailNavItem key={item.to} {...item} />
          ))}
        </nav>
        {railFooter && <div className="mt-auto p-3">{railFooter}</div>}
      </aside>

      <div className="flex h-full min-w-0 flex-1 flex-col">
        <header className="glass-chrome z-20 flex min-h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-1.5 rail:hidden">
          <span className="text-section text-text-primary">{activeItem?.label}</span>
          {headerAction}
        </header>

        {/* Bottom padding clears the fixed mobile nav bar. */}
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-24 rail:pb-0">{children}</main>

        <nav className="glass-chrome fixed inset-x-0 bottom-0 z-30 flex gap-0.5 border-t border-border px-2 pb-[env(safe-area-inset-bottom)] pt-1.5 rail:hidden">
          {navItems.map((item) => (
            <MobileNavItem key={item.to} {...item} />
          ))}
        </nav>
      </div>
    </div>
  );
};

export default AppShell;
