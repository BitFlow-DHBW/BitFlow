import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../modules/auth/AuthContext';
import { usePreferences } from '../modules/settings/PreferencesContext';

export function AppShell() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { preferences, toggleTheme } = usePreferences();

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand-button" type="button" onClick={() => navigate('/projects')} aria-label="BitFlow Home">
          <span className="brand-mark">BF</span>
          <span>BitFlow</span>
        </button>

        <nav className="topbar-nav" aria-label="Hauptnavigation">
          <NavLink to="/projects">Projekte</NavLink>
          <NavLink to="/settings">Einstellungen</NavLink>
          <NavLink to="/profile">Profil</NavLink>
        </nav>

        <div className="topbar-actions">
          <button className="icon-button" type="button" onClick={toggleTheme} aria-label="Theme wechseln">
            {preferences.theme === 'dark' ? '☼' : '◐'}
          </button>
          <span className="user-chip">{user?.name ?? 'User'}</span>
          <button className="ghost-button" type="button" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <Outlet />
    </div>
  );
}
