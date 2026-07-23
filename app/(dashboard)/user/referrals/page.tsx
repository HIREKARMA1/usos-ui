'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Copy, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, Td, Tr } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { useContent } from '@/hooks/useContent';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { env } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import type { OverviewStats, Referral } from '@/types';

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
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const max = overview?.maxDirectReferrals || 4;
  const used = overview?.directReferrals || rows.length;
  const full = overview?.referralSlotsFull || used >= max;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">{t.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t.subtitle}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs font-semibold uppercase text-ink-muted">{t.slotsLabel}</p>
          <p className="mt-2 font-display text-2xl font-bold text-primary">
            {used}/{max}
          </p>
          {full ? <p className="mt-2 text-sm text-ink-muted">{t.slotsFull}</p> : null}
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase text-ink-muted">{t.yourCodeLabel}</p>
          <p className="mt-2 font-display text-2xl font-bold tracking-wider text-primary">{code}</p>
          <Button className="mt-4" size="sm" variant="outline" onClick={() => copy(code)} disabled={full}>
            <Copy className="h-4 w-4" /> {t.copyCode}
          </Button>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase text-ink-muted">{t.yourLinkLabel}</p>
          <p className="mt-2 break-all text-sm text-ink">{link}</p>
          <Button className="mt-4" size="sm" variant="outline" onClick={() => copy(link)} disabled={full}>
            <Copy className="h-4 w-4" /> {t.copyLink}
          </Button>
        </Card>
      </div>

      <Card padding={false}>
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-display text-lg font-bold">{t.directTeamTitle}</h2>
        </div>
        {rows.length ? (
          <Table headers={[t.table.name, t.table.code || t.table.package, t.table.joined, t.table.status]}>
            {rows.map((r) => (
              <Tr key={r.id}>
                <Td>{r.name}</Td>
                <Td className="font-mono text-xs">{r.referralCode || '—'}</Td>
                <Td>{formatDate(r.joinedAt)}</Td>
                <Td>
                  <Badge tone={r.status === 'active' ? 'success' : 'warning'}>{r.status}</Badge>
                </Td>
              </Tr>
            ))}
          </Table>
        ) : (
          <EmptyState icon={Users} title={t.emptyTitle} description={t.emptyDescription} />
        )}
      </Card>
    </div>
  );
}
