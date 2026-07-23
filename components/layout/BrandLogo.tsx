'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useContent } from '@/hooks/useContent';
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
  return (
    <Link href={href} className={cn('inline-flex items-center gap-2.5', className)}>
      <Image
        src={light ? '/images/HKlogowhite.png' : '/images/HKlogoblack.png'}
        alt={common.brand.full}
        width={36}
        height={36}
        className="h-9 w-9 object-contain"
        priority
      />
      <span className="leading-tight">
        <span className={cn('block font-display text-lg font-extrabold tracking-tight', light ? 'text-white' : 'text-primary')}>
          {common.brand.short}
        </span>
        {showFull ? (
          <span className={cn('block text-[10px] font-medium', light ? 'text-white/80' : 'text-ink-muted')}>
            {common.brand.full}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
