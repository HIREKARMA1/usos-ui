'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { LocaleContext } from '@/hooks/useLocale';
import { getDefaultLocale, persistLocale, readStoredLocale, type Locale } from '@/lib/i18n';
import { themeToCssVariables } from '@/theme';
import { env } from '@/lib/constants';

export function AppProviders({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getDefaultLocale());

  useEffect(() => {
    setLocaleState(readStoredLocale());
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    persistLocale(next);
  };

  const cssVars = useMemo(() => themeToCssVariables(), []);
  const googleId = env.googleClientId.trim();

  const inner = (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <div style={cssVars as React.CSSProperties} className="min-h-screen">
        {children}
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      </div>
    </LocaleContext.Provider>
  );

  if (!googleId) {
    return inner;
  }

  return <GoogleOAuthProvider clientId={googleId}>{inner}</GoogleOAuthProvider>;
}
