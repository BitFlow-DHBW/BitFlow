import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AppShell } from './AppShell';

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

    expect(screen.getByRole('button', { name: 'BitFlow Home' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Hauptnavigation' })).toBeInTheDocument();
    expect(screen.getByText('Projects outlet')).toBeInTheDocument();
    expect(screen.getByText('Ada')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Theme wechseln' }));
    await user.click(screen.getByRole('button', { name: 'Logout' }));

    expect(shellMocks.toggleTheme).toHaveBeenCalled();
    expect(shellMocks.logout).toHaveBeenCalled();
  });
});
