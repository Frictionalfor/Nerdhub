import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { HealthResponse } from '@nerdhub/contracts';

interface OnlineState {
  online: boolean;
  health: HealthResponse | null;
  error: string | null;
}

const OnlineContext = createContext<
  | {
      state: OnlineState;
      setOnline: (online: boolean) => void;
      setHealth: (health: HealthResponse | null) => void;
      setError: (error: string | null) => void;
    }
  | undefined
>(undefined);

export function OnlineProvider({ children }: { children: React.ReactNode }) {
  const [online, setOnlineState] = useState<boolean>(true);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setOnline = useCallback((next: boolean) => {
    setOnlineState(next);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const value = useMemo(
    () => ({
      state: { online, health, error },
      setOnline,
      setHealth,
      setError,
    }),
    [online, health, error, setOnline]
  );

  return <OnlineContext.Provider value={value}>{children}</OnlineContext.Provider>;
}

export function useOnline() {
  const ctx = useContext(OnlineContext);
  if (!ctx) {
    throw new Error('useOnline must be used within an OnlineProvider');
  }
  return ctx;
}
