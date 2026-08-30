'use client';

import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

type Action = { href: string; label: string; icon: LucideIcon };

export function QuickActions({ actions }: { actions: Action[] }) {
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
      {actions.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex items-center justify-center gap-2 rounded-xl border border-line bg-surface-card px-4 py-3 text-sm font-semibold text-ink shadow-none',
            'transition duration-200 hover:border-primary/40 hover:bg-surface-muted hover:text-primary hover:shadow-none'
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </Link>
      ))}
    </div>
  );
}
