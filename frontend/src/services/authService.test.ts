import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authService } from './authService';

describe('authService', () => {
  beforeEach(() => {
    vi.spyOn(crypto, 'randomUUID')
      .mockReturnValueOnce('00000000-0000-4000-8000-000000000001')
      .mockReturnValueOnce('00000000-0000-4000-8000-000000000002')
      .mockReturnValueOnce('00000000-0000-4000-8000-000000000003');
  });

  it('registers users, stores a safe session and supports case-insensitive login', async () => {
    const session = await authService.register('Ada', 'Ada@BitFlow.test', 'secret1');

    expect(session.token).toBe('session_00000000-0000-4000-8000-000000000002');
    expect(session.user).toMatchObject({
      id: 'user_00000000-0000-4000-8000-000000000001',
      name: 'Ada',
      email: 'Ada@BitFlow.test',
    });
    expect(session.user).not.toHaveProperty('passwordHash');
    expect(authService.getSession()?.user.email).toBe('Ada@BitFlow.test');

    authService.logout();
    await expect(authService.login('ada@bitflow.test', 'secret1')).resolves.toMatchObject({
      token: 'session_00000000-0000-4000-8000-000000000003',
      user: { name: 'Ada' },
    });
  });

  it('rejects duplicate registration and invalid login credentials', async () => {
    await authService.register('Ada', 'ada@bitflow.test', 'secret1');

    await expect(authService.register('Other Ada', 'ADA@bitflow.test', 'secret2')).rejects.toThrow('existiert bereits');
    await expect(authService.login('ada@bitflow.test', 'wrong')).rejects.toThrow('nicht korrekt');
    await expect(authService.login('missing@bitflow.test', 'secret1')).rejects.toThrow('nicht korrekt');
  });

  it('checks reset requests and updates the active profile session', async () => {
    const session = await authService.register('Ada', 'ada@bitflow.test', 'secret1');

    await expect(authService.resetPassword('ada@bitflow.test')).resolves.toBeUndefined();
    await expect(authService.resetPassword('missing@bitflow.test')).rejects.toThrow('kein Konto');

    const updated = await authService.updateProfile({ ...session.user, name: 'Ada Byron' });
    expect(updated.name).toBe('Ada Byron');
    expect(authService.getSession()?.user.name).toBe('Ada Byron');

    authService.logout();
    expect(authService.getSession()).toBeNull();
  });
});
