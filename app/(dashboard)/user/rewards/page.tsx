'use client';

import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { useContent } from '@/hooks/useContent';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';

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

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const achievedKeys = new Set(mine.map((m) => m.milestone_key));
  const byLevel = new Map(mine.map((m) => [m.level, m]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">{t.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t.subtitle}</p>
      </div>

      {plan.length ? (
        <div className="space-y-3">
          <h2 className="font-display text-lg font-bold text-ink">{t.planTitle}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {plan.map((level) => {
              const key = `mission_l${level.level}`;
              const ach = byLevel.get(level.level) || mine.find((m) => m.milestone_key === key);
              const unlocked = Boolean(ach) || achievedKeys.has(key);
              return (
                <Card key={level.level}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-lg font-bold text-ink">
                        {level.title || `Level ${level.level}`}
                      </p>
                      <p className="mt-1 text-sm text-ink-muted">
                        {level.rank_label} · {level.nodes.toLocaleString('en-IN')} {t.membersUnit}
                      </p>
                    </div>
                    <Badge tone={unlocked ? 'success' : 'default'}>
                      {unlocked ? t.achieved : t.locked}
                    </Badge>
                  </div>
                  <p className="mt-4 text-sm text-ink">
                    {t.rewardLabel}: {formatCurrency(level.cash_paise / 100)}
                    {level.material_reward ? ` + ${level.material_reward}` : ''}
                  </p>
                  {ach ? (
                    <p className="mt-2 text-xs uppercase tracking-wide text-ink-muted">{ach.status}</p>
                  ) : null}
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <Card>
          <EmptyState icon={Trophy} title={t.emptyTitle} description={t.emptyDescription} />
        </Card>
      )}
    </div>
  );
}
