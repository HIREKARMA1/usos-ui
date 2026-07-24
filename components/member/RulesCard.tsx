'use client';

import { ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/format';
import type { TrustRules } from '@/types';

export function RulesCard({
  rules,
  copy,
}: {
  rules: TrustRules | null;
  copy: {
    eyebrow: string;
    title: string;
    seats: string;
    window: string;
    split: string;
    levelsHint: string;
  };
}) {
  const max = rules?.rules?.max_direct_referrals ?? 4;
  const days = rules?.rules?.qualification_window_days ?? 7;
  const userShare = Math.round((rules?.points?.user_share_bps ?? 5000) / 100);
  const sponsorShare = Math.round((rules?.points?.sponsor_share_bps ?? 5000) / 100);
  const topLevels = (rules?.levels || []).slice(0, 4);

  return (
    <Card className="h-full">
      <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky">
        <ShieldCheck className="h-3.5 w-3.5" />
        {copy.eyebrow}
      </p>
      <h2 className="mt-2 text-lg font-bold tracking-tight text-ink">{copy.title}</h2>
      <ul className="mt-4 space-y-2 text-sm text-ink-muted">
        <li className="rounded-xl border border-line bg-surface-soft px-3 py-2">
          {copy.seats.replace('{n}', String(max))}
        </li>
        <li className="rounded-xl border border-line bg-surface-soft px-3 py-2">
          {copy.window.replace('{n}', String(days))}
        </li>
        <li className="rounded-xl border border-line bg-surface-soft px-3 py-2">
          {copy.split.replace('{you}', String(userShare)).replace('{sponsor}', String(sponsorShare))}
        </li>
      </ul>
      {topLevels.length ? (
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{copy.levelsHint}</p>
          <div className="mt-2 space-y-1.5">
            {topLevels.map((lvl) => (
              <div key={lvl.level} className="flex items-center justify-between text-[13px]">
                <span className="font-semibold text-ink">{lvl.title}</span>
                <span className="text-ink-muted">
                  {formatCurrency((lvl.cash_paise || 0) / 100)}
                  {lvl.material_reward ? ` · ${lvl.material_reward}` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
