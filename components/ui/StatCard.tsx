import { LucideIcon } from 'lucide-react';
import { Card } from './Card';
import { cn } from '@/lib/cn';

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = 'blue',
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  hint?: string;
  tone?: 'blue' | 'sky' | 'orange' | 'green';
}) {
  const tones = {
    blue: 'bg-primary/10 text-primary',
    sky: 'bg-sky/10 text-sky',
    orange: 'bg-orange/10 text-orange',
    green: 'bg-green/10 text-green',
  };
  return (
    <Card className="flex items-start gap-4">
      {Icon ? (
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
        <p className="mt-1 font-display text-2xl font-bold text-ink">{value}</p>
        {hint ? <p className="mt-0.5 text-xs text-ink-muted">{hint}</p> : null}
      </div>
    </Card>
  );
}
