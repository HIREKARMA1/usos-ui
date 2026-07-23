'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, Td, Tr } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { Wallet } from 'lucide-react';
import { useContent } from '@/hooks/useContent';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Transaction } from '@/types';

type Withdrawal = {
  id: string;
  amount_inr: number;
  status: string;
  bank_ifsc: string;
  bank_account_number: string;
  payout_utr?: string | null;
  failure_reason?: string | null;
  created_at: string;
};

export default function WalletPage() {
  const t = useContent('dashboard').wallet;
  const [rows, setRows] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [balance, setBalance] = useState(0);
  const [hasBank, setHasBank] = useState(false);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  function load() {
    return Promise.all([
      api.getWallet(),
      api.getOverview(),
      api.getMyProfile(),
      api.getMyWithdrawals(),
    ]).then(([txns, overview, profile, wd]) => {
      setRows(txns);
      setBalance(overview.walletBalance);
      setHasBank(Boolean(profile?.bank_account_number && profile?.bank_ifsc && profile?.bank_account_name));
      setWithdrawals(wd || []);
    });
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function onWithdraw() {
    if (!hasBank) {
      toast.error(t.bankRequired);
      return;
    }
    const rupees = Number(amount);
    if (!rupees || rupees <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    const paise = Math.round(rupees * 100);
    if (paise > balance * 100) {
      toast.error('Insufficient balance');
      return;
    }
    setWithdrawing(true);
    try {
      await api.withdrawWallet(paise);
      toast.success(t.requested);
      setAmount('');
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Withdrawal failed');
    } finally {
      setWithdrawing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">{t.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t.subtitle}</p>
      </div>
      <Card className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{t.balanceLabel}</p>
          <p className="mt-1 font-display text-3xl font-extrabold text-primary">{formatCurrency(balance)}</p>
          {!hasBank ? (
            <p className="mt-2 text-sm text-ink-muted">
              {t.bankHint}{' '}
              <Link href="/user/profile" className="font-semibold text-primary underline">
                {t.bankLink}
              </Link>
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-sm">
            <span className="font-medium">Amount (₹)</span>
            <input
              type="number"
              min={1}
              className="mt-1 block w-36 rounded-lg border border-line px-3 py-2"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={!hasBank}
            />
          </label>
          <Button variant="accent" loading={withdrawing} onClick={onWithdraw} disabled={!hasBank}>
            {t.withdrawButton}
          </Button>
        </div>
      </Card>

      <Card padding={false}>
        <div className="border-b border-line px-4 py-3">
          <h2 className="font-display text-lg font-bold">{t.requestsTitle}</h2>
          <p className="text-sm text-ink-muted">{t.requestsSubtitle}</p>
        </div>
        {withdrawals.length ? (
          <Table headers={[t.table.date, t.table.amount, t.table.bank, t.table.status]}>
            {withdrawals.map((w) => (
              <Tr key={w.id}>
                <Td>{formatDate(w.created_at)}</Td>
                <Td>{formatCurrency(w.amount_inr)}</Td>
                <Td>
                  ****{String(w.bank_account_number).slice(-4)} · {w.bank_ifsc}
                  {w.payout_utr ? <div className="text-xs text-ink-muted">UTR: {w.payout_utr}</div> : null}
                  {w.failure_reason ? <div className="text-xs text-danger">{w.failure_reason}</div> : null}
                </Td>
                <Td>
                  <Badge
                    tone={
                      w.status === 'paid' ? 'success' : w.status === 'pending' || w.status === 'processing' ? 'warning' : 'danger'
                    }
                  >
                    {w.status}
                  </Badge>
                </Td>
              </Tr>
            ))}
          </Table>
        ) : (
          <div className="px-4 py-8 text-sm text-ink-muted">{t.noRequests}</div>
        )}
      </Card>

      <Card padding={false}>
        {rows.length ? (
          <Table headers={[t.table.date, t.table.type, t.table.description, t.table.amount, t.table.status]}>
            {rows.map((txn) => (
              <Tr key={txn.id}>
                <Td>{formatDate(txn.date)}</Td>
                <Td>{t.types[txn.type] || txn.type}</Td>
                <Td>{txn.description}</Td>
                <Td>₹{txn.amount.toLocaleString('en-IN')}</Td>
                <Td>
                  <Badge tone={txn.status === 'completed' ? 'success' : 'warning'}>{txn.status}</Badge>
                </Td>
              </Tr>
            ))}
          </Table>
        ) : (
          <EmptyState icon={Wallet} title={t.emptyTitle} description={t.emptyDescription} />
        )}
      </Card>
    </div>
  );
}
