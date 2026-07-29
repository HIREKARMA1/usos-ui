'use client';

import { Gift, Package } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export function KitUnboxing({
  packageName,
  packageCode,
  items,
  copy,
}: {
  packageName?: string | null;
  packageCode?: string | null;
  items?: Array<{ name: string; quantity: number }>;
  copy: {
    eyebrow: string;
    title: string;
    empty: string;
    itemCount: string;
  };
}) {
  const list = items || [];

  return (
    <Card className="h-full">
      <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky">
        <Package className="h-3.5 w-3.5" />
        {copy.eyebrow}
      </p>
      <h2 className="mt-2 text-lg font-bold tracking-tight text-ink">
        {packageName || copy.title}
        {packageCode ? <span className="ml-2 text-sm font-semibold text-ink-muted">({packageCode})</span> : null}
      </h2>
      {list.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">{copy.empty}</p>
      ) : (
        <>
          <p className="mt-1 text-xs text-ink-muted">
            {copy.itemCount.replace('{n}', String(list.length))}
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {list.map((item) => (
              <li
                key={`${item.name}-${item.quantity}`}
                className="flex items-center gap-2 rounded-xl border border-line bg-surface-soft px-3 py-2 text-sm text-ink"
              >
                <Gift className="h-3.5 w-3.5 shrink-0 text-orange" />
                <span className="min-w-0 flex-1 truncate font-medium">{item.name}</span>
                <span className="text-xs font-semibold text-ink-muted">×{item.quantity}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
