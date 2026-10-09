import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

type Trend = 'up' | 'down' | 'neutral';
type Tone = 'default' | 'warning' | 'success' | 'danger' | 'info';

const toneStyles: Record<Tone, string> = {
  default: 'bg-primary/10 text-primary group-hover:bg-primary/15',
  warning: 'bg-amber-500/12 text-amber-600 dark:text-[#F59E0B] group-hover:bg-amber-500/18',
  success: 'bg-emerald-500/12 text-emerald-600 dark:text-[#22C55E] group-hover:bg-emerald-500/18',
  danger: 'bg-red-500/12 text-red-600 dark:text-[#EF4444] group-hover:bg-red-500/18',
  info: 'bg-sky-500/12 text-sky-600 dark:text-[#38BDF8] group-hover:bg-sky-500/18',
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  change,
  badge,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  change?: { text: string; trend: Trend };
  badge?: string;
  tone?: Tone;
}) {
  const trendStyles: Record<Trend, string> = {
    up: 'text-green',
    down: 'text-red',
    neutral: 'text-ink-muted',
  };

  return (
    <div
      className={cn(
        'group flex h-full min-h-[88px] flex-col justify-between rounded-xl border border-line bg-surface-card p-3.5',
        'shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition duration-200',
        'hover:border-line-strong hover:bg-surface-muted/80',
        'dark:border-white/[0.08] dark:bg-white/[0.03] dark:shadow-none dark:hover:bg-white/[0.05]'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted dark:text-white/45">{label}</p>
        <div
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition',
            toneStyles[tone]
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="font-display text-xl font-bold leading-none tracking-tight text-ink sm:text-2xl dark:text-white">
          {value}
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          {badge ? (
            <span className="rounded-md bg-surface-muted px-1.5 py-0.5 text-[10px] font-semibold text-ink-muted dark:bg-white/[0.06] dark:text-white/50">
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
