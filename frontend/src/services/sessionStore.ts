import { readStorage, removeStorage, writeStorage } from '../storage/localStorage';
import type { AuthSession } from '../types/domain';

const SESSION_KEY = 'bitflow.session';

export function readSession(): AuthSession | null {
  return readStorage<AuthSession | null>(SESSION_KEY, null);
}

export function writeSession(session: AuthSession): void {
  writeStorage(SESSION_KEY, session);
}

export function removeSession(): void {
  removeStorage(SESSION_KEY);
}

export function readSessionToken(): string | null {
  return readSession()?.token ?? null;
}
