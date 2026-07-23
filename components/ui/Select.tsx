'use client';

import { SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id, ...props }, ref) => (
    <label className="block space-y-1.5" htmlFor={id}>
      {label ? <span className="text-sm font-medium text-ink">{label}</span> : null}
      <select
        ref={ref}
        id={id}
        className={cn(
          'h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink focus-ring',
          error && 'border-accent-red',
          className
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error ? <span className="text-xs text-accent-red">{error}</span> : null}
    </label>
  )
);
Select.displayName = 'Select';
