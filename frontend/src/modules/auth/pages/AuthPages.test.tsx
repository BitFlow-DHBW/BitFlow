import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { apiService } from '../../../services/apiService';
import { authService } from '../../../services/authService';
import { testUser } from '../../../test/builders';
import type { AuthSession } from '../../../types/domain';
import { AuthProvider } from '../AuthContext';
import { LoginPage } from './LoginPage';
import { ProfilePage } from './ProfilePage';
import { RegisterPage } from './RegisterPage';
import { ResetPasswordPage } from './ResetPasswordPage';

function testSession(overrides: Partial<AuthSession> = {}): AuthSession {
  const user = testUser({ name: 'Ada', email: 'ada@bitflow.test' });
  return {
    token: 'session_test',
    user,
    createdAt: user.createdAt,
    ...overrides,
  };
}

function renderAuthPage(page: React.ReactNode) {
  return render(
    <MemoryRouter>
      <AuthProvider>{page}</AuthProvider>
    </MemoryRouter>,
  );
}

describe('auth pages', () => {
  it('registers a user from the registration form', async () => {
    const user = userEvent.setup();
    vi.spyOn(apiService, 'post').mockResolvedValueOnce({ data: testSession(), status: 201 });
    renderAuthPage(<RegisterPage />);

    await user.type(screen.getByLabelText('Name'), 'Ada');
    await user.type(screen.getByLabelText('E-Mail'), 'ada@bitflow.test');
    await user.type(screen.getByLabelText('Passwort'), 'secret1');
    await user.click(screen.getByRole('button', { name: 'Konto anlegen' }));

    await waitFor(() => expect(authService.getSession()?.user.email).toBe('ada@bitflow.test'));
  });

  it('shows login errors and succeeds with valid credentials', async () => {
    const user = userEvent.setup();
    vi.spyOn(apiService, 'post')
      .mockRejectedValueOnce(new Error('E-Mail oder Passwort ist nicht korrekt.'))
      .mockResolvedValueOnce({ data: testSession(), status: 200 });

    renderAuthPage(<LoginPage />);

    await user.type(screen.getByLabelText('E-Mail'), 'ada@bitflow.test');
    await user.type(screen.getByLabelText('Passwort'), 'wrongpw');
    await user.click(screen.getByRole('button', { name: 'Login' }));
    expect(await screen.findByText('E-Mail oder Passwort ist nicht korrekt.')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Passwort'));
    await user.type(screen.getByLabelText('Passwort'), 'secret1');
    await user.click(screen.getByRole('button', { name: 'Login' }));
    await waitFor(() => expect(authService.getSession()?.user.name).toBe('Ada'));
  });

  it('handles reset-password success and unknown-account errors', async () => {
    const user = userEvent.setup();
    vi.spyOn(apiService, 'post')
      .mockResolvedValueOnce({ data: undefined, status: 204 })
      .mockRejectedValueOnce(new Error('Fuer diese E-Mail wurde kein Konto gefunden.'));
    renderAuthPage(<ResetPasswordPage />);

    await user.type(screen.getByLabelText('E-Mail'), 'ada@bitflow.test');
    await user.click(screen.getByRole('button', { name: 'Reset-Link anfordern' }));
    expect(await screen.findByText(/Anfrage erfolgreich/)).toBeInTheDocument();

    await user.clear(screen.getByLabelText('E-Mail'));
    await user.type(screen.getByLabelText('E-Mail'), 'missing@bitflow.test');
    await user.click(screen.getByRole('button', { name: 'Reset-Link anfordern' }));
    expect(await screen.findByText(/E-Mail wurde kein Konto gefunden/)).toBeInTheDocument();
  });

  it('updates the current profile display name', async () => {
    const user = userEvent.setup();
    const session = testSession();
    window.localStorage.setItem('bitflow.session', JSON.stringify(session));
    vi.spyOn(apiService, 'put').mockResolvedValueOnce({
      data: { ...session.user, name: 'Ada Byron' },
      status: 200,
    });

    renderAuthPage(<ProfilePage />);

    await user.clear(screen.getByLabelText('Anzeigename'));
    await user.type(screen.getByLabelText('Anzeigename'), 'Ada Byron');
    await user.click(screen.getByRole('button', { name: 'Profil speichern' }));

    expect(await screen.findByText('Profil gespeichert.')).toBeInTheDocument();
    expect(authService.getSession()?.user.name).toBe('Ada Byron');
  });
});
