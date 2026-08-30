'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ChevronDown, Gift, X } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { useContent } from '@/hooks/useContent';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatCurrency, formatDate, getInitials } from '@/lib/format';
import type { RewardClaim, RewardClaimStatus } from '@/types';

const PREVIEW_LIMIT = 8;

const STATUS_TABS: RewardClaimStatus[] = ['pending', 'approved', 'fulfilled', 'rejected'];

const AVATAR_COLORS = [
  'from-[#6C63FF] to-[#4F46E5]',
  'from-[#22C55E] to-[#16A34A]',
  'from-[#F59E0B] to-[#D97706]',
  'from-[#EF4444] to-[#DC2626]',
  'from-[#06B6D4] to-[#0891B2]',
  'from-[#A855F7] to-[#9333EA]',
];

type PlanLevel = {
  level: number;
  title?: string;
  cash_paise: number;
  material_reward?: string | null;
};

function avatarGradient(name: string) {
  const index = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

function getMilestoneTitle(claim: RewardClaim, planLevels: PlanLevel[]): string {
  if (claim.level) {
    const match = planLevels.find((l) => l.level === claim.level);
    if (match?.title) return match.title;
  }
  const keyMatch = claim.milestone.match(/mission_l(\d+)/i);
  if (keyMatch) {
    const match = planLevels.find((l) => l.level === Number(keyMatch[1]));
    if (match?.title) return match.title;
  }
  return claim.milestone;
}

function getPlanLevel(claim: RewardClaim, planLevels: PlanLevel[]): PlanLevel | undefined {
  if (claim.level) return planLevels.find((l) => l.level === claim.level);
  const keyMatch = claim.milestone.match(/mission_l(\d+)/i);
  if (keyMatch) return planLevels.find((l) => l.level === Number(keyMatch[1]));
  return undefined;
}

function formatRewardDetails(claim: RewardClaim, planLevels: PlanLevel[]): string {
  const plan = getPlanLevel(claim, planLevels);
  const cashPaise = claim.cashPaise || plan?.cash_paise || 0;
  const material = claim.materialReward || plan?.material_reward;
  const parts: string[] = [];
  if (cashPaise > 0) parts.push(formatCurrency(cashPaise / 100));
  if (material) parts.push(material);
  return parts.join(' + ') || '—';
}

function StatusBadge({ status, label }: { status: RewardClaimStatus; label: string }) {
  const styles: Record<RewardClaimStatus, string> = {
    pending:
      'border-orange-500/30 bg-orange-500/10 text-orange-700 dark:border-orange-500/40 dark:text-orange-400',
    approved:
      'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/40 dark:text-emerald-400',
    rejected:
      'border-red-500/30 bg-red-500/10 text-red-600 dark:border-red-500/40 dark:text-red-400',
    fulfilled:
      'border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:border-indigo-500/40 dark:text-indigo-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        styles[status]
      )}
    >
      {label}
    </span>
  );
}

type RewardsContent = {
  reviewTitle: string;
  table: { milestone: string; reward: string; achievedOn: string; status: string };
  statusLabels: Record<RewardClaimStatus, string>;
  approve: string;
  reject: string;
};

