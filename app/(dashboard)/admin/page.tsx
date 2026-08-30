'use client';

import { useEffect, useState } from 'react';
import { IndianRupee, Users, UserCheck, Gift, Clock, TrendingUp, Package, Search, Wallet } from 'lucide-react';
import { KpiCard } from '@/components/dashboard/admin/KpiCard';
import { MemberGrowthChart } from '@/components/dashboard/admin/MemberGrowthChart';
import { RevenueOverviewChart } from '@/components/dashboard/admin/RevenueOverviewChart';
import { QuickActions } from '@/components/dashboard/admin/QuickActions';
import { Spinner } from '@/components/ui/Spinner';
import { useContent } from '@/hooks/useContent';
import { buildKpiIndicators } from '@/lib/analytics-kpi';
import { api } from '@/lib/api';
import { formatCurrency, formatNumber } from '@/lib/format';
import type { AdminStats } from '@/types';

const EMPTY_STATS: AdminStats = {
  totalRevenue: 0,
  totalUsers: 0,
  activeUsers: 0,
  totalPayouts: 0,
  pendingPayouts: 0,
  pendingRewards: 0,
  monthlyGrowth: 0,
};

export default function AdminAnalyticsPage() {
  const t = useContent('admin').analytics;
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getAdminStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  const data = stats ?? EMPTY_STATS;
  const indicators = buildKpiIndicators(data);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-xl font-extrabold tracking-tight text-ink sm:text-2xl">{t.title}</h1>
        <p className="mt-0.5 text-xs text-ink-muted sm:text-sm">{t.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label={t.stats.grossRevenue}
          value={formatCurrency(data.totalRevenue)}
          icon={TrendingUp}
          change={indicators.revenue}
        />
        <KpiCard
          label={t.stats.clearedPayouts}
          value={formatCurrency(data.totalPayouts)}
          icon={IndianRupee}
          change={indicators.clearedPayouts}
        />
        <KpiCard
          label={t.stats.pendingPayouts}
          value={formatCurrency(data.pendingPayouts)}
          icon={Clock}
          change={indicators.pendingPayouts}
        />
        <KpiCard
          label={t.stats.totalMembers}
          value={formatNumber(data.totalUsers)}
          icon={Users}
          badge={indicators.totalMembers}
        />
        <KpiCard
          label={t.stats.activeMembers}
          value={formatNumber(data.activeUsers)}
          icon={UserCheck}
          change={indicators.activeMembers}
        />
        <KpiCard
          label={t.stats.pendingRewards}
          value={formatNumber(data.pendingRewards)}
          icon={Gift}
          change={indicators.pendingRewards}
        />
      </div>

      <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
        <MemberGrowthChart title={t.memberGrowthTitle} />
        <RevenueOverviewChart title={t.revenueOverviewTitle} subtitle={t.revenueSubtitle} />
      </div>

      <div>
        <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">{t.quickActionsTitle}</h2>
        <QuickActions
          actions={[
            { href: '/admin/products', label: t.quickActions.addProduct, icon: Package },
            { href: '/admin/users', label: t.quickActions.searchMember, icon: Search },
            { href: '/admin/rewards', label: t.quickActions.reviewRewards, icon: Gift },
            { href: '/admin/withdrawals', label: t.quickActions.processPayout, icon: Wallet },
          ]}
        />
      </div>
    </div>
  );
}
