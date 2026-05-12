import { createContext, useContext, useMemo, useState } from 'react';
import { authService } from '../../services/authService';
import type { AuthSession, User } from '../../types/domain';

interface AuthContextValue {
  session: AuthSession | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (user: User) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => authService.getSession());

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isAuthenticated: Boolean(session),
      async login(email, password) {
        setSession(await authService.login(email, password));
      },
      async register(name, email, password) {
        setSession(await authService.register(name, email, password));
      },
      async resetPassword(email) {
        await authService.resetPassword(email);
      },
      async updateProfile(user) {
        const nextUser = await authService.updateProfile(user);
        setSession((current) => (current ? { ...current, user: nextUser } : current));
      },
      logout() {
        authService.logout();
        setSession(null);
      },
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
