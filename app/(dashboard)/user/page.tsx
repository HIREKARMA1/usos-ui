'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Network, UserCheck, Wallet, Trophy, Timer } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, Td, Tr } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useContent } from '@/hooks/useContent';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import type { OverviewStats, Transaction } from '@/types';

export default function UserOverviewPage() {
  const t = useContent('dashboard').overview;
  const wallet = useContent('dashboard').wallet;
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getOverview(), api.getWallet()])
      .then(([s, w]) => {
        setStats(s);
        setTxns(w.slice(0, 5));
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const max = stats?.maxDirectReferrals || 4;
  const directsLabel = `${stats?.directReferrals || 0}/${max}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">{t.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t.subtitle}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label={t.stats.walletBalance} value={formatCurrency(stats?.walletBalance || 0)} icon={Wallet} tone="blue" />
        <StatCard label={t.stats.directReferrals} value={directsLabel} icon={Users} tone="sky" />
        <StatCard label={t.stats.rank} value={stats?.rank || '—'} icon={Trophy} tone="orange" />
        <StatCard label={t.stats.qualifiedDirects} value={`${stats?.qualifiedDirects || 0}/${max}`} icon={UserCheck} tone="green" />
        <StatCard
          label={t.stats.windowLeft}
          value={stats?.daysLeftInWindow == null ? '—' : stats.daysLeftInWindow}
          icon={Timer}
          tone="sky"
        />
        <StatCard label={t.stats.downline} value={stats?.totalDownline || 0} icon={Network} tone="blue" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <Card padding={false}>
          <div className="border-b border-line px-5 py-4">
            <h2 className="font-display text-lg font-bold text-ink">{t.recentTitle}</h2>
          </div>
          <Table headers={[wallet.table.date, wallet.table.type, wallet.table.description, wallet.table.amount, wallet.table.status]}>
            {txns.map((txn) => (
              <Tr key={txn.id}>
                <Td>{formatDate(txn.date)}</Td>
                <Td>{wallet.types[txn.type] || txn.type}</Td>
                <Td>{txn.description}</Td>
                <Td>₹{txn.amount.toLocaleString('en-IN')}</Td>
                <Td>
                  <Badge tone={txn.status === 'completed' ? 'success' : txn.status === 'pending' ? 'warning' : 'danger'}>
                    {txn.status}
                  </Badge>
                </Td>
              </Tr>
            ))}
          </Table>
        </Card>

        <Card>
          <h2 className="font-display text-lg font-bold text-ink">{t.quickActionsTitle}</h2>
          <div className="mt-4 flex flex-col gap-2">
            <Link href="/user/referrals">
              <Button className="w-full" variant="outline" disabled={stats?.referralSlotsFull}>
                {t.quickActions.invite}
              </Button>
            </Link>
            <Link href="/user/wallet">
              <Button className="w-full" variant="outline">
                {t.quickActions.withdraw}
              </Button>
            </Link>
            <Link href="/user/genealogy">
              <Button className="w-full" variant="outline">
                {t.quickActions.viewTree}
              </Button>
            </Link>
            <Link href="/user/profile">
              <Button className="w-full" variant="primary">
                {t.quickActions.completeKyc}
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
