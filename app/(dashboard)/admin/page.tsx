'use client';

import { useEffect, useState } from 'react';
import { IndianRupee, Users, UserCheck, Gift } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { Spinner } from '@/components/ui/Spinner';
import { useContent } from '@/hooks/useContent';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import type { AdminStats } from '@/types';

export default function AdminAnalyticsPage() {
  const t = useContent('admin').analytics;
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminStats().then(setStats).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">{t.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t.subtitle}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label={t.stats.totalRevenue} value={formatCurrency(stats?.totalRevenue || 0)} icon={IndianRupee} />
        <StatCard label={t.stats.totalUsers} value={stats?.totalUsers || 0} icon={Users} tone="sky" />
        <StatCard label={t.stats.activeUsers} value={stats?.activeUsers || 0} icon={UserCheck} tone="green" />
        <StatCard label={t.stats.totalPayouts} value={formatCurrency(stats?.totalPayouts || 0)} icon={IndianRupee} tone="orange" />
        <StatCard label={t.stats.pendingRewards} value={stats?.pendingRewards || 0} icon={Gift} tone="orange" />
      </div>
    </div>
  );
}
