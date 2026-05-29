import { readStorage, writeStorage } from '../storage/localStorage';
import type { UserPreferences } from '../types/domain';

const PREFERENCES_KEY = 'bitflow.preferences';

export const defaultPreferences: UserPreferences = {
  theme: 'light',
  showSignalValues: true,
  shortcuts: {
    editMode: 'E',
    simulateMode: 'S',
    deleteSelection: 'Delete',
  },
};

export const preferencesService = {
  getPreferences(): UserPreferences {
    const stored = readStorage<Partial<UserPreferences>>(PREFERENCES_KEY, defaultPreferences);

    return {
      theme: stored.theme ?? defaultPreferences.theme,
      showSignalValues: stored.showSignalValues ?? defaultPreferences.showSignalValues,
      shortcuts: {
        ...defaultPreferences.shortcuts,
        ...stored.shortcuts,
      },
    };
  },

  savePreferences(preferences: UserPreferences): void {
    writeStorage(PREFERENCES_KEY, preferences);
  },
};
