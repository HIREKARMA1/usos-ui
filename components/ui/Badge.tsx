import { cn } from '@/lib/cn';

const tones = {
  default: 'bg-surface-muted text-ink',
  success: 'bg-green/10 text-green',
  warning: 'bg-yellow/20 text-ink',
  danger: 'bg-red/10 text-red',
  info: 'bg-sky/10 text-sky',
  primary: 'bg-primary/10 text-primary',
} as const;

export function Badge({
  children,
  tone = 'default',
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
