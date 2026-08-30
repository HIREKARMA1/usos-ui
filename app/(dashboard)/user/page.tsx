'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Gift, Trophy } from 'lucide-react';
import { MissionProgressCard } from '@/components/dashboard/MissionProgressCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, Td, Tr } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useContent } from '@/hooks/useContent';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { OverviewStats, Referral, Transaction } from '@/types';

type PlanLevel = {
  level: number;
  nodes: number;
  title?: string;
  rank_label?: string;
  cash_paise: number;
  material_reward?: string | null;
};

function formatWalletAmount(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function getGreeting(hour: number, labels: { morning: string; afternoon: string; evening: string }) {
  if (hour < 12) return labels.morning;
  if (hour < 17) return labels.afternoon;
  return labels.evening;
}

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

function OverviewStatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0 rounded-2xl border border-line bg-surface-card p-4 shadow-none sm:p-5">
      <p className="text-xs font-medium text-primary sm:text-sm">{label}</p>
      <p className="mt-1.5 break-words font-display text-xl font-bold tracking-tight text-ink sm:mt-2 sm:text-2xl lg:text-[1.65rem]">
        {value}
      </p>
    </div>
  );
}

function NetworkSlot({
  index,
  filled,
  activeLabel,
  openLabel,
  inviteLabel,
  inviteDisabled,
}: {
  index: number;
  filled: boolean;
  activeLabel: string;
  openLabel: string;
  inviteLabel: string;
  inviteDisabled?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5 sm:gap-2">
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[2.5px] text-sm font-bold sm:h-12 sm:w-12 sm:border-[3px] sm:text-base',
          filled
            ? 'border-green bg-green/10 text-green'
            : 'border-neutral-300 bg-surface-muted text-ink-muted dark:border-neutral-600'
        )}
      >
        {index}
      </span>
      {filled ? (
        <span className="text-[10px] font-semibold text-green sm:text-xs">{activeLabel}</span>
      ) : (
        <div className="flex w-full min-w-0 flex-col items-center gap-0.5 px-0.5 text-center">
          <span className="text-[10px] font-medium leading-tight text-ink-muted sm:text-xs">{openLabel}</span>
          <Link
            href="/user/referrals"
            className={cn(
              'text-[10px] font-semibold leading-tight text-primary hover:text-primary-hover sm:text-xs',
              inviteDisabled && 'pointer-events-none opacity-50'
            )}
          >
            {inviteLabel}
          </Link>
        </div>
      )}
    </div>
  );
}

