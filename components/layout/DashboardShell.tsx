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
import { ThemeToggle } from '@/components/ui/ThemeToggle';
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
    <nav className="flex flex-col gap-1 p-3">
      {items.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
              active ? 'bg-primary text-white' : 'text-ink-secondary hover:bg-surface-muted hover:text-ink'
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
    <div className="flex h-dvh flex-col overflow-hidden bg-surface-soft">
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-surface-card lg:flex">
          <div className="shrink-0 border-b border-line px-4 py-4">
            <BrandLogo href={mode === 'admin' ? '/admin' : '/user'} showFull />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <NavLinks />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="z-20 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface-card px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-lg p-2 text-ink hover:bg-surface-muted lg:hidden"
                onClick={() => setOpen(true)}
                aria-label="menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="lg:hidden">
                <BrandLogo href={mode === 'admin' ? '/admin' : '/user'} />
              </div>
              <p className="hidden text-sm text-ink-muted sm:block">
                {dash.topbar.welcome}
                {user?.name ? `, ${user.name}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <LanguageSwitcher />
              <button
                type="button"
                onClick={() => {
                  logout();
                  router.push('/login');
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-surface-muted"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{dash.topbar.logout}</span>
              </button>
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
          <footer className="shrink-0 border-t border-line bg-surface-card px-4 py-3 text-center text-xs text-ink-muted">
            {common.brand.poweredBy}
          </footer>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} aria-label="close" />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-surface-card shadow-none">
            <div className="flex items-center justify-between border-b border-line px-4 py-4">
              <BrandLogo showFull />
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-surface-muted">
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
