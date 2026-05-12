import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { preferencesService } from '../../services/preferencesService';
import type { UserPreferences } from '../../types/domain';

interface PreferencesContextValue {
  preferences: UserPreferences;
  setPreferences: (preferences: UserPreferences) => void;
  toggleTheme: () => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferencesState] = useState<UserPreferences>(() => preferencesService.getPreferences());

  const setPreferences = (next: UserPreferences) => {
    setPreferencesState(next);
    preferencesService.savePreferences(next);
  };

  useEffect(() => {
    document.documentElement.dataset.theme = preferences.theme;
  }, [preferences.theme]);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      preferences,
      setPreferences,
      toggleTheme() {
        setPreferences({
          ...preferences,
          theme: preferences.theme === 'dark' ? 'light' : 'dark',
        });
      },
    }),
    [preferences],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used inside PreferencesProvider');
  }
  return context;
}
