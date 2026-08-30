'use client';

import { ReactNode, useCallback, useMemo, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { LocaleContext } from '@/hooks/useLocale';
import { ThemeProvider } from '@/hooks/useTheme';
import { getDefaultLocale, persistLocale, readStoredLocale, type Locale } from '@/lib/i18n';
import { env } from '@/lib/constants';

function initialLocale(): Locale {
  if (typeof window === 'undefined') return getDefaultLocale();
  return readStoredLocale();
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    persistLocale(next);
  }, []);

  const localeValue = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

  const googleId = env.googleClientId.trim();

  const inner = (
    <ThemeProvider>
      <LocaleContext.Provider value={localeValue}>
        <div className="min-h-screen bg-surface-page text-ink">
          {children}
          <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
        </div>
      </LocaleContext.Provider>
    </ThemeProvider>
  );

  if (!googleId) {
    return inner;
  }

  return <GoogleOAuthProvider clientId={googleId}>{inner}</GoogleOAuthProvider>;
}
