import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type NavigationGuard = () => boolean;

interface NavigationGuardContextValue {
  confirmNavigation: () => boolean;
  setNavigationGuard: (guard: NavigationGuard | null) => void;
}

const NavigationGuardContext = createContext<NavigationGuardContextValue>({
  confirmNavigation: () => true,
  setNavigationGuard: () => undefined,
});

export function NavigationGuardProvider({ children }: { children: ReactNode }) {
  const [activeGuard, setActiveGuard] = useState<NavigationGuard | null>(null);

  const setNavigationGuard = useCallback((guard: NavigationGuard | null) => {
    setActiveGuard(guard ? () => guard : null);
  }, []);

  const confirmNavigation = useCallback(() => activeGuard?.() ?? true, [activeGuard]);

  const value = useMemo(
    () => ({
      confirmNavigation,
      setNavigationGuard,
    }),
    [confirmNavigation, setNavigationGuard],
  );

  return <NavigationGuardContext.Provider value={value}>{children}</NavigationGuardContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNavigationGuard() {
  return useContext(NavigationGuardContext);
}
