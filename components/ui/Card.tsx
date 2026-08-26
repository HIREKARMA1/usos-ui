import { forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export const Card = forwardRef<
  HTMLDivElement,
  {
    children: ReactNode;
    className?: string;
    padding?: boolean;
  }
>(function Card({ children, className, padding = true }, ref) {
  return (
    <div ref={ref} className={cn('card-surface', padding && 'p-5 sm:p-6', className)}>
      {children}
    </div>
  );
});
