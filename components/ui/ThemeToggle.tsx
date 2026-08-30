'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/cn';

export function ThemeToggle({ className }: { className?: string }) {
  const { mode, toggleMode, ready } = useTheme();
  const isDark = mode === 'dark';

  return (
    <button
      type="button"
      onClick={toggleMode}
      disabled={!ready}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface-card text-ink transition hover:bg-surface-muted disabled:opacity-60',
        className
      )}
    >
      {isDark ? <Sun className="h-5 w-5" strokeWidth={1.75} /> : <Moon className="h-5 w-5" strokeWidth={1.75} />}
    </button>
  );
}
