'use client';

import { InputHTMLAttributes, forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useContent } from '@/hooks/useContent';

export interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  hint?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const common = useContent('common');
    const showLabel = common.password?.show || 'Show password';
    const hideLabel = common.password?.hide || 'Hide password';

    return (
      <label className="block space-y-1.5" htmlFor={id}>
        {label ? <span className="text-sm font-medium text-ink">{label}</span> : null}
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={visible ? 'text' : 'password'}
            className={cn(
              'h-11 w-full rounded-lg border border-line bg-surface-card px-3 pr-11 text-sm text-ink placeholder:text-ink-muted focus-ring',
              error && 'border-accent-red',
              className
            )}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink-muted hover:text-ink"
            aria-label={visible ? hideLabel : showLabel}
            tabIndex={0}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {error ? <span className="text-xs text-accent-red">{error}</span> : null}
        {!error && hint ? <span className="text-xs text-ink-muted">{hint}</span> : null}
      </label>
    );
  }
);
PasswordInput.displayName = 'PasswordInput';
