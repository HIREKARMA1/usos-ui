'use client';

import Link from 'next/link';
import { ReactNode, useEffect, useState } from 'react';
import { ArrowUp, Menu, UserCircle, X, MapPin } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { BrandLogo } from './BrandLogo';
import { BrandStripe } from '@/components/ui/BrandStripe';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useContent } from '@/hooks/useContent';
import { useAuth } from '@/hooks/useAuth';
import { useAuthGate } from '@/hooks/useAuthGate';
import { roleHome } from '@/lib/api';
import { cn } from '@/lib/cn';

export function AuthShell({ children }: { children: ReactNode }) {
  const common = useContent('common');
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-surface-soft">
      <div className="hero-glow pointer-events-none absolute -right-24 -top-24 h-[28rem] w-[28rem] rounded-full blur-[100px]" aria-hidden />
      <BrandStripe />
      <header className="relative z-10 flex items-center justify-between px-4 py-4 sm:px-8">
        <BrandLogo showFull />
        <LanguageSwitcher />
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">{children}</main>
      <footer className="relative z-10 px-4 py-6 text-center text-xs text-ink-muted">
        {common.brand.poweredBy} · {common.footer.rights}
      </footer>
    </div>
  );
}

const navLinks = [
  { href: '/#features', key: 'features' as const },
  { href: '/#how', key: 'howItWorks' as const },
  { href: '/#packages', key: 'packages' as const },
  { href: '/shop', key: 'shop' as const, isRoute: true },
];

