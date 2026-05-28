import type { MouseEvent } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import bitflowLogo from '../assets/bitflow.svg';
import { Icon } from '../components/Icon';
import { useAuth } from '../modules/auth/AuthContext';
import { usePreferences } from '../modules/settings/PreferencesContext';
import { useNavigationGuard } from './NavigationGuardContext';

const navItems = [
  { to: '/projects', label: 'Projekte' },
  { to: '/settings', label: 'Einstellungen' },
  { to: '/profile', label: 'Profil' },
];

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { preferences, toggleTheme } = usePreferences();
  const { confirmNavigation } = useNavigationGuard();

  function navigateWithGuard(to: string) {
    if (location.pathname === to) return;
    if (confirmNavigation()) navigate(to);
  }

  function handleNavClick(event: MouseEvent<HTMLAnchorElement>, to: string) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    navigateWithGuard(to);
  }

  function handleLogout() {
    if (confirmNavigation()) logout();
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand-button" type="button" onClick={() => navigateWithGuard('/projects')} aria-label="BitFlow Startseite">
          <img className="brand-mark" src={bitflowLogo} alt="" aria-hidden="true" />
          <span>BitFlow</span>
        </button>

        <nav className="topbar-nav" aria-label="Hauptnavigation">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} onClick={(event) => handleNavClick(event, item.to)}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="topbar-actions">
          <button className="icon-button" type="button" onClick={toggleTheme} aria-label="Design wechseln" title="Design wechseln">
            <Icon name={preferences.theme === 'dark' ? 'sun' : 'moon'} />
          </button>
          <span className="user-chip">{user?.name ?? 'Benutzer'}</span>
          <button className="ghost-button" type="button" onClick={handleLogout}>
            Abmelden
          </button>
        </div>
      </header>

      <Outlet />
    </div>
  );
}
