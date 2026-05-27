import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { apiService } from '../../services/apiService';
import { testUser } from '../../test/builders';
import { AuthProvider, useAuth } from './AuthContext';

function AuthHarness() {
  const { user, isAuthenticated, login, logout, register, resetPassword, updateProfile } = useAuth();

  return (
    <div>
      <output aria-label="authenticated">{String(isAuthenticated)}</output>
      <output aria-label="user">{user?.name ?? 'none'}</output>
      <button type="button" onClick={() => register('Ada', 'ada@bitflow.test', 'secret1')}>
        register
      </button>
      <button type="button" onClick={() => login('ada@bitflow.test', 'secret1')}>
        login
      </button>
      <button type="button" onClick={() => resetPassword('ada@bitflow.test')}>
        reset
      </button>
      <button type="button" onClick={() => user && updateProfile({ ...user, name: 'Grace' })}>
        rename
      </button>
      <button type="button" onClick={logout}>
        logout
      </button>
    </div>
  );
}

describe('AuthContext', () => {
  it('exposes registration, login, reset, profile update and logout flows', async () => {
    const user = userEvent.setup();
    const ada = testUser({ name: 'Ada', email: 'ada@bitflow.test' });
    const session = { token: 'session_test', user: ada, createdAt: ada.createdAt };

    vi.spyOn(apiService, 'post')
      .mockResolvedValueOnce({ data: session, status: 201 })
      .mockResolvedValueOnce({ data: undefined, status: 204 })
      .mockResolvedValueOnce({ data: undefined, status: 204 })
      .mockResolvedValueOnce({ data: session, status: 200 });
    vi.spyOn(apiService, 'put').mockResolvedValueOnce({
      data: { ...ada, name: 'Grace' },
      status: 200,
    });

    render(
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>,
    );

    expect(screen.getByLabelText('authenticated')).toHaveTextContent('false');

    await user.click(screen.getByRole('button', { name: 'register' }));
    await waitFor(() => expect(screen.getByLabelText('user')).toHaveTextContent('Ada'));

    await user.click(screen.getByRole('button', { name: 'rename' }));
    await waitFor(() => expect(screen.getByLabelText('user')).toHaveTextContent('Grace'));

    await user.click(screen.getByRole('button', { name: 'reset' }));
    await user.click(screen.getByRole('button', { name: 'logout' }));
    expect(screen.getByLabelText('authenticated')).toHaveTextContent('false');

    await user.click(screen.getByRole('button', { name: 'login' }));
    await waitFor(() => expect(screen.getByLabelText('authenticated')).toHaveTextContent('true'));
  });

  it('throws a clear error outside the provider', () => {
    function BrokenConsumer() {
      useAuth();
      return null;
    }

    expect(() => render(<BrokenConsumer />)).toThrow('useAuth must be used inside AuthProvider');
  });
});
