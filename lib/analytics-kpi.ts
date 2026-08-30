import { mockMemberGrowthSeries, mockRevenueSeries } from '@/lib/mock';
import type { AdminStats } from '@/types';

function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

function formatDelta(value: number, suffix = '%'): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}${suffix}`;
}

export function buildKpiIndicators(stats: AdminStats) {
  const rev = mockRevenueSeries;
  const revenueDelta = percentChange(rev[rev.length - 1]?.value ?? 0, rev[rev.length - 2]?.value ?? 0);

  const members = mockMemberGrowthSeries;
  const memberDelta = (members[members.length - 1]?.members ?? 0) - (members[members.length - 2]?.members ?? 0);

  const inactiveMembers = Math.max(0, stats.totalUsers - stats.activeUsers);
  const activeRate = stats.totalUsers > 0 ? (stats.activeUsers / stats.totalUsers) * 100 : 0;
  const pendingShare =
    stats.totalPayouts + stats.pendingPayouts > 0
      ? (stats.pendingPayouts / (stats.totalPayouts + stats.pendingPayouts)) * 100
      : 0;

  const clearedDelta = revenueDelta !== null ? revenueDelta * 0.67 : null;

  return {
    revenue:
      revenueDelta !== null
        ? { text: formatDelta(revenueDelta), trend: revenueDelta >= 0 ? ('up' as const) : ('down' as const) }
        : undefined,
    clearedPayouts:
      clearedDelta !== null
        ? { text: formatDelta(clearedDelta), trend: clearedDelta >= 0 ? ('up' as const) : ('down' as const) }
        : undefined,
    pendingPayouts:
      stats.pendingPayouts > 0
        ? { text: formatDelta(-pendingShare), trend: 'down' as const }
        : { text: '0.0%', trend: 'neutral' as const },
    totalMembers: inactiveMembers > 0 ? String(inactiveMembers) : undefined,
    activeMembers:
      memberDelta > 0
        ? { text: `+${memberDelta}`, trend: 'up' as const }
        : activeRate > 0
          ? { text: formatDelta(activeRate), trend: 'up' as const }
          : undefined,
    pendingRewards:
      stats.pendingRewards > 0
        ? { text: String(stats.pendingRewards), trend: 'up' as const }
        : { text: '0', trend: 'neutral' as const },
  };
}
