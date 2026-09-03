'use client';

import { useCallback, useEffect, useState } from 'react';
import { clearSession, getStoredToken, getStoredUser, saveSession } from '@/lib/auth';
import { api } from '@/lib/api';
import type { AuthUser } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const token = getStoredToken();
      const stored = getStoredUser();

      // Orphaned user blob without a token → treat as logged out (was causing admin 403s).
      if (!token) {
        if (stored) clearSession();
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const me = await api.getMe();
        if (cancelled) return;
        saveSession(token, me);
        setUser(me);
      } catch {
        if (cancelled) return;
        clearSession();
        setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const loginSuccess = useCallback((token: string, next: AuthUser) => {
    saveSession(token, next);
    setUser(next);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  return { user, loading, logout, loginSuccess, isAuthenticated: !!user, setUser };
}
