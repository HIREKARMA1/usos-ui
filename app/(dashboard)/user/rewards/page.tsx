'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Star, Target, Trophy } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { useContent } from '@/hooks/useContent';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/cn';

type PlanLevel = {
  level: number;
  nodes: number;
  title?: string;
  rank_label?: string;
  cash_paise: number;
  material_reward?: string | null;
};

type Achievement = {
  id: string;
  milestone_key: string;
  level?: number | null;
  cash_paise: number;
  material_reward?: string | null;
  status: string;
};

type LevelStatus = 'completed' | 'current' | 'locked';

function resolveStatus(level: number, maxCompleted: number): LevelStatus {
  if (level <= maxCompleted) return 'completed';
  if (level === maxCompleted + 1) return 'current';
  return 'locked';
}

function TimelineIcon({ status }: { status: LevelStatus }) {
  if (status === 'completed') {
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green text-white shadow-none ring-4 ring-surface-page">
        <Star className="h-3.5 w-3.5 fill-current" />
      </span>
    );
  }

  if (status === 'current') {
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-violet-500 bg-surface-page shadow-none ring-4 ring-surface-page dark:border-violet-400">
        <span className="h-2.5 w-2.5 rounded-full bg-violet-500 dark:bg-violet-400" />
      </span>
    );
  }

  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-neutral-300 bg-surface-page ring-4 ring-surface-page dark:border-neutral-600">
      <span className="h-2.5 w-2.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
    </span>
  );
}

function StatusLabel({
  status,
  labels,
}: {
  status: LevelStatus;
  labels: { completed: string; current: string; locked: string };
}) {
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green">
        <Check className="h-4 w-4" strokeWidth={2.5} />
        {labels.completed}
      </span>
    );
  }

  if (status === 'current') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 dark:text-violet-300">
        <Target className="h-4 w-4" />
        {labels.current}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted">
      <Target className="h-4 w-4" />
      {labels.locked}
    </span>
  );
}

export default function RewardsPage() {
  const t = useContent('dashboard').rewards;
  const [plan, setPlan] = useState<PlanLevel[]>([]);
  const [mine, setMine] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getRewardPlan().catch(() => ({ levels: [] as PlanLevel[] })),
      api.get<Achievement[]>('/api/v1/rewards/mine').catch(() => [] as Achievement[]),
    ])
      .then(([p, rows]) => {
        setPlan(p.levels || []);
        setMine(rows || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const maxCompleted = useMemo(() => {
    const achievedKeys = new Set(mine.map((m) => m.milestone_key));
    let highest = 0;
    for (const level of plan) {
      const key = `mission_l${level.level}`;
      const unlocked =
        Boolean(mine.find((m) => m.level === level.level || m.milestone_key === key)) ||
        achievedKeys.has(key);
      if (unlocked) highest = Math.max(highest, level.level);
    }
    return highest;
  }, [mine, plan]);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-primary">{t.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t.subtitle}</p>
      </div>

      {plan.length ? (
        <div>
          <h2 className="font-display text-base font-bold text-primary">{t.planTitle}</h2>

          <ol className="relative mt-5 space-y-1">
            {plan.map((level, index) => {
              const status = resolveStatus(level.level, maxCompleted);
              const isLast = index === plan.length - 1;
              const title = level.title || `Level ${level.level}`;

              return (
                <li key={level.level} className="relative flex gap-4">
                  <div className="relative flex w-8 shrink-0 flex-col items-center">
                    <TimelineIcon status={status} />
                    {!isLast ? (
                      <span
                        className={cn(
                          'absolute top-8 bottom-0 w-px',
                          status === 'completed' ? 'bg-green/40' : 'bg-line'
                        )}
                        aria-hidden
                      />
                    ) : null}
                  </div>

                  <div
                    className={cn(
                      'mb-2 flex min-w-0 flex-1 items-start justify-between gap-3 rounded-xl px-3 py-3 sm:px-4',
                      status === 'current' && 'bg-violet-50 dark:bg-violet-500/20'
                    )}
                  >
                    <div className="min-w-0">
                      <p
                        className={cn(
                          'font-display text-sm font-extrabold uppercase tracking-wide sm:text-base',
                          status === 'completed' && 'text-ink',
                          status === 'current' && 'text-violet-700 dark:text-violet-300',
                          status === 'locked' && 'text-ink'
                        )}
                      >
                        {title}
                      </p>
                      <p
                        className={cn(
                          'mt-0.5 text-sm',
                          status === 'current'
                            ? 'text-violet-800/70 dark:text-violet-200/80'
                            : 'text-ink-muted'
                        )}
                      >
                        {level.nodes.toLocaleString('en-IN')} {t.pointsUnit}
                      </p>
                      <p className="mt-1 text-sm">
                        <span
                          className={cn(
                            'font-bold',
                            status === 'current'
                              ? 'text-violet-950 dark:text-violet-100'
                              : 'text-ink'
                          )}
                        >
                          {formatCurrency(level.cash_paise / 100)}
                        </span>
                        {level.material_reward ? (
                          <span
                            className={cn(
                              status === 'current'
                                ? 'text-violet-800/80 dark:text-violet-200/90'
                                : 'text-ink-secondary'
                            )}
                          >
                            {' '}
                            · {level.material_reward}
                          </span>
                        ) : null}
                      </p>
                    </div>

                    <div className="shrink-0 pt-0.5">
                      <StatusLabel
                        status={status}
                        labels={{
                          completed: t.completed,
                          current: t.current,
                          locked: t.locked,
                        }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      ) : (
        <div className="rounded-xl border border-line bg-surface-card p-6">
          <EmptyState icon={Trophy} title={t.emptyTitle} description={t.emptyDescription} />
        </div>
      )}
    </div>
  );
}
