import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const NAV_ITEM_CLASS = ({ isActive }) =>
  `flex items-center gap-xs px-sm lg:px-md py-sm rounded-lg font-body text-body-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
    isActive ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container-high'
  }`;

// Floating glassmorphic pill navbar shared by both dashboards - replaces the
// old persistent left sidebar. Icon-only nav items at md (tablet) to keep
// the pill from overflowing with the store owner's 6-item menu; icon+label
// once there's room at lg+. Hides on scroll down, reappears on scroll up
// (and whenever near the top), matching the reference navbar's behavior.
export default function DashboardShell({ brandTitle, brandSubtitle, navItems, footer, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const prevScrollPos = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      const scrollingUp = prevScrollPos.current > currentScrollPos;
      setVisible(scrollingUp || currentScrollPos < 80);
      prevScrollPos.current = currentScrollPos;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Derived, not synced via an effect: the dropdown never renders open while
  // the nav itself is scrolled-away, so it can't float mid-page detached
  // from its trigger.
  const dropdownOpen = menuOpen && visible;

  useEffect(() => {
    if (!dropdownOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [dropdownOpen]);

  return (
    <div className="min-h-screen bg-background text-on-surface font-body overflow-x-hidden">
      <nav
        className={`fixed top-3 left-1/2 -translate-x-1/2 z-40 w-[90%] rounded-2xl px-container-margin md:px-2xl py-sm md:py-md flex items-center gap-md bg-surface-container-lowest/70 backdrop-blur-lg border border-outline-variant shadow-lg transition-all duration-300 ${
          visible ? 'opacity-100 translate-y-0' : '-translate-y-24 opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col leading-tight min-w-0 shrink-0">
          <span className="font-display text-body-lg font-bold text-primary truncate max-w-[160px]">
            {brandTitle}
          </span>
          {brandSubtitle && (
            <span className="hidden lg:block text-body-sm text-on-surface-variant truncate">{brandSubtitle}</span>
          )}
        </div>

        {/* Desktop/tablet horizontal menu - icon-only at md, icon+label at lg+ */}
        <ul className="hidden md:flex items-center gap-1 flex-1 justify-end">
          {navItems.map(({ to, icon, label, end }) => (
            <li key={to}>
              <NavLink to={to} end={end} className={NAV_ITEM_CLASS} title={label}>
                <span className="material-symbols-outlined text-[20px]">{icon}</span>
                <span className="hidden lg:inline">{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        <DesktopLogout />

        {/* Mobile hamburger */}
        <div className="md:hidden flex flex-1 justify-end items-center">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={dropdownOpen ? 'Close menu' : 'Open menu'}
            className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors active:scale-90"
          >
            <span className="material-symbols-outlined">{dropdownOpen ? 'close' : 'menu'}</span>
          </button>
        </div>

        {/* Mobile dropdown */}
        {dropdownOpen && (
          <div className="md:hidden absolute top-full right-0 mt-sm min-w-[220px] max-w-[80vw] rounded-xl bg-surface-container-lowest border border-outline-variant shadow-lg p-lg flex flex-col gap-xs">
            <ul className="list-none flex flex-col gap-xs">
              {navItems.map(({ to, icon, label, end }) => (
                <li key={to}>
                  <NavLink to={to} end={end} onClick={() => setMenuOpen(false)} className={NAV_ITEM_CLASS}>
                    <span className="material-symbols-outlined text-[20px]">{icon}</span>
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
            {footer && <div className="pt-sm mt-xs border-t border-outline-variant">{footer}</div>}
          </div>
        )}
      </nav>

      <main className="pt-24 md:pt-28 px-container-margin md:px-2xl pb-3xl max-w-[1400px] mx-auto">{children}</main>
    </div>
  );
}

// Compact always-visible logout affordance for md+ - the full footer (name/
// email, etc.) still appears in the mobile dropdown where there's room.
function DesktopLogout() {
  const { logout } = useAuth();
  return (
    <button
      type="button"
      onClick={logout}
      aria-label="Log out"
      title="Log out"
      className="hidden md:flex w-9 h-9 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-error transition-colors active:scale-90"
    >
      <span className="material-symbols-outlined text-[20px]">logout</span>
    </button>
  );
}
