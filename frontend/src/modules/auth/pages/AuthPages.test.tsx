import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { authService } from '../../../services/authService';
import { AuthProvider } from '../AuthContext';
import { LoginPage } from './LoginPage';
import { ProfilePage } from './ProfilePage';
import { RegisterPage } from './RegisterPage';
import { ResetPasswordPage } from './ResetPasswordPage';

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
    renderAuthPage(<RegisterPage />);

    await user.type(screen.getByLabelText('Name'), 'Ada');
    await user.type(screen.getByLabelText('E-Mail'), 'ada@bitflow.test');
    await user.type(screen.getByLabelText('Passwort'), 'secret1');
    await user.click(screen.getByRole('button', { name: 'Konto anlegen' }));

    await waitFor(() => expect(authService.getSession()?.user.email).toBe('ada@bitflow.test'));
  });

  it('shows login errors and succeeds with valid credentials', async () => {
    const user = userEvent.setup();
    await authService.register('Ada', 'ada@bitflow.test', 'secret1');
    authService.logout();

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
    await authService.register('Ada', 'ada@bitflow.test', 'secret1');
    renderAuthPage(<ResetPasswordPage />);

    await user.type(screen.getByLabelText('E-Mail'), 'ada@bitflow.test');
    await user.click(screen.getByRole('button', { name: 'Reset-Link anfordern' }));
    expect(await screen.findByText(/Mock-Flow erfolgreich/)).toBeInTheDocument();

    await user.clear(screen.getByLabelText('E-Mail'));
    await user.type(screen.getByLabelText('E-Mail'), 'missing@bitflow.test');
    await user.click(screen.getByRole('button', { name: 'Reset-Link anfordern' }));
    expect(await screen.findByText(/E-Mail wurde kein Konto gefunden/)).toBeInTheDocument();
  });

  it('updates the current profile display name', async () => {
    const user = userEvent.setup();
    await authService.register('Ada', 'ada@bitflow.test', 'secret1');
    renderAuthPage(<ProfilePage />);

    await user.clear(screen.getByLabelText('Anzeigename'));
    await user.type(screen.getByLabelText('Anzeigename'), 'Ada Byron');
    await user.click(screen.getByRole('button', { name: 'Profil speichern' }));

    expect(await screen.findByText('Profil gespeichert.')).toBeInTheDocument();
    expect(authService.getSession()?.user.name).toBe('Ada Byron');
  });
});
