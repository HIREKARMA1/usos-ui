import { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Card({
  children,
  className,
  padding = true,
  id,
}: {
  children: ReactNode;
  className?: string;
  padding?: boolean;
  id?: string;
}) {
  return (
    <div id={id} className={cn('card-surface', padding && 'p-5 sm:p-6', className)}>
      {children}
    </div>
  );
}
