import { readStorage, writeStorage } from '../storage/localStorage';
import type { UserPreferences } from '../types/domain';

const PREFERENCES_KEY = 'bitflow.preferences';

export const defaultPreferences: UserPreferences = {
  theme: 'light',
  compactPanels: false,
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
      ...defaultPreferences,
      ...stored,
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