export function PublicHeader() {
  const common = useContent('common');
  const { user, loading, isAuthenticated } = useAuth();
  const { openAuth } = useAuthGate();
  const dashboardHref = user ? roleHome(user.role) : '/user';
  const profileHref = user?.role === 'admin' ? '/admin' : '/user/profile';
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40">
        <BrandStripe className="pointer-events-auto" />
        <div className="page-container pointer-events-none pt-2.5 sm:pt-3">
          <div
            className={cn(
              'pointer-events-auto flex items-center gap-2 rounded-2xl border px-2.5 py-2 shadow-elevated transition-all duration-300 sm:gap-3 sm:px-3',
              scrolled
                ? 'border-white/15 bg-[#0f1622]/88 backdrop-blur-xl'
                : 'border-white/10 bg-[#0f1622]/55 backdrop-blur-md'
            )}
          >
            <BrandLogo light className="shrink-0 pl-1" />

            {/* Floating center dock */}
            <nav className="mx-auto hidden items-center rounded-full border border-white/10 bg-white/[0.06] p-1 md:flex">
              {navLinks.map((item) => {
                const label =
                  item.key === 'shop' ? common.nav.shop || 'Shop' : common.nav[item.key];
                const className =
                  'rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold text-white/70 transition hover:bg-white/10 hover:text-white';
                return item.isRoute ? (
                  <Link key={item.href} href={item.href} className={className}>
                    {label}
                  </Link>
                ) : (
                  <a key={item.href} href={item.href} className={className}>
                    {label}
                  </a>
                );
              })}
            </nav>

            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              <LanguageSwitcher tone="dark" className="hidden sm:inline-flex" />

              {!loading && isAuthenticated && user ? (
                <div className="flex items-center gap-1.5">
                  <Link
                    href={dashboardHref}
                    className="hidden rounded-full px-3 py-2 text-[12.5px] font-semibold text-white/75 transition hover:bg-white/10 hover:text-white sm:inline"
                  >
                    {common.nav.dashboard}
                  </Link>
                  <Link
                    href={profileHref}
                    className="inline-flex h-9 max-w-[10rem] items-center gap-2 rounded-full border border-white/15 bg-white/10 px-2.5 text-[12.5px] font-semibold text-white"
                    title={user.email}
                  >
                    <UserCircle className="h-4 w-4 shrink-0 text-sky" />
                    <span className="truncate">{user.name || 'Profile'}</span>
                  </Link>
                </div>
              ) : !loading ? (
                /* Unified enter capsule — Log in | Join now */
                <div className="hidden items-center rounded-full border border-white/15 bg-white/[0.08] p-1 sm:flex">
                  <button
                    type="button"
                    onClick={() => openAuth({ mode: 'login' })}
                    className="rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
                  >
                    {common.nav.login}
                  </button>
                  <button
                    type="button"
                    onClick={() => openAuth({ mode: 'register' })}
                    className="rounded-full bg-sky px-3.5 py-1.5 text-[12.5px] font-semibold text-[#0f1622] transition hover:brightness-110"
                  >
                    {common.nav.register}
                  </button>
                </div>
              ) : null}

              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white md:hidden"
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                onClick={() => setMobileOpen((v) => !v)}
              >
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer so content isn't under the floating island */}
      <div className="h-[4.75rem] sm:h-[5.1rem]" aria-hidden />

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            className="fixed inset-0 z-50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-[#0f1622]/70 backdrop-blur-sm"
              aria-label="Close"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ y: -16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              className="absolute inset-x-3 top-[4.6rem] overflow-hidden rounded-2xl border border-white/15 bg-[#0f1622]/95 p-3 shadow-elevated backdrop-blur-xl"
            >
              <nav className="grid gap-1">
                {navLinks.map((item) => {
                  const label =
                    item.key === 'shop' ? common.nav.shop || 'Shop' : common.nav[item.key];
                  const className =
                    'rounded-xl px-3 py-3 text-sm font-semibold text-white/85 transition hover:bg-white/10';
                  return item.isRoute ? (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={className}
                      onClick={() => setMobileOpen(false)}
                    >
                      {label}
                    </Link>
                  ) : (
                    <a
                      key={item.href}
                      href={item.href}
                      className={className}
                      onClick={() => setMobileOpen(false)}
                    >
                      {label}
                    </a>
                  );
                })}
              </nav>
              <div className="mt-3 border-t border-white/10 pt-3">
                <LanguageSwitcher tone="dark" className="mb-3 w-full justify-between" />
                {!loading && isAuthenticated && user ? (
                  <div className="grid gap-2">
                    <Link
                      href={dashboardHref}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-xl bg-white/10 px-3 py-3 text-center text-sm font-semibold text-white"
                    >
                      {common.nav.dashboard}
                    </Link>
                  </div>
                ) : !loading ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileOpen(false);
                        openAuth({ mode: 'login' });
                      }}
                      className="rounded-xl border border-white/15 px-3 py-3 text-sm font-semibold text-white"
                    >
                      {common.nav.login}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileOpen(false);
                        openAuth({ mode: 'register' });
                      }}
                      className="rounded-xl bg-sky px-3 py-3 text-sm font-semibold text-[#0f1622]"
                    >
                      {common.nav.register}
                    </button>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export function PublicFooter() {
  const common = useContent('common');
  const year = new Date().getFullYear();

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative overflow-hidden bg-[#0a1220] text-white">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky/40 to-transparent"
        aria-hidden
      />

      <motion.div
        className="page-container relative py-5 sm:py-6"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <BrandLogo light />
            <div className="min-w-0 border-l border-white/10 pl-3">
              <motion.p
                className="truncate text-sm font-semibold tracking-tight text-white"
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.12, duration: 0.4 }}
              >
                {common.footer.closer}
              </motion.p>
              <p className="truncate text-[11px] text-white/45">{common.footer.closerHint}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-white/45 sm:justify-end">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-sky/80" />
              {common.footer.address}
            </span>
            <span className="hidden h-3 w-px bg-white/15 sm:block" aria-hidden />
            <span>{common.brand.poweredBy}</span>
            <span className="hidden h-3 w-px bg-white/15 sm:block" aria-hidden />
            <span className="cursor-default transition hover:text-white/75">{common.footer.privacy}</span>
            <span className="cursor-default transition hover:text-white/75">{common.footer.terms}</span>
            <motion.button
              type="button"
              onClick={scrollTop}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 font-medium text-white/60 transition hover:border-sky/40 hover:text-white"
            >
              <motion.span
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-flex"
              >
                <ArrowUp className="h-3 w-3" />
              </motion.span>
              {common.footer.backToTop}
            </motion.button>
          </div>
        </div>

        <p className="mt-3 text-center text-[10px] text-white/35 sm:text-left">
          © {year} {common.brand.full}. {common.footer.rights}
        </p>
      </motion.div>

      <BrandStripe />
    </footer>
  );
}
