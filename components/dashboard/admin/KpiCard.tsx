import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

type Trend = 'up' | 'down' | 'neutral';

export function KpiCard({
  label,
  value,
  icon: Icon,
  change,
  badge,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  change?: { text: string; trend: Trend };
  badge?: string;
}) {
  const trendStyles: Record<Trend, string> = {
    up: 'text-green',
    down: 'text-red',
    neutral: 'text-ink-muted',
  };

  return (
    <div
      className={cn(
        'group flex h-full min-h-[88px] flex-col justify-between rounded-xl border border-line bg-surface-card p-3.5 shadow-none',
        'transition duration-200 hover:border-line-strong hover:bg-surface-muted hover:shadow-none'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{label}</p>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition group-hover:bg-primary/15">
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="font-display text-xl font-bold leading-none tracking-tight text-ink sm:text-2xl">{value}</p>
        <div className="flex shrink-0 items-center gap-1.5">
          {badge ? (
            <span className="rounded-md bg-surface-muted px-1.5 py-0.5 text-[10px] font-semibold text-ink-muted">
              {badge}
            </span>
          ) : null}
          {change ? (
            <span className={cn('text-[11px] font-semibold', trendStyles[change.trend])}>{change.text}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
