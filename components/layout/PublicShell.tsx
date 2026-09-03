'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { ShoppingCart, UserCircle } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useContent } from '@/hooks/useContent';
import { useAuth } from '@/hooks/useAuth';
import { needsPayment, postAuthPath } from '@/lib/access';

export function AuthShell({ children }: { children: ReactNode }) {
  const common = useContent('common');
  return (
    <div className="flex min-h-screen flex-col bg-surface-soft">
      <header className="flex items-center justify-between px-4 py-4 sm:px-8">
        <BrandLogo showFull />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-8">{children}</main>
      <footer className="px-4 py-6 text-center text-xs text-ink-muted">
        {common.brand.poweredBy} · {common.footer.rights}
      </footer>
    </div>
  );
}

export function PublicHeader() {
  const common = useContent('common');
  const { user, loading, isAuthenticated } = useAuth();
  const dashboardHref = user ? postAuthPath(user) : '/user';
  const pending = needsPayment(user);
  const shopHref = pending ? '/payment?reason=pending' : '/shop';
  const profileHref = pending
    ? '/payment?reason=pending'
    : user?.role === 'admin'
      ? '/admin'
      : '/user/profile';

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-surface-card/90 backdrop-blur">
      <div className="page-container flex h-16 items-center justify-between gap-4">
        <BrandLogo showFull />
        <nav className="hidden items-center gap-6 text-sm font-medium text-ink-secondary md:flex">
          <a href="/#features" className="hover:text-primary">
            {common.nav.features}
          </a>
          <a href="/#how" className="hover:text-primary">
            {common.nav.howItWorks}
          </a>
          <a href="/#packages" className="hover:text-primary">
            {common.nav.packages}
          </a>
          <Link href={shopHref} className="hover:text-primary">
            {common.nav.shop || 'Shop'}
          </Link>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <LanguageSwitcher className="hidden sm:inline-flex" />
          <Link
            href={pending ? '/payment?reason=pending' : '/shop/cart'}
            aria-label="Cart"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink hover:bg-surface-muted hover:text-primary"
          >
            <ShoppingCart className="h-5 w-5" strokeWidth={1.75} />
          </Link>
          {!loading && isAuthenticated && user ? (
            <>
              <Link
                href={dashboardHref}
                className="hidden text-sm font-semibold text-ink hover:text-primary sm:inline"
              >
                {common.nav.dashboard}
              </Link>
              <Link
                href={profileHref}
                className="inline-flex h-10 max-w-[11rem] items-center gap-2 rounded-lg border border-line bg-surface-card px-3 text-sm font-semibold text-ink hover:bg-surface-muted"
                title={user.email}
              >
                <UserCircle className="h-5 w-5 shrink-0 text-primary" />
                <span className="truncate">{user.name || 'Profile'}</span>
              </Link>
            </>
          ) : !loading ? (
            <>
              <Link href="/login" className="hidden text-sm font-semibold text-ink hover:text-primary sm:inline">
                {common.nav.login}
              </Link>
              <Link
                href="/register"
                className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-600"
              >
                {common.nav.register}
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  const common = useContent('common');
  const { isAuthenticated, user } = useAuth();
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line bg-surface-card">
      <div className="page-container grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <BrandLogo showFull />
          <p className="mt-3 max-w-xs text-sm text-ink-muted">{common.footer.tagline}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">{common.footer.quickLinks}</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            {isAuthenticated && user ? (
              <>
                <li>
                  <Link href={postAuthPath(user)}>{common.nav.dashboard}</Link>
                </li>
                <li>
                  <Link href={needsPayment(user) ? '/payment?reason=pending' : '/shop'}>
                    {common.nav.shop || 'Shop'}
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link href="/register">{common.nav.register}</Link>
                </li>
                <li>
                  <Link href="/login">{common.nav.login}</Link>
                </li>
              </>
            )}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">{common.footer.legal}</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            <li>{common.footer.privacy}</li>
            <li>{common.footer.terms}</li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">{common.footer.contact}</p>
          <p className="mt-3 text-sm text-ink-muted">{common.footer.address}</p>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-ink-muted">
        © {year} {common.brand.full}. {common.footer.rights}
      </div>
    </footer>
  );
}
