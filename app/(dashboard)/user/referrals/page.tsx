'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Copy, Share2, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { useContent } from '@/hooks/useContent';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { env } from '@/lib/constants';
import { formatDate, getInitials } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { AccountStatus, OverviewStats, Referral } from '@/types';

function statusTone(status: AccountStatus): 'success' | 'warning' | 'default' {
  if (status === 'active') return 'success';
  if (status === 'pending') return 'warning';
  return 'default';
}

export default function ReferralsPage() {
  const t = useContent('dashboard').referrals;
  const { user } = useAuth();
  const [rows, setRows] = useState<Referral[]>([]);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const code = user?.referralCode || '';
  const link = `${env.appUrl}/register?ref=${code}`;

  useEffect(() => {
    Promise.all([api.getReferrals(), api.getOverview()])
      .then(([refs, ov]) => {
        setRows(refs);
        setOverview(ov);
      })
      .finally(() => setLoading(false));
  }, []);

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    toast.success(t.copied);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  const max = overview?.maxDirectReferrals || 4;
  const used = overview?.directReferrals || rows.length;
  const full = overview?.referralSlotsFull || used >= max;
  const pct = Math.min(100, Math.round((used / max) * 100));

  async function share() {
    if (full) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: t.shareTitle || t.title,
          text: t.shareText || t.subtitle,
          url: link,
        });
        return;
      }
      await copy(link);
    } catch {
      /* user cancelled share sheet */
    }
  }

  const statusLabel = (status: AccountStatus) => {
    const map = t.status as Record<string, string> | undefined;
    return map?.[status] || status;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-primary">{t.title}</h1>
      </div>

      <Card className="space-y-6">
        {/* My Referrals progress */}
        <div>
          <h2 className="font-display text-lg font-bold text-ink">{t.myReferralsTitle}</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {(t.slotsUsed || '{used} / {max} Slots Used')
              .replace('{used}', String(used))
              .replace('{max}', String(max))}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="shrink-0 text-sm font-semibold text-ink-muted">{pct}%</span>
          </div>
          {full ? <p className="mt-2 text-sm text-ink-muted">{t.slotsFull}</p> : null}
        </div>

        {/* Referral link */}
        <div className="rounded-xl border border-line bg-surface-muted/40 p-4 sm:p-5">
          <p className="text-sm font-semibold text-ink">{t.yourLinkLabel}</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1 truncate rounded-lg border border-line bg-surface-card px-3 py-2.5 text-sm text-ink">
              {link}
            </div>
            <div className="flex shrink-0 gap-2">
              <Button size="sm" onClick={() => copy(link)} disabled={full}>
                <Copy className="h-4 w-4" /> {t.copy}
              </Button>
              <Button size="sm" onClick={share} disabled={full}>
                <Share2 className="h-4 w-4" /> {t.share}
              </Button>
            </div>
          </div>
        </div>

        {/* Referrals list */}
        <div>
          <h2 className="font-display text-lg font-bold text-ink">{t.listTitle}</h2>
          {rows.length ? (
            <ul className="mt-3 divide-y divide-line">
              {rows.map((r) => (
                <li key={r.id} className="flex items-center gap-3 py-3.5 sm:gap-4">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
                    aria-hidden
                  >
                    {getInitials(r.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{r.name}</p>
                    <p className="truncate font-mono text-xs text-ink-muted">
                      {r.referralCode || '—'}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-muted sm:hidden">{formatDate(r.joinedAt)}</p>
                  </div>
                  <Badge
                    tone={statusTone(r.status)}
                    className={cn(
                      'shrink-0 rounded-full px-2.5',
                      r.status === 'pending' && 'bg-orange/10 text-orange'
                    )}
                  >
                    {statusLabel(r.status)}
                  </Badge>
                  <div className="hidden min-w-[5.5rem] shrink-0 text-right sm:block">
                    <p className="text-sm font-medium text-ink">{formatDate(r.joinedAt)}</p>
                    <p className="text-xs text-ink-muted">{t.table.joined}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-2">
              <EmptyState icon={Users} title={t.emptyTitle} description={t.emptyDescription} />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
