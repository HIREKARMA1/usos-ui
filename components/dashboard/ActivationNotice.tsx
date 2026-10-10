'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ACTIVATION_MESSAGE } from '@/lib/access';

export function ActivationNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-2xl border border-amber-300/80 bg-amber-50 p-4 text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100 sm:p-5">
      <p className="text-sm font-semibold sm:text-base">Account Status: Inactive</p>
      <p className={`text-sm text-amber-900/90 dark:text-amber-50/90 ${compact ? 'mt-1' : 'mt-2'}`}>
        {ACTIVATION_MESSAGE}
      </p>
      <Link href="/payment" className="mt-3 inline-flex">
        <Button size="sm">Activate Account</Button>
      </Link>
    </div>
  );
}

export function ActiveAccountBadge() {
  return (
    <p className="mt-2 inline-flex items-center rounded-full bg-green/10 px-3 py-1 text-xs font-semibold text-green sm:text-sm">
      Account Active
    </p>
  );
}
