'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Gift } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, Td, Tr } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { useContent } from '@/hooks/useContent';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { RewardClaim } from '@/types';

export default function AdminRewardsPage() {
  const t = useContent('admin').rewards;
  const [rows, setRows] = useState<RewardClaim[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setRows(await api.getRewardClaims());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function update(id: string, status: 'approved' | 'rejected') {
    await api.patch(`/api/v1/rewards/${id}`, { status });
    toast.success(status === 'approved' ? t.approved : t.rejected);
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">{t.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t.subtitle}</p>
      </div>
      <Card padding={false}>
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : rows.length ? (
          <Table headers={[t.table.user, t.table.milestone, t.table.requested, t.table.status, t.table.actions]}>
            {rows.map((r) => (
              <Tr key={r.id}>
                <Td>{r.userName}</Td>
                <Td>{r.milestone}</Td>
                <Td>{formatDate(r.requestedAt)}</Td>
                <Td>
                  <Badge tone={r.status === 'pending' ? 'warning' : r.status === 'approved' ? 'success' : 'danger'}>
                    {r.status}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => update(r.id, 'approved')}>
                      {t.approve}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => update(r.id, 'rejected')}>
                      {t.reject}
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>
        ) : (
          <EmptyState icon={Gift} title={t.emptyTitle} description={t.emptyDescription} />
        )}
      </Card>
    </div>
  );
}
