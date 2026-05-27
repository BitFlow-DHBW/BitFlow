import { describe, expect, it, vi } from 'vitest';
import { apiService } from './apiService';
import { authService } from './authService';
import { testUser } from '../test/builders';
import type { AuthSession } from '../types/domain';

function testSession(overrides: Partial<AuthSession> = {}): AuthSession {
  const user = testUser();
  return {
    token: 'session_test',
    user,
    createdAt: user.createdAt,
    ...overrides,
  };
}

describe('authService', () => {
  it('registers users through the backend and stores a safe session', async () => {
    const session = testSession({ user: testUser({ name: 'Ada', email: 'ada@bitflow.test' }) });
    const postSpy = vi.spyOn(apiService, 'post').mockResolvedValueOnce({ data: session, status: 201 });

    await expect(authService.register('Ada', 'ada@bitflow.test', 'secret1')).resolves.toEqual(session);

    expect(postSpy).toHaveBeenCalledWith('/auth/register', {
      name: 'Ada',
      email: 'ada@bitflow.test',
      password: 'secret1',
    });
    expect(authService.getSession()).toEqual(session);
    expect(authService.getSession()?.user).not.toHaveProperty('passwordHash');
  });

  it('logs in users and forwards backend credential errors', async () => {
    const session = testSession({ token: 'session_login' });
    const postSpy = vi
      .spyOn(apiService, 'post')
      .mockRejectedValueOnce(new Error('E-Mail oder Passwort ist nicht korrekt.'))
      .mockResolvedValueOnce({ data: session, status: 200 });

    await expect(authService.login('ada@bitflow.test', 'wrong')).rejects.toThrow('nicht korrekt');
    await expect(authService.login('ada@bitflow.test', 'secret1')).resolves.toEqual(session);

    expect(postSpy).toHaveBeenLastCalledWith('/auth/login', {
      email: 'ada@bitflow.test',
      password: 'secret1',
    });
    expect(authService.getSession()).toEqual(session);
  });

  it('checks reset requests and updates the active profile session', async () => {
    const session = testSession();
    window.localStorage.setItem('bitflow.session', JSON.stringify(session));

    vi.spyOn(apiService, 'post')
      .mockResolvedValueOnce({ data: undefined, status: 204 })
      .mockRejectedValueOnce(new Error('Fuer diese E-Mail wurde kein Konto gefunden.'));
    vi.spyOn(apiService, 'put').mockResolvedValueOnce({
      data: { ...session.user, name: 'Ada Byron' },
      status: 200,
    });

    await expect(authService.resetPassword('ada@bitflow.test')).resolves.toBeUndefined();
    await expect(authService.resetPassword('missing@bitflow.test')).rejects.toThrow('kein Konto');

    const updated = await authService.updateProfile({ ...session.user, name: 'Ada Byron' });
    expect(updated.name).toBe('Ada Byron');
    expect(authService.getSession()?.user.name).toBe('Ada Byron');
  });

  it('logs out locally and notifies the backend', () => {
    const session = testSession();
    const postSpy = vi.spyOn(apiService, 'post').mockResolvedValue({ data: undefined, status: 204 });
    window.localStorage.setItem('bitflow.session', JSON.stringify(session));

    authService.logout();

    expect(authService.getSession()).toBeNull();
    expect(postSpy).toHaveBeenCalledWith('/auth/logout');
  });
});
