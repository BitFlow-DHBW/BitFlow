import { apiService } from './apiService';
import { readSession, removeSession, writeSession } from './sessionStore';
import type { AuthSession, User } from '../types/domain';

export const authService = {
  getSession(): AuthSession | null {
    return readSession();
  },

  async login(email: string, password: string): Promise<AuthSession> {
    const { data: session } = await apiService.post<AuthSession>('/auth/login', { email, password });
    writeSession(session);
    return session;
  },

  async register(name: string, email: string, password: string): Promise<AuthSession> {
    const { data: session } = await apiService.post<AuthSession>('/auth/register', { name, email, password });
    writeSession(session);
    return session;
  },

  async resetPassword(email: string): Promise<void> {
    await apiService.post<void>('/auth/reset-password', { email });
  },

  async updateProfile(nextUser: User): Promise<User> {
    const { data: user } = await apiService.put<User>('/auth/me', {
      name: nextUser.name,
      email: nextUser.email,
    });

    const session = this.getSession();
    if (session) {
      writeSession({ ...session, user });
    }

    return user;
  },

  logout(): void {
    void apiService.post<void>('/auth/logout').catch(() => undefined);
    removeSession();
  },
};
