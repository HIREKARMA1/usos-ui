'use client';

import { Suspense, useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import { useAuthGate, type AuthMode } from '@/hooks/useAuthGate';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Spinner } from '@/components/ui/Spinner';
import { useContent } from '@/hooks/useContent';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { cn } from '@/lib/cn';

function AuthSheetInner() {
  const { open, mode, packageCode, refCode, next, closeAuth, setMode, openAuth } = useAuthGate();
  const common = useContent('common');
  const auth = useContent('auth');
  const reduceMotion = useReducedMotion();
  const pathname = usePathname();
  const router = useRouter();
  const search = useSearchParams();

  // Deep-link / legacy routes → open sheet without a separate auth page
  useEffect(() => {
    const authParam = search.get('auth') as AuthMode | null;
    if (authParam === 'login' || authParam === 'register') {
      openAuth({
        mode: authParam,
        packageCode: search.get('package') || undefined,
        refCode: search.get('ref') || undefined,
        next: search.get('next') || undefined,
      });
      router.replace('/');
      return;
    }

    if (pathname === '/login') {
      openAuth({ mode: 'login', next: search.get('next') || undefined });
      router.replace('/');
      return;
    }

    if (pathname === '/register') {
      openAuth({
        mode: 'register',
        packageCode: search.get('package') || undefined,
        refCode: search.get('ref') || undefined,
      });
      // Preserve payment callback query on home if needed
      const payment = search.get('payment');
      const message = search.get('message');
      if (payment) {
        const q = new URLSearchParams({ payment });
        if (message) q.set('message', message);
        router.replace(`/?${q.toString()}`);
      } else {
        router.replace('/');
      }
    }
  }, [pathname, search, openAuth, router]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[80] flex justify-end" role="dialog" aria-modal="true">
          <motion.button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-[#0f1622]/65 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.25 }}
            onClick={closeAuth}
          />

          <motion.aside
            initial={reduceMotion ? { opacity: 1 } : { x: '100%', opacity: 0.6 }}
            animate={{ x: 0, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { x: '100%', opacity: 0.6 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.9 }}
            className="relative z-10 flex h-full w-full max-w-lg flex-col overflow-hidden border-l border-white/10 bg-[#0f1622] shadow-elevated sm:max-w-xl"
          >
            <div
              className="pointer-events-none absolute -right-16 top-10 h-56 w-56 rounded-full blur-[90px]"
              style={{ background: 'rgba(0,162,229,0.22)' }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -left-10 bottom-24 h-48 w-48 rounded-full blur-[80px]"
              style={{ background: 'rgba(27,82,164,0.28)' }}
              aria-hidden
            />

            <header className="relative flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <BrandLogo light showFull />
              <button
                type="button"
                onClick={closeAuth}
                className="rounded-lg border border-white/15 p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
                aria-label="Close auth"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="relative px-5 pt-4">
              <div className="grid grid-cols-2 rounded-xl border border-white/10 bg-white/[0.04] p-1">
                {(
                  [
                    { id: 'login' as const, label: common.nav.login },
                    { id: 'register' as const, label: common.nav.register },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setMode(tab.id)}
                    className={cn(
                      'rounded-lg px-3 py-2.5 text-sm font-semibold transition',
                      mode === tab.id
                        ? 'bg-sky text-[#0f1622] shadow-sm'
                        : 'text-white/65 hover:text-white'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-[12.5px] leading-snug text-white/55">
                {mode === 'login' ? auth.login.subtitle : auth.register.subtitle}
              </p>
            </div>

            <div className="relative min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <Suspense fallback={<Spinner />}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={mode}
                    initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                    transition={{ duration: 0.22 }}
                  >
                    {mode === 'login' ? (
                      <LoginForm
                        embedded
                        nextPath={next}
                        onSwitchMode={() => setMode('register')}
                        onClose={closeAuth}
                      />
                    ) : (
                      <RegisterForm
                        embedded
                        initialPackage={packageCode}
                        initialRef={refCode}
                        onSwitchMode={() => setMode('login')}
                        onClose={closeAuth}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </Suspense>
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

export function AuthSheet() {
  return (
    <Suspense fallback={null}>
      <AuthSheetInner />
    </Suspense>
  );
}
