'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger' | 'outline' | 'white';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:brightness-110 shadow-sm',
  secondary: 'bg-secondary-500 text-white hover:brightness-110',
  accent: 'bg-accent-orange text-white hover:brightness-110',
  ghost: 'bg-transparent text-ink hover:bg-surface-muted',
  danger: 'bg-accent-red text-white hover:brightness-110',
  outline: 'border border-[#d5d9e0] bg-white text-ink hover:border-[#0f1622]/35',
  white: 'bg-white text-primary hover:bg-white/90 shadow-sm',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-sm sm:text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition disabled:pointer-events-none disabled:opacity-50 focus-ring',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      ) : null}
      {children}
    </button>
  )
);
Button.displayName = 'Button';
