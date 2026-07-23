'use client';

import { useCallback, useEffect, useState } from 'react';
import { clearSession, getStoredUser, saveSession } from '@/lib/auth';
import type { AuthUser } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getStoredUser());
    setLoading(false);
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
