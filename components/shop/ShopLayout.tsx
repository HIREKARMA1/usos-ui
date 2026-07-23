'use client';

import Link from 'next/link';
import { FormEvent, ReactNode, Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, ShoppingCart, UserCircle } from 'lucide-react';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { PublicFooter } from '@/components/layout/PublicShell';
import { useAuth } from '@/hooks/useAuth';
import { useContent } from '@/hooks/useContent';
import { api, roleHome } from '@/lib/api';
import { cn } from '@/lib/cn';

export function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f1f3f6]">
      <Suspense fallback={<div className="h-28 bg-primary md:h-[6.5rem]" />}>
        <ShopHeader />
      </Suspense>
      {/* Matches fixed ShopHeader: mobile search row / desktop category nav */}
      <div className="h-28 md:h-[6.5rem]" aria-hidden />
      {children}
      <PublicFooter />
    </div>
  );
}

export function ShopHeader() {
  const common = useContent('common');
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    setQ(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    if (!isAuthenticated || !user || user.role === 'admin') {
      setCartCount(0);
      return;
    }
    api
      .getCart()
      .then((c) => {
        const n = (c.items || []).reduce((sum: number, i: any) => sum + (i.quantity || 0), 0);
        setCartCount(n);
      })
      .catch(() => setCartCount(0));
  }, [isAuthenticated, user, pathname]);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/shop?q=${encodeURIComponent(query)}` : '/shop');
  }

  const dashboardHref = user ? roleHome(user.role) : '/user';

  return (
    <header className="fixed inset-x-0 top-0 z-50 shadow-sm">
      <div className="bg-primary">
        <div className="page-container flex h-14 items-center gap-3 sm:h-16 sm:gap-4">
          <BrandLogo href="/shop" showFull light />
          <form onSubmit={onSearch} className="relative mx-auto hidden min-w-0 flex-1 max-w-2xl md:block">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search for products…"
              className="h-10 w-full rounded-sm border-0 bg-white pl-4 pr-12 text-sm text-ink shadow-sm outline-none focus:ring-2 focus:ring-sky/40"
            />
            <button
              type="submit"
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-primary"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
          </form>
          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <LanguageSwitcher className="hidden border-white/25 bg-transparent sm:inline-flex" />
            <Link
              href="/shop/cart"
              className="relative inline-flex items-center gap-1.5 text-sm font-semibold text-white hover:opacity-90"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 ? (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-orange px-1 text-[10px] font-bold text-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              ) : null}
            </Link>
            {!loading && isAuthenticated && user ? (
              <Link
                href={user.role === 'admin' ? '/admin' : '/user/profile'}
                className="inline-flex max-w-[9rem] items-center gap-1.5 truncate text-sm font-semibold text-white hover:opacity-90"
              >
                <UserCircle className="h-5 w-5 shrink-0" />
                <span className="hidden truncate sm:inline">{user.name || 'Account'}</span>
              </Link>
            ) : !loading ? (
              <Link
                href="/login?next=/shop"
                className="rounded-sm bg-white px-4 py-1.5 text-sm font-semibold text-primary hover:bg-white/95"
              >
                {common.nav.login}
              </Link>
            ) : null}
            {!loading && isAuthenticated && user?.role !== 'admin' ? (
              <Link href={dashboardHref} className="hidden text-sm font-semibold text-white/90 hover:text-white lg:inline">
                Dashboard
              </Link>
            ) : null}
          </div>
        </div>
      </div>
      <div className="border-b border-line bg-white md:hidden">
        <form onSubmit={onSearch} className="page-container py-2">
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search for products…"
              className="h-10 w-full rounded-sm border border-line bg-white pl-4 pr-12 text-sm outline-none focus:border-primary"
            />
            <button type="submit" className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-primary">
              <Search className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
      <nav className="hidden border-b border-line bg-white md:block">
        <div className="page-container flex h-10 items-center gap-6 overflow-x-auto text-sm font-medium text-ink-secondary">
          <Link href="/shop" className={cn('hover:text-primary', pathname === '/shop' && 'text-primary')}>
            All products
          </Link>
          <Link href="/shop/cart" className="hover:text-primary">
            My cart
          </Link>
          <Link href="/user/orders" className="hover:text-primary">
            My orders
          </Link>
          <Link href="/user/points" className="hover:text-primary">
            Points wallet
          </Link>
        </div>
      </nav>
    </header>
  );
}

export function ShopBreadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="flex flex-wrap items-center gap-1 text-xs text-ink-muted">
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="inline-flex items-center gap-1">
          {i > 0 ? <span>/</span> : null}
          {item.href ? (
            <Link href={item.href} className="hover:text-primary">
              {item.label}
            </Link>
          ) : (
            <span className="text-ink">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
