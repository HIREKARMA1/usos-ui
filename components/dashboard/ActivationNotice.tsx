'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useContent } from '@/hooks/useContent';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';

type ActivationState = {
  display_status: string;
  needs_repurchase: boolean;
  monthly_eligible_paise: number;
  monthly_threshold_paise: number;
  remaining_paise: number;
};

function fill(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template
  );
}

export function ActivationNotice({ compact = false }: { compact?: boolean }) {
  const copy = useContent('dashboard').activation;
  const router = useRouter();
  const [state, setState] = useState<ActivationState | null>(null);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .getMemberActivation()
      .then((next) => {
        if (active) setState(next);
      })
      .catch(() => {
        if (active) setState(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const repurchase = Boolean(state?.needs_repurchase);
  const pending = state?.display_status === 'pending';
  const remaining = formatCurrency((state?.remaining_paise || 0) / 100);
  const current = formatCurrency((state?.monthly_eligible_paise || 0) / 100);
  const required = formatCurrency((state?.monthly_threshold_paise || 0) / 100);
  const met = repurchase && (state?.remaining_paise || 0) <= 0;
  const message = !state
    ? ''
    : repurchase
      ? met
        ? copy.repurchaseMet
        : fill(copy.repurchaseMessage, { amount: remaining })
      : copy.joiningMessage;

  async function openActivation() {
    setOpening(true);
    try {
      const next = state || (await api.getMemberActivation());
      router.push(next.needs_repurchase ? '/shop?reactivate=1' : '/payment');
    } catch {
      setOpening(false);
    }
  }

  return (
    <div className="rounded-2xl border border-amber-300/80 bg-amber-50 p-4 text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100 sm:p-5">
      <p className="text-sm font-semibold sm:text-base">
        {pending ? copy.statusPending : copy.statusInactive}
      </p>
      {message ? (
        <p className={`text-sm text-amber-900/90 dark:text-amber-50/90 ${compact ? 'mt-1' : 'mt-2'}`}>
          {message}
        </p>
      ) : null}
      {repurchase ? (
        <p className="mt-1 text-sm text-amber-900/80 dark:text-amber-50/80">
          {fill(copy.repurchaseProgress, { current, required })}
        </p>
      ) : null}
      <div className="mt-3">
        <Button size="sm" loading={opening} onClick={() => void openActivation()}>
          {copy.action}
        </Button>
      </div>
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
