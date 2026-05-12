import { readStorage, removeStorage, writeStorage } from '../storage/localStorage';
import type { AuthSession, StoredUser, User } from '../types/domain';
import { createId, nowIso } from '../utils/id';

const USERS_KEY = 'bitflow.users';
const SESSION_KEY = 'bitflow.session';

function hashPassword(password: string): string {
  return btoa(`bitflow:${password}`);
}

function publicUser(user: StoredUser): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

function readUsers(): StoredUser[] {
  return readStorage<StoredUser[]>(USERS_KEY, []);
}

function writeUsers(users: StoredUser[]): void {
  writeStorage(USERS_KEY, users);
}

export const authService = {
  getSession(): AuthSession | null {
    return readStorage<AuthSession | null>(SESSION_KEY, null);
  },

  async login(email: string, password: string): Promise<AuthSession> {
    const users = readUsers();
    const user = users.find((entry) => entry.email.toLowerCase() === email.toLowerCase());

    if (!user || user.passwordHash !== hashPassword(password)) {
      throw new Error('E-Mail oder Passwort ist nicht korrekt.');
    }

    const session: AuthSession = {
      token: createId('session'),
      user: publicUser(user),
      createdAt: nowIso(),
    };
    writeStorage(SESSION_KEY, session);
    return session;
  },

  async register(name: string, email: string, password: string): Promise<AuthSession> {
    const users = readUsers();
    const exists = users.some((entry) => entry.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      throw new Error('Für diese E-Mail existiert bereits ein Konto.');
    }

    const user: StoredUser = {
      id: createId('user'),
      name,
      email,
      passwordHash: hashPassword(password),
      createdAt: nowIso(),
    };

    writeUsers([...users, user]);

    const session: AuthSession = {
      token: createId('session'),
      user: publicUser(user),
      createdAt: nowIso(),
    };
    writeStorage(SESSION_KEY, session);
    return session;
  },

  async resetPassword(email: string): Promise<void> {
    const users = readUsers();
    const exists = users.some((entry) => entry.email.toLowerCase() === email.toLowerCase());
    if (!exists) {
      throw new Error('Für diese E-Mail wurde kein Konto gefunden.');
    }
  },

  async updateProfile(nextUser: User): Promise<User> {
    const users = readUsers();
    const nextUsers = users.map((entry) => (entry.id === nextUser.id ? { ...entry, ...nextUser } : entry));
    writeUsers(nextUsers);

    const session = this.getSession();
    if (session) {
      writeStorage(SESSION_KEY, { ...session, user: nextUser });
    }
    return nextUser;
  },

  logout(): void {
    removeStorage(SESSION_KEY);
  },
};
