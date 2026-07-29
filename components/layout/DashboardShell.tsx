'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useState } from 'react';
import {
  LayoutDashboard,
  Network,
  Wallet,
  Users,
  UserCircle,
  Trophy,
  Menu,
  X,
  LogOut,
  Package,
  BarChart3,
  Gift,
  ShoppingBag,
  Coins,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useContent } from '@/hooks/useContent';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/cn';

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };

export function DashboardShell({
  children,
  mode,
}: {
  children: ReactNode;
  mode: 'user' | 'admin';
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const dash = useContent('dashboard');
  const admin = useContent('admin');
  const common = useContent('common');
  const [open, setOpen] = useState(false);
  const dark = mode === 'admin';

  const userNav: NavItem[] = [
    { href: '/user', label: dash.nav.overview, icon: LayoutDashboard },
    { href: '/shop', label: dash.nav.shop || 'Shop', icon: ShoppingBag },
    { href: '/user/orders', label: dash.nav.orders || 'Orders', icon: Package },
    { href: '/user/points', label: dash.nav.points || 'Points', icon: Coins },
    { href: '/user/genealogy', label: dash.nav.genealogy, icon: Network },
    { href: '/user/wallet', label: dash.nav.wallet, icon: Wallet },
    { href: '/user/referrals', label: dash.nav.referrals, icon: Users },
    { href: '/user/rewards', label: dash.nav.rewards, icon: Trophy },
    { href: '/user/profile', label: dash.nav.profile, icon: UserCircle },
  ];

  const adminNav: NavItem[] = [
    { href: '/admin', label: admin.nav.analytics, icon: BarChart3 },
    { href: '/admin/users', label: admin.nav.users, icon: Users },
    { href: '/admin/products', label: admin.nav.products || 'Products', icon: Package },
    { href: '/admin/packages', label: admin.nav.packages, icon: Package },
    { href: '/admin/rewards', label: admin.nav.rewards, icon: Gift },
    { href: '/admin/withdrawals', label: admin.nav.withdrawals || 'Withdrawals', icon: Wallet },
    { href: '/admin/genealogy', label: admin.nav.genealogy, icon: Network },
  ];

  const items = mode === 'admin' ? adminNav : userNav;

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className={cn('flex flex-col p-3', dark ? 'gap-1' : 'gap-0.5')}>
      {items.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 text-[13px] font-semibold transition',
              dark
                ? cn(
                    'rounded-xl px-3 py-2.5',
                    active
                      ? 'bg-sky text-[#0f1622] shadow-[0_0_24px_rgba(0,162,229,0.25)]'
                      : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
                  )
                : cn(
                    'rounded-lg px-3 py-2.5',
                    active
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-ink-secondary hover:bg-surface-muted hover:text-ink'
                  )
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
<<<<<<< HEAD
    <div className="flex h-dvh flex-col overflow-hidden bg-surface-soft">
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-white lg:flex">
          <div className="shrink-0 border-b border-line px-4 py-4">
            <BrandLogo href={mode === 'admin' ? '/admin' : '/user'} showFull />
=======
    <div
      className={cn(
        'relative flex h-dvh flex-col overflow-hidden',
        dark ? 'bg-[#0f1622] text-white' : 'bg-surface-soft'
      )}
    >
      {dark ? (
        <>
          <div
            className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full blur-[120px]"
            style={{ background: 'rgba(27,82,164,0.22)' }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full blur-[130px]"
            style={{ background: 'rgba(0,162,229,0.12)' }}
            aria-hidden
          />
        </>
      ) : null}

      <BrandStripe className="relative z-10 shrink-0" />

      <div className="relative z-10 flex min-h-0 flex-1">
        <aside
          className={cn(
            'hidden w-64 shrink-0 flex-col lg:flex',
            dark
              ? 'border-r border-white/10 bg-[#0a1220]/80 backdrop-blur-xl'
              : 'border-r border-line bg-white'
          )}
        >
          <div className={cn('shrink-0 px-4 py-4', dark ? 'border-b border-white/10' : 'border-b border-line')}>
            <BrandLogo href={mode === 'admin' ? '/admin' : '/user'} showFull light={dark} />
            {dark ? (
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky/80">
                {admin.topbar.title}
              </p>
            ) : null}
>>>>>>> 52d4af87a69552211b6b2788ab3be3d58288c4fa
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <NavLinks />
          </div>
          {dark ? (
            <div className="border-t border-white/10 px-4 py-3 text-[11px] text-white/35">
              {common.brand.poweredBy}
            </div>
          ) : null}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
<<<<<<< HEAD
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-line bg-white px-4 sm:px-6">
=======
          <header
            className={cn(
              'z-20 flex h-16 shrink-0 items-center justify-between gap-3 px-4 sm:px-6',
              dark
                ? 'border-b border-white/10 bg-[#0f1622]/75 backdrop-blur-xl'
                : 'border-b border-line bg-white/95 backdrop-blur'
            )}
          >
>>>>>>> 52d4af87a69552211b6b2788ab3be3d58288c4fa
            <div className="flex items-center gap-3">
              <button
                type="button"
                className={cn(
                  'rounded-xl p-2 lg:hidden',
                  dark ? 'text-white/80 hover:bg-white/10' : 'text-ink hover:bg-surface-muted'
                )}
                onClick={() => setOpen(true)}
                aria-label="menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="lg:hidden">
                <BrandLogo href={mode === 'admin' ? '/admin' : '/user'} light={dark} />
              </div>
              <p className={cn('hidden text-[13px] sm:block', dark ? 'text-white/55' : 'text-ink-muted')}>
                {dash.topbar.welcome}
                {user?.name ? `, ${user.name}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <LanguageSwitcher tone={dark ? 'dark' : 'light'} />
              <button
                type="button"
                onClick={() => {
                  logout();
                  router.push(dark ? '/' : '/login');
                }}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold transition',
                  dark
                    ? 'rounded-full border border-white/15 bg-white/[0.04] text-white/75 hover:border-white/25 hover:bg-white/[0.08] hover:text-white'
                    : 'rounded-lg border border-[#d5d9e0] text-ink hover:border-[#0f1622]/35'
                )}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{dash.topbar.logout}</span>
              </button>
            </div>
          </header>

          <main
            className={cn(
              'min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8',
              dark && 'admin-dark-surface'
            )}
          >
            {children}
          </main>
          {!dark ? (
            <footer className="shrink-0 border-t border-line bg-white px-4 py-3 text-center text-xs text-ink-muted">
              {common.brand.poweredBy}
            </footer>
          ) : null}
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className={cn('absolute inset-0', dark ? 'bg-black/60 backdrop-blur-sm' : 'bg-ink/40')}
            onClick={() => setOpen(false)}
            aria-label="close"
          />
          <div
            className={cn(
              'absolute inset-y-0 left-0 flex w-72 flex-col shadow-elevated',
              dark ? 'border-r border-white/10 bg-[#0a1220]' : 'bg-white'
            )}
          >
            <div
              className={cn(
                'flex items-center justify-between px-4 py-4',
                dark ? 'border-b border-white/10' : 'border-b border-line'
              )}
            >
              <BrandLogo showFull light={dark} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={cn('rounded-xl p-2', dark ? 'text-white/70 hover:bg-white/10' : 'hover:bg-surface-muted')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
