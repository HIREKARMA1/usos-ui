'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock3, Share2, Sparkles, Target } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import type { OverviewStats } from '@/types';

type CoachCopy = {
  eyebrow: string;
  racingTitle: string;
  smartTitle: string;
  closedTitle: string;
  pendingTitle: string;
  seatsLabel: string;
  qualifiedLabel: string;
  daysLabel: string;
  inviteCta: string;
  shareHint: string;
  nextUnlock: string;
  cashGift: string;
};

export function SmartCoach({
  stats,
  copy,
}: {
  stats: OverviewStats;
  copy: CoachCopy;
}) {
  const max = stats.maxDirectReferrals || 4;
  const filled = stats.directReferrals || 0;
  const qualified = stats.qualifiedDirects || 0;
  const days = stats.daysLeftInWindow;
  const status = stats.coachStatus || 'not_activated';
  const seatPct = Math.min(100, Math.round((filled / max) * 100));

  const title =
    status === 'smart_unlocked'
      ? copy.smartTitle
      : status === 'window_closed'
        ? copy.closedTitle
        : status === 'racing'
          ? copy.racingTitle
          : copy.pendingTitle;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.08] via-white to-sky/[0.08] p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky">
            <Target className="h-3.5 w-3.5" />
            {copy.eyebrow}
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-ink sm:text-2xl">{title}</h2>
          {status === 'racing' && days != null ? (
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-ink-muted">
              <Clock3 className="h-4 w-4 text-orange" />
              {copy.daysLabel}: <strong className="text-ink">{days}</strong>
            </p>
          ) : null}
          {status === 'smart_unlocked' ? (
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-green">
              <CheckCircle2 className="h-4 w-4" />
              SMART unlocked
            </p>
          ) : null}
        </div>
        {stats.nextRank ? (
          <div className="rounded-xl border border-line bg-white/80 px-3 py-2 text-right shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">{copy.nextUnlock}</p>
            <p className="text-sm font-bold text-ink">{stats.nextRank}</p>
            <p className="text-[11px] text-ink-muted">
              {copy.cashGift
                .replace('{cash}', stats.nextCash != null ? `₹${stats.nextCash.toLocaleString('en-IN')}` : '—')
                .replace('{gift}', stats.nextMaterialReward || '—')}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-[12px] font-medium text-ink-muted">
          <span>
            {copy.seatsLabel}: {filled}/{max}
          </span>
          <span>
            {copy.qualifiedLabel}: {qualified}/{max}
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-surface-muted">
          <motion.div
            className={cn(
              'h-full rounded-full',
              status === 'smart_unlocked' ? 'bg-green' : 'bg-gradient-to-r from-primary to-sky'
            )}
            initial={{ width: 0 }}
            animate={{ width: `${seatPct}%` }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {Array.from({ length: max }).map((_, i) => {
            const taken = i < filled;
            const ok = i < qualified;
            return (
              <div
                key={i}
                className={cn(
                  'flex h-12 items-center justify-center rounded-xl border text-sm font-bold transition',
                  ok
                    ? 'border-green/30 bg-green/10 text-green'
                    : taken
                      ? 'border-sky/30 bg-sky/10 text-sky'
                      : 'border-dashed border-line bg-white text-ink-muted'
                )}
              >
                {ok ? <CheckCircle2 className="h-4 w-4" /> : taken ? <Sparkles className="h-4 w-4" /> : i + 1}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Link href="/user/referrals">
          <Button size="sm">
            <Share2 className="h-4 w-4" />
            {copy.inviteCta}
          </Button>
        </Link>
        <p className="text-[12px] text-ink-muted">{copy.shareHint}</p>
      </div>
    </motion.section>
  );
}