function ReviewModal({
  claim,
  planLevels,
  t,
  busy,
  onClose,
  onApprove,
  onReject,
}: {
  claim: RewardClaim;
  planLevels: PlanLevel[];
  t: RewardsContent;
  busy: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const milestoneTitle = getMilestoneTitle(claim, planLevels);
  const rewardDetails = formatRewardDetails(claim, planLevels);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm dark:bg-black/60">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-surface-card shadow-xl dark:border-white/[0.08] dark:bg-[#0A1424] dark:shadow-[0_24px_64px_rgba(0,0,0,0.6)]"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4 dark:border-white/[0.06]">
          <h3 className="text-base font-semibold text-ink dark:text-white">{t.reviewTitle}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition hover:bg-surface-muted hover:text-ink dark:text-white/50 dark:hover:bg-white/[0.06] dark:hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-semibold text-white',
                avatarGradient(claim.userName)
              )}
            >
              {getInitials(claim.userName)}
            </div>
            <div>
              <p className="font-medium text-ink dark:text-white">{claim.userName}</p>
              {claim.referralCode ? (
                <p className="text-xs text-ink-muted dark:text-white/45">{claim.referralCode}</p>
              ) : null}
            </div>
          </div>

          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted dark:text-white/45">{t.table.milestone}</dt>
              <dd className="font-medium text-ink dark:text-white">{milestoneTitle}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted dark:text-white/45">{t.table.reward}</dt>
              <dd className="font-medium text-ink dark:text-white">{rewardDetails}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted dark:text-white/45">{t.table.achievedOn}</dt>
              <dd className="text-ink-secondary dark:text-white/80">{formatDate(claim.requestedAt)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted dark:text-white/45">{t.table.status}</dt>
              <dd>
                <StatusBadge status={claim.status} label={t.statusLabels[claim.status]} />
              </dd>
            </div>
          </dl>
        </div>

        <div className="flex justify-end gap-2 border-t border-line px-5 py-4 dark:border-white/[0.06]">
          <button
            type="button"
            disabled={busy}
            onClick={onReject}
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-500/20 disabled:opacity-50 dark:text-red-400"
          >
            {t.reject}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onApprove}
            className="rounded-lg bg-[#6C63FF] px-4 py-2 text-sm font-medium text-white shadow-[0_0_16px_rgba(108,99,255,0.25)] transition hover:bg-[#5B54E8] disabled:opacity-50 dark:shadow-[0_0_16px_rgba(108,99,255,0.35)]"
          >
            {busy ? '…' : t.approve}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminRewardsPage() {
  const t = useContent('admin').rewards;
  const [rows, setRows] = useState<RewardClaim[]>([]);
  const [planLevels, setPlanLevels] = useState<PlanLevel[]>([]);
  const [activeTab, setActiveTab] = useState<RewardClaimStatus>('pending');
  const [tabCounts, setTabCounts] = useState<Record<RewardClaimStatus, number>>({
    pending: 0,
    approved: 0,
    fulfilled: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reviewClaim, setReviewClaim] = useState<RewardClaim | null>(null);
  const [showAll, setShowAll] = useState(false);

  const loadCounts = useCallback(async () => {
    const results = await Promise.all(
      STATUS_TABS.map(async (tab) => {
        const items = await api.getRewardClaims(tab);
        return { tab, count: items.length };
      })
    );
    setTabCounts(
      results.reduce(
        (acc, { tab, count }) => {
          acc[tab] = count;
          return acc;
        },
        { pending: 0, approved: 0, fulfilled: 0, rejected: 0 } as Record<
          RewardClaimStatus,
          number
        >
      )
    );
  }, []);

  const load = useCallback(async (tab: RewardClaimStatus = activeTab) => {
    setLoading(true);
    try {
      setRows(await api.getRewardClaims(tab));
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    api.getRewardPlan().then((plan) => setPlanLevels(plan.levels || [])).catch(() => {});
  }, []);

  useEffect(() => {
    loadCounts();
    load(activeTab);
  }, [activeTab, load, loadCounts]);

  useEffect(() => {
    setShowAll(false);
  }, [activeTab]);

  const displayedRows = useMemo(
    () => (showAll ? rows : rows.slice(0, PREVIEW_LIMIT)),
    [rows, showAll]
  );

  async function updateStatus(
    id: string,
    status: 'approved' | 'fulfilled' | 'rejected',
    successMessage: string
  ) {
    setBusyId(id);
    try {
      await api.updateRewardStatus(id, status);
      toast.success(successMessage);
      setReviewClaim(null);
      await Promise.all([load(activeTab), loadCounts()]);
    } catch (e: unknown) {
      const detail =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      toast.error(detail || 'Update failed');
    } finally {
      setBusyId(null);
    }
  }

  function handleTabChange(tab: RewardClaimStatus) {
    setActiveTab(tab);
  }

  return (
    <div className="-m-4 min-h-full bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100 p-4 sm:-m-6 sm:p-6 lg:-m-8 lg:p-8 dark:from-[#050B17] dark:via-[#08111F] dark:to-[#0D1B2A]">
      <div className="mx-auto max-w-7xl">
        <div
          className={cn(
            'overflow-hidden rounded-2xl border shadow-sm backdrop-blur-sm',
            'border-slate-200/80 bg-white/90 shadow-[0_4px_24px_rgba(15,23,42,0.06)]',
            'dark:border-white/[0.08] dark:bg-white/[0.03] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.04)] dark:backdrop-blur-xl'
          )}
        >
          <div className="border-b border-line px-5 py-5 dark:border-white/[0.06]">
            <h1 className="text-lg font-semibold tracking-tight text-ink dark:text-white">
              {t.title}
            </h1>

            <div className="mt-4 flex flex-wrap gap-1">
              {STATUS_TABS.map((tab) => {
                const isActive = activeTab === tab;
                const count = tabCounts[tab];
                const label =
                  tab === 'pending' && count > 0
                    ? `${t.tabs[tab]} (${count})`
                    : t.tabs[tab];

                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => handleTabChange(tab)}
                    className={cn(
                      'rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300',
                      isActive
                        ? 'bg-indigo-100 text-indigo-700 shadow-sm dark:bg-[#1E3A5F] dark:text-white dark:shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                        : 'text-ink-muted hover:text-ink dark:text-white/45 dark:hover:text-white/70'
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : rows.length ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-line bg-surface-muted/80 dark:border-white/[0.06] dark:bg-white/[0.04]">
                      {[
                        { label: t.table.member, sortable: true },
                        { label: t.table.milestone, sortable: false },
                        { label: t.table.reward, sortable: false },
                        { label: t.table.achievedOn, sortable: false },
                        { label: t.table.status, sortable: false },
                        { label: t.table.actions, sortable: false },
                      ].map((header) => (
                        <th
                          key={header.label}
                          className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-ink-muted dark:text-white/45"
                        >
                          <span className="inline-flex items-center gap-1">
                            {header.label}
                            {header.sortable ? (
                              <ChevronDown className="h-3 w-3 opacity-50" />
                            ) : null}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayedRows.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-line/60 transition duration-300 last:border-0 hover:bg-surface-muted/60 dark:border-white/[0.04] dark:hover:bg-white/[0.03]"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={cn(
                                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-semibold text-white',
                                avatarGradient(r.userName)
                              )}
                            >
                              {getInitials(r.userName)}
                            </div>
                            <span className="truncate font-medium text-ink dark:text-white">
                              {r.userName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-ink dark:text-white/85">
                          {getMilestoneTitle(r, planLevels)}
                        </td>
                        <td className="px-4 py-3.5 text-ink-secondary dark:text-white/70">
                          {formatRewardDetails(r, planLevels)}
                        </td>
                        <td className="px-4 py-3.5 text-ink-secondary dark:text-white/70">
                          {formatDate(r.requestedAt)}
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={r.status} label={t.statusLabels[r.status]} />
                        </td>
                        <td className="px-4 py-3.5">
                          {r.status === 'pending' ? (
                            <button
                              type="button"
                              onClick={() => setReviewClaim(r)}
                              className="rounded-lg bg-[#6C63FF] px-3.5 py-1.5 text-xs font-medium text-white shadow-[0_0_16px_rgba(108,99,255,0.3)] transition hover:bg-[#5B54E8]"
                            >
                              {t.review}
                            </button>
                          ) : r.status === 'approved' ? (
                            <button
                              type="button"
                              disabled={busyId === r.id}
                              onClick={() => updateStatus(r.id, 'fulfilled', t.fulfilled)}
                              className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-500/20 disabled:opacity-50 dark:text-indigo-400"
                            >
                              {busyId === r.id ? '…' : t.markFulfilled}
                            </button>
                          ) : r.status === 'rejected' ? (
                            <span className="text-xs text-ink-muted/50 dark:text-white/25">—</span>
                          ) : (
                            <span className="text-xs text-ink-muted dark:text-white/35">
                              {t.fulfilledLabel}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {rows.length > PREVIEW_LIMIT ? (
                <div className="border-t border-line py-4 text-center dark:border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setShowAll((v) => !v)}
                    className="text-sm text-ink-muted transition hover:text-ink dark:text-white/45 dark:hover:text-white/70"
                  >
                    {showAll ? t.showLess : t.viewAll}
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted dark:bg-white/[0.04]">
                <Gift className="h-6 w-6 text-ink-muted dark:text-white/30" />
              </div>
              <p className="font-medium text-ink-secondary dark:text-white/60">{t.emptyTitle}</p>
              <p className="mt-1 text-xs text-ink-muted dark:text-white/40">{t.emptyDescription}</p>
            </div>
          )}
        </div>
      </div>

      {reviewClaim ? (
        <ReviewModal
          claim={reviewClaim}
          planLevels={planLevels}
          t={t}
          busy={busyId === reviewClaim.id}
          onClose={() => setReviewClaim(null)}
          onApprove={() => updateStatus(reviewClaim.id, 'approved', t.approved)}
          onReject={() => updateStatus(reviewClaim.id, 'rejected', t.rejected)}
        />
      ) : null}
    </div>
  );
}
