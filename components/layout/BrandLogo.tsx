'use client';

import Link from 'next/link';
import { useContent } from '@/hooks/useContent';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/cn';

export function BrandLogo({
  href = '/',
  light = false,
  className,
  showFull = false,
}: {
  href?: string;
  light?: boolean;
  className?: string;
  showFull?: boolean;
}) {
  const common = useContent('common');
  const { mode } = useTheme();

  return (
    <Link href={href} className={cn('inline-flex items-center', className)}>
      <span className="leading-tight">
        <span
          className={cn(
            'block font-display text-lg font-extrabold tracking-tight',
            light ? 'text-white' : mode === 'dark' ? 'text-ink' : 'text-primary'
          )}
        >
          {common.brand.short}
        </span>
        {showFull ? (
          <span
            className={cn(
              'block text-[10px] font-medium',
              light ? 'text-white/80' : 'text-ink-muted'
            )}
          >
            {common.brand.full}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
