'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type AuthMode = 'login' | 'register';

export type AuthGateOptions = {
  mode?: AuthMode;
  packageCode?: string;
  refCode?: string;
  next?: string;
};

type AuthGateContextValue = {
  open: boolean;
  mode: AuthMode;
  packageCode?: string;
  refCode?: string;
  next?: string;
  openAuth: (options?: AuthGateOptions) => void;
  closeAuth: () => void;
  setMode: (mode: AuthMode) => void;
};

const AuthGateContext = createContext<AuthGateContextValue | null>(null);

export function AuthGateProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>('login');
  const [packageCode, setPackageCode] = useState<string | undefined>();
  const [refCode, setRefCode] = useState<string | undefined>();
  const [next, setNext] = useState<string | undefined>();

  const openAuth = useCallback((options?: AuthGateOptions) => {
    setMode(options?.mode || 'login');
    setPackageCode(options?.packageCode);
    setRefCode(options?.refCode);
    setNext(options?.next);
    setOpen(true);
  }, []);

  const closeAuth = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAuth();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, closeAuth]);

  const value = useMemo(
    () => ({ open, mode, packageCode, refCode, next, openAuth, closeAuth, setMode }),
    [open, mode, packageCode, refCode, next, openAuth, closeAuth]
  );

  return <AuthGateContext.Provider value={value}>{children}</AuthGateContext.Provider>;
}

export function useAuthGate() {
  const ctx = useContext(AuthGateContext);
  if (!ctx) {
    throw new Error('useAuthGate must be used within AuthGateProvider');
  }
  return ctx;
}
