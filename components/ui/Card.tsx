import { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Card({
  children,
  className,
  padding = true,
}: {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return <div className={cn('card-surface', padding && 'p-5 sm:p-6', className)}>{children}</div>;
}
