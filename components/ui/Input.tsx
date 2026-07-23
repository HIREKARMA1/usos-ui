'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => (
    <label className="block space-y-1.5" htmlFor={id}>
      {label ? <span className="text-sm font-medium text-ink">{label}</span> : null}
      <input
        ref={ref}
        id={id}
        className={cn(
          'h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink placeholder:text-ink-muted focus-ring disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-secondary read-only:cursor-default read-only:bg-surface-muted',
          error && 'border-accent-red',
          className
        )}
        {...props}
      />
      {error ? <span className="text-xs text-accent-red">{error}</span> : null}
      {!error && hint ? <span className="text-xs text-ink-muted">{hint}</span> : null}
    </label>
  )
);
Input.displayName = 'Input';
