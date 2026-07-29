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
        alt="HireKarma"
        width={160}
        height={42}
        className={cn(
          'h-8 w-auto max-w-[7.25rem] shrink-0 object-contain object-left sm:h-9 sm:max-w-[8.5rem]',
          light && 'drop-shadow-[0_0_10px_rgba(0,162,229,0.35)]'
        )}
        priority
      />
      <span className="leading-tight">
        <span className={cn('block text-lg font-bold tracking-tight', light ? 'text-white' : 'text-primary')}>
          {common.brand.short}
        </span>
        {showFull ? (
          <span className={cn('block text-[10px] font-medium', light ? 'text-white/65' : 'text-ink-muted')}>
            {common.brand.full}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
