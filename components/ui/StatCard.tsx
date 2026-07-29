import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = 'blue',
  variant = 'light',
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  hint?: string;
  tone?: 'blue' | 'sky' | 'orange' | 'green';
  variant?: 'light' | 'dark';
}) {
  const tones = {
    blue: 'bg-primary/15 text-primary',
    sky: 'bg-sky/15 text-sky',
    orange: 'bg-orange/15 text-orange',
    green: 'bg-green/15 text-green',
  };

  const darkTones = {
    blue: 'bg-[#1b52a4]/25 text-[#7eb0ff]',
    sky: 'bg-sky/20 text-sky',
    orange: 'bg-[#f58020]/20 text-[#ffb16a]',
    green: 'bg-[#098855]/20 text-[#5ddea8]',
  };

  if (variant === 'dark') {
    return (
      <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.09] to-white/[0.02] p-5 transition hover:border-white/20">
        <span
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky/50 to-transparent opacity-0 transition group-hover:opacity-100"
          aria-hidden
        />
        <div className="flex items-start gap-4">
          {Icon ? (
            <div
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10',
                darkTones[tone]
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
          ) : null}
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">{label}</p>
            <p className="mt-1.5 text-2xl font-bold tracking-tight text-white">{value}</p>
            {hint ? <p className="mt-1 text-xs text-white/40">{hint}</p> : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-surface flex items-start gap-4 p-5 sm:p-6">
      {Icon ? (
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-ink">{value}</p>
        {hint ? <p className="mt-0.5 text-xs text-ink-muted">{hint}</p> : null}
      </div>
    </div>
  );
}
