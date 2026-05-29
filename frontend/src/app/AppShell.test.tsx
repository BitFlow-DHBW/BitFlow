import { useEffect } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppShell } from './AppShell';
import { NavigationGuardProvider, useNavigationGuard } from './NavigationGuardContext';

const shellMocks = vi.hoisted(() => ({
  logout: vi.fn(),
  toggleTheme: vi.fn(),
}));

vi.mock('../modules/auth/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Ada' },
    logout: shellMocks.logout,
  }),
}));

vi.mock('../modules/settings/PreferencesContext', () => ({
  usePreferences: () => ({
    preferences: { theme: 'light' },
    toggleTheme: shellMocks.toggleTheme,
  }),
}));

describe('AppShell', () => {
  beforeEach(() => {
    shellMocks.logout.mockClear();
    shellMocks.toggleTheme.mockClear();
  });

  it('renders navigation, outlet content and account actions', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/projects']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/projects" element={<main>Projects outlet</main>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'BitFlow Startseite' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Hauptnavigation' })).toBeInTheDocument();
    expect(screen.getByText('Projects outlet')).toBeInTheDocument();
    expect(screen.getByText('Ada')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Design wechseln' }));
    await user.click(screen.getByRole('button', { name: 'Abmelden' }));

    expect(shellMocks.toggleTheme).toHaveBeenCalled();
    expect(shellMocks.logout).toHaveBeenCalled();
  });

  it('passes guarded navbar navigation and logout requests to the active guard', async () => {
    const user = userEvent.setup();
    const guard = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(false).mockReturnValueOnce(true);

    function GuardedProjects() {
      const { setNavigationGuard } = useNavigationGuard();

      useEffect(() => {
        setNavigationGuard(guard);
        return () => setNavigationGuard(null);
      }, [setNavigationGuard]);

      return <main>Projects outlet</main>;
    }

    render(
      <NavigationGuardProvider>
        <MemoryRouter initialEntries={['/projects']}>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/projects" element={<GuardedProjects />} />
              <Route path="/settings" element={<main>Settings outlet</main>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </NavigationGuardProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Abmelden' }));
    expect(shellMocks.logout).not.toHaveBeenCalled();
    expect(guard).toHaveBeenLastCalledWith(expect.objectContaining({ kind: 'logout' }));

    await user.click(screen.getByRole('link', { name: 'Einstellungen' }));
    expect(screen.getByText('Projects outlet')).toBeInTheDocument();
    expect(guard).toHaveBeenLastCalledWith(expect.objectContaining({ kind: 'navigate', target: '/settings' }));

    await user.click(screen.getByRole('link', { name: 'Einstellungen' }));
    expect(screen.getByText('Settings outlet')).toBeInTheDocument();
    expect(guard).toHaveBeenCalledTimes(3);
  });
});
