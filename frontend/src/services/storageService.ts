import type { Circuit } from "../types/circuit";

const KEY_PREFIX = "bitflow:circuit:";

export const StorageService = {
  saveLocal(name: string, circuit: Circuit) {
    const key = KEY_PREFIX + name;
    const payload = { ...circuit, version: (circuit.version || 0) + 1 };
    localStorage.setItem(key, JSON.stringify(payload));
  },

  loadLocal(name: string): Circuit | null {
    const key = KEY_PREFIX + name;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Circuit;
    } catch {
      return null;
    }
  },

  listLocal(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(KEY_PREFIX)) keys.push(k.replace(KEY_PREFIX, ""));
    }
    return keys;
  },

  deleteLocal(name: string) {
    localStorage.removeItem(KEY_PREFIX + name);
  }
};