export default function UserOverviewPage() {
  const t = useContent('dashboard').overview;
  const wallet = useContent('dashboard').wallet;
  const { user } = useAuth();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [plan, setPlan] = useState<PlanLevel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getOverview(),
      api.getWallet(),
      api.getReferrals().catch(() => [] as Referral[]),
      api.getRewardPlan().catch(() => ({ levels: [] as PlanLevel[] })),
    ])
      .then(([s, w, refs, rewardPlan]) => {
        setStats(s);
        setTxns(w.slice(0, 5));
        setTotalEarnings(
          w
            .filter((row) => row.type !== 'withdrawal' && row.status === 'completed')
            .reduce((sum, row) => sum + row.amount, 0)
        );
        setReferrals(refs);
        setPlan(rewardPlan.levels || []);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const mission = useMemo(() => {
    const currentLevel = stats?.currentLevel || 0;
    const targetLevel = plan.find((level) => level.level === currentLevel + 1) || plan.find((l) => l.level === 1);
    if (!targetLevel) return null;

    const isSmartTrack = targetLevel.level === 1;
    const targetCount = isSmartTrack ? stats?.maxDirectReferrals || 4 : targetLevel.nodes;
    const currentCount = isSmartTrack ? stats?.qualifiedDirects || 0 : 0;
    const progressPct = targetCount > 0 ? Math.min(100, Math.round((currentCount / targetCount) * 100)) : 0;
    const remaining = Math.max(0, targetCount - currentCount);

    return {
      targetLevel,
      isSmartTrack,
      targetCount,
      currentCount,
      progressPct,
      remaining,
    };
  }, [plan, stats]);

  const nextMission = useMemo(() => {
    const currentLevel = stats?.currentLevel || 0;
    return plan.find((level) => level.level === currentLevel + 1) || plan.find((l) => l.level === 1) || null;
  }, [plan, stats?.currentLevel]);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  const max = stats?.maxDirectReferrals || 4;
  const used = stats?.directReferrals || referrals.length;
  const rankLabel = stats?.rank || '—';
  const greeting = getGreeting(new Date().getHours(), {
    morning: t.greeting?.morning || 'Good Morning',
    afternoon: t.greeting?.afternoon || 'Good Afternoon',
    evening: t.greeting?.evening || 'Good Evening',
  });
  const displayName = user?.name ? firstName(user.name) : t.greeting?.guest || 'Member';

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-6">
      <div className="min-w-0">
        <h1 className="break-words font-display text-xl font-extrabold text-ink sm:text-2xl lg:text-3xl">
          {greeting}, {displayName}{' '}
          <span aria-hidden className="inline-block">
            👋
          </span>
        </h1>
        <p className="mt-1 text-xs text-ink-muted sm:text-sm">{t.greetingSubtitle || t.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <OverviewStatCard
          label={t.stats.walletBalance}
          value={formatWalletAmount(stats?.walletBalance || 0)}
        />
        <OverviewStatCard
          label={t.stats.totalEarnings}
          value={formatWalletAmount(totalEarnings)}
        />
        <OverviewStatCard label={t.stats.directEarning || t.stats.directReferrals} value={`${used} / ${max}`} />
        <OverviewStatCard label={t.stats.rank} value={rankLabel.toUpperCase()} />
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 xl:grid-cols-[1.15fr_0.85fr]">
        {mission ? (
          <div className="min-w-0">
            <MissionProgressCard
            coachLabel={t.mission?.coachLabel || 'SmartCoach'}
            missionTitle={mission.targetLevel.title || `Level ${mission.targetLevel.level}`}
            missionSuffix={t.mission?.suffix || 'Mission'}
            currentCount={mission.isSmartTrack ? mission.currentCount : 0}
            targetCount={mission.targetCount}
            metricLabel={
              mission.isSmartTrack
                ? t.mission?.qualifiedDirects || t.stats.qualifiedDirects
                : `${mission.targetCount.toLocaleString('en-IN')} ${t.mission?.nodesRequired || 'Nodes Required'}`
            }
            progressPct={mission.progressPct}
            remainingMessage={
              mission.remaining > 0
                ? (t.mission?.remaining || '{count} more qualified member to unlock {rank}')
                    .replace('{count}', String(mission.remaining))
                    .replace('{rank}', mission.targetLevel.title || 'SMART')
                : t.mission?.unlocked || 'Mission requirement met'
            }
            cashReward={mission.targetLevel.cash_paise / 100}
            cashRewardLabel={t.mission?.cashReward || 'Cash Reward'}
            materialReward={mission.targetLevel.material_reward}
            daysRemaining={mission.isSmartTrack ? stats?.daysLeftInWindow : null}
            daysRemainingLabel={(t.mission?.daysRemaining || '{days} Days Remaining').replace(
              '{days}',
              String(stats?.daysLeftInWindow ?? 0)
            )}
            showProgress={mission.isSmartTrack}
            />
          </div>
        ) : (
          <Card className="flex min-h-[240px] flex-col items-center justify-center text-center sm:min-h-[280px]">
            <Trophy className="h-10 w-10 text-ink-muted" />
            <p className="mt-3 font-display text-lg font-bold text-ink">{t.mission?.emptyTitle || 'Mission plan loading'}</p>
          </Card>
        )}

        <div className="min-w-0 space-y-4">
          <Card padding={false} className="p-4 sm:p-5 lg:p-6">
            <h2 className="font-display text-base font-bold text-primary sm:text-lg">
              {t.networkSlots?.title || 'My Network Slots'}
            </h2>
            <div className="mt-4 grid grid-cols-4 gap-1 sm:mt-5 sm:gap-2 md:gap-4">
              {Array.from({ length: max }, (_, index) => (
                <NetworkSlot
                  key={index}
                  index={index + 1}
                  filled={index < used}
                  activeLabel={t.networkSlots?.active || 'Active'}
                  openLabel={t.networkSlots?.open || 'Open Slot'}
                  inviteLabel={t.networkSlots?.invite || t.quickActions.invite}
                  inviteDisabled={stats?.referralSlotsFull}
                />
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <Card padding={false} className="flex min-w-0 flex-col p-4 sm:p-5">
              <p className="text-xs font-semibold text-ink-muted sm:text-sm">{t.nextMission?.label || 'Next Mission'}</p>
              {nextMission ? (
                <>
                  <div className="mt-2 flex min-w-0 items-center gap-2 sm:mt-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:h-9 sm:w-9">
                      <Gift className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </span>
                    <p className="min-w-0 break-words font-display text-base font-extrabold text-ink sm:text-lg">
                      {nextMission.title || `Level ${nextMission.level}`}
                    </p>
                  </div>
                  {nextMission.material_reward ? (
                    <p className="mt-1.5 text-xs font-medium text-ink-secondary sm:mt-2 sm:text-sm">
                      + {nextMission.material_reward}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="mt-2 text-sm text-ink-muted sm:mt-3">—</p>
              )}
            </Card>

            <Card padding={false} className="flex min-w-0 flex-col p-4 sm:p-5">
              {nextMission ? (
                <>
                  <p className="break-words font-display text-lg font-extrabold uppercase tracking-wide text-primary sm:text-xl">
                    {nextMission.title || `Level ${nextMission.level}`}
                  </p>
                  <p className="mt-1.5 text-xs text-ink-muted sm:mt-2 sm:text-sm">
                    {nextMission.nodes.toLocaleString('en-IN')} {t.nextMission?.nodesRequired || 'Nodes Required'}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-ink sm:text-sm">
                    {formatCurrency(nextMission.cash_paise / 100)} {t.mission?.cashReward || 'Cash'}
                  </p>
                  {nextMission.material_reward ? (
                    <p className="text-xs text-ink-secondary sm:text-sm">+ {nextMission.material_reward}</p>
                  ) : null}
                  <Link href="/user/rewards" className="mt-auto pt-3 sm:pt-4">
                    <Button className="w-full bg-[#4b2dbb] hover:bg-[#3f2599]" variant="primary" size="sm">
                      {t.nextMission?.viewPlan || 'View Mission Plan'}
                    </Button>
                  </Link>
                </>
              ) : (
                <p className="text-sm text-ink-muted">—</p>
              )}
            </Card>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <Card padding={false} className="min-w-0 overflow-hidden">
          <div className="border-b border-line px-4 py-3 sm:px-5 sm:py-4">
            <h2 className="font-display text-base font-bold text-ink sm:text-lg">{t.recentTitle}</h2>
          </div>

          <div className="md:hidden">
            {txns.length ? (
              <div className="divide-y divide-line">
                {txns.map((txn) => (
                  <div key={txn.id} className="space-y-2 px-4 py-3 sm:px-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{txn.description}</p>
                        <p className="mt-0.5 text-xs text-ink-muted">
                          {formatDate(txn.date)} · {wallet.types[txn.type] || txn.type}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-ink">₹{txn.amount.toLocaleString('en-IN')}</p>
                    </div>
                    <Badge tone={txn.status === 'completed' ? 'success' : txn.status === 'pending' ? 'warning' : 'danger'}>
                      {txn.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-4 py-6 text-sm text-ink-muted sm:px-5">{wallet.emptyDescription}</p>
            )}
          </div>

          <div className="hidden md:block">
            <Table headers={[wallet.table.date, wallet.table.type, wallet.table.description, wallet.table.amount, wallet.table.status]}>
              {txns.map((txn) => (
                <Tr key={txn.id}>
                  <Td>{formatDate(txn.date)}</Td>
                  <Td>{wallet.types[txn.type] || txn.type}</Td>
                  <Td>{txn.description}</Td>
                  <Td>₹{txn.amount.toLocaleString('en-IN')}</Td>
                  <Td>
                    <Badge tone={txn.status === 'completed' ? 'success' : txn.status === 'pending' ? 'warning' : 'danger'}>
                      {txn.status}
                    </Badge>
                  </Td>
                </Tr>
              ))}
            </Table>
          </div>
        </Card>

        <Card padding={false} className="min-w-0 p-4 sm:p-5 lg:p-6">
          <h2 className="font-display text-base font-bold text-ink sm:text-lg">{t.quickActionsTitle}</h2>
          <div className="mt-3 grid grid-cols-1 gap-2 min-[480px]:grid-cols-2 lg:grid-cols-1">
            <Link href="/user/referrals">
              <Button className="w-full" variant="outline" disabled={stats?.referralSlotsFull}>
                {t.quickActions.invite}
              </Button>
            </Link>
            <Link href="/user/wallet">
              <Button className="w-full" variant="outline">
                {t.quickActions.withdraw}
              </Button>
            </Link>
            <Link href="/user/genealogy">
              <Button className="w-full" variant="outline">
                {t.quickActions.viewTree}
              </Button>
            </Link>
            <Link href="/user/profile">
              <Button className="w-full" variant="primary">
                {t.quickActions.completeKyc}
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
