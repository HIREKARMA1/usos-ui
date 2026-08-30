'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Banknote } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, Td, Tr } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { useContent } from '@/hooks/useContent';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';

type WithdrawalRow = {
  id: string;
  amount_inr: number;
  status: string;
  user_name?: string;
  user_email?: string;
  referral_code?: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_ifsc: string;
  bank_name?: string | null;
  payout_provider?: string | null;
  payout_id?: string | null;
  payout_utr?: string | null;
  failure_reason?: string | null;
  created_at: string;
};

function statusTone(status: string): 'warning' | 'success' | 'danger' | 'default' {
  if (status === 'paid') return 'success';
  if (status === 'pending' || status === 'processing') return 'warning';
  if (status === 'failed' || status === 'rejected') return 'danger';
  return 'default';
}

export default function AdminWithdrawalsPage() {
  const t = useContent('admin').withdrawals;
  const [rows, setRows] = useState<WithdrawalRow[]>([]);
  const [provider, setProvider] = useState('mock');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getAdminWithdrawals();
      setProvider(data.payout_provider || 'mock');
      setRows(data.items || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id: string) {
    setBusyId(id);
    try {
      await api.approveWithdrawal(id);
      toast.success(t.approved);
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || t.approveFailed);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    setBusyId(id);
    try {
      await api.rejectWithdrawal(id);
      toast.success(t.rejected);
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Reject failed');
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">{t.title}</h1>
          <p className="mt-1 text-sm text-ink-muted">{t.subtitle}</p>
        </div>
        <p className="text-xs font-medium text-ink-muted">
          {t.providerLabel}: <span className="uppercase text-ink">{provider}</span>
        </p>
      </div>
      <Card padding={false}>
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : rows.length ? (
          <Table
            headers={[
              t.table.user,
              t.table.amount,
              t.table.bank,
              t.table.requested,
              t.table.status,
              t.table.actions,
            ]}
          >
            {rows.map((r) => (
              <Tr key={r.id}>
                <Td>
                  <div className="font-medium text-ink">{r.user_name || '—'}</div>
                  <div className="text-xs text-ink-muted">{r.user_email}</div>
                  {r.referral_code ? (
                    <div className="text-xs text-ink-muted">{r.referral_code}</div>
                  ) : null}
                </Td>
                <Td className="font-semibold">{formatCurrency(r.amount_inr)}</Td>
                <Td>
                  <div className="text-sm">{r.bank_account_name}</div>
                  <div className="text-xs text-ink-muted">
                    ****{String(r.bank_account_number).slice(-4)} · {r.bank_ifsc}
                  </div>
                  {r.bank_name ? <div className="text-xs text-ink-muted">{r.bank_name}</div> : null}
                  {r.payout_utr ? (
                    <div className="mt-1 text-xs text-ink-muted">UTR: {r.payout_utr}</div>
                  ) : null}
                  {r.failure_reason ? (
                    <div className="mt-1 text-xs text-danger">{r.failure_reason}</div>
                  ) : null}
                </Td>
                <Td>{formatDate(r.created_at)}</Td>
                <Td>
                  <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-2">
                    {(r.status === 'pending' || r.status === 'failed') && (
                      <>
                        <Button
                          size="sm"
                          loading={busyId === r.id}
                          onClick={() => approve(r.id)}
                        >
                          {r.status === 'failed' ? t.retry : t.approve}
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          loading={busyId === r.id}
                          onClick={() => reject(r.id)}
                        >
                          {t.reject}
                        </Button>
                      </>
                    )}
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>
        ) : (
          <EmptyState icon={Banknote} title={t.emptyTitle} description={t.emptyDescription} />
        )}
      </Card>
    </div>
  );
}
