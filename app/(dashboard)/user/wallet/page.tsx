'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowUpRight,
  Award,
  Coins,
  Eye,
  EyeOff,
  Gift,
  ShoppingBag,
  Wallet as WalletIcon,
  X,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, Td, Tr } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { useContent } from '@/hooks/useContent';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Transaction, TransactionType } from '@/types';

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

type TabKey = 'overview' | 'transactions' | 'withdrawals';

function formatWalletAmount(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function isDebit(txn: Transaction): boolean {
  return txn.type === 'withdrawal' || txn.type === 'payment';
}

function txnIcon(type: TransactionType) {
  switch (type) {
    case 'reward':
    case 'binary':
      return { Icon: Award, bg: 'bg-secondary-100 text-secondary-600' };
    case 'referral':
      return { Icon: Gift, bg: 'bg-green/10 text-green' };
    case 'withdrawal':
      return { Icon: ArrowUpRight, bg: 'bg-red/10 text-red' };
    case 'payment':
      return { Icon: ShoppingBag, bg: 'bg-red/10 text-red' };
    default:
      return { Icon: Coins, bg: 'bg-primary-100 text-primary' };
  }
}

export default function WalletPage() {
  const t = useContent('dashboard').wallet;
  const [rows, setRows] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [balance, setBalance] = useState(0);
  const [hasBank, setHasBank] = useState(false);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [tab, setTab] = useState<TabKey>('overview');
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);

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

  const stats = useMemo(() => {
    const totalEarnings = rows
      .filter((txn) => !isDebit(txn))
      .reduce((sum, txn) => sum + txn.amount, 0);
    const totalWithdrawn = withdrawals
      .filter((w) => w.status === 'paid')
      .reduce((sum, w) => sum + w.amount_inr, 0);
    const pendingWithdrawals = withdrawals
      .filter((w) => w.status === 'pending' || w.status === 'processing')
      .reduce((sum, w) => sum + w.amount_inr, 0);
    return { totalEarnings, totalWithdrawn, pendingWithdrawals };
  }, [rows, withdrawals]);

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
      setShowWithdraw(false);
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Withdrawal failed');
    } finally {
      setWithdrawing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: t.tabs.overview },
    { key: 'transactions', label: t.tabs.transactions },
    { key: 'withdrawals', label: t.tabs.withdrawals },
  ];

  const recentRows = rows.slice(0, 4);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-extrabold text-ink">{t.title}</h1>

      {/* Balance hero card */}
      <div className="relative overflow-hidden rounded-xl bg-primary-900 px-6 py-6 shadow-none sm:px-8 sm:py-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white/70">{t.balanceLabel}</p>
            <p className="mt-2 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {balanceVisible ? formatWalletAmount(balance) : '••••••'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setBalanceVisible((v) => !v)}
              className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
              aria-label={balanceVisible ? 'Hide balance' : 'Show balance'}
            >
              {balanceVisible ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </button>
            <Button
              variant="outline"
              className="border-0 bg-white font-semibold text-primary-900 hover:bg-white/90"
              onClick={() => setShowWithdraw(true)}
            >
              {t.withdrawButton}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-line">
        <div className="flex gap-6 overflow-x-auto sm:gap-8" role="tablist">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={tab === item.key}
              onClick={() => setTab(item.key)}
              className={cn(
                'shrink-0 border-b-2 pb-3 text-sm font-semibold transition sm:text-base',
                tab === item.key
                  ? 'border-primary text-ink'
                  : 'border-transparent text-ink-muted hover:text-ink'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview tab */}
      {tab === 'overview' ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: t.totalEarned, value: stats.totalEarnings },
              { label: t.totalWithdrawn, value: stats.totalWithdrawn },
              { label: t.pendingWithdrawals, value: stats.pendingWithdrawals },
            ].map((stat) => (
              <Card key={stat.label} className="!p-4 sm:!p-5">
                <p className="text-xs font-medium text-ink-muted">{stat.label}</p>
                <p className="mt-2 font-display text-xl font-bold text-ink sm:text-2xl">
                  {formatWalletAmount(stat.value)}
                </p>
              </Card>
            ))}
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-ink">{t.recentTransactions}</h2>
              {rows.length > 4 ? (
                <button
                  type="button"
                  onClick={() => setTab('transactions')}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  {t.viewAll}
                </button>
              ) : null}
            </div>

            {recentRows.length ? (
              <Card padding={false} className="divide-y divide-line overflow-hidden">
                {recentRows.map((txn) => {
                  const debit = isDebit(txn);
                  const { Icon, bg } = txnIcon(txn.type);
                  return (
                    <div key={txn.id} className="flex items-center gap-4 px-4 py-4 sm:px-5">
                      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', bg)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-ink">{txn.description}</p>
                        <p className="mt-0.5 text-xs text-ink-muted">{formatDate(txn.date)}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={cn('font-bold', debit ? 'text-red' : 'text-green')}>
                          {debit ? '- ' : '+ '}
                          {formatCurrency(txn.amount)}
                        </p>
                        <p className={cn('mt-0.5 text-xs font-medium', debit ? 'text-red' : 'text-green')}>
                          {debit ? t.debit : t.credit}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </Card>
            ) : (
              <EmptyState icon={WalletIcon} title={t.emptyTitle} description={t.emptyDescription} />
            )}
          </div>
        </div>
      ) : null}

      {/* Transactions tab */}
      {tab === 'transactions' ? (
        <Card padding={false}>
          {rows.length ? (
            <Table headers={[t.table.date, t.table.type, t.table.description, t.table.amount, t.table.status]}>
              {rows.map((txn) => (
                <Tr key={txn.id}>
                  <Td>{formatDate(txn.date)}</Td>
                  <Td>{t.types[txn.type] || txn.type}</Td>
                  <Td>{txn.description}</Td>
                  <Td className={isDebit(txn) ? 'text-red' : 'text-green'}>
                    {isDebit(txn) ? '- ' : '+ '}
                    {formatCurrency(txn.amount)}
                  </Td>
                  <Td>
                    <Badge tone={txn.status === 'completed' ? 'success' : 'warning'}>{txn.status}</Badge>
                  </Td>
                </Tr>
              ))}
            </Table>
          ) : (
            <EmptyState icon={WalletIcon} title={t.emptyTitle} description={t.emptyDescription} />
          )}
        </Card>
      ) : null}

      {/* Withdrawals tab */}
      {tab === 'withdrawals' ? (
        <Card padding={false}>
          <div className="border-b border-line px-4 py-3 sm:px-5">
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
                        w.status === 'paid'
                          ? 'success'
                          : w.status === 'pending' || w.status === 'processing'
                            ? 'warning'
                            : 'danger'
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
      ) : null}

      {/* Withdraw modal */}
      {showWithdraw ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close"
            onClick={() => setShowWithdraw(false)}
          />
          <div className="relative w-full max-w-md rounded-xl bg-surface-card p-6 shadow-none">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-ink">{t.withdrawButton}</h2>
                <p className="mt-1 text-sm text-ink-muted">
                  {t.balanceLabel}: {formatWalletAmount(balance)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowWithdraw(false)}
                className="rounded-lg p-1.5 text-ink-muted transition hover:bg-surface-muted hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!hasBank ? (
              <p className="text-sm text-ink-muted">
                {t.bankHint}{' '}
                <Link href="/user/profile" className="font-semibold text-primary underline">
                  {t.bankLink}
                </Link>
              </p>
            ) : (
              <div className="flex flex-wrap items-end gap-3">
                <label className="flex-1 text-sm">
                  <span className="font-medium">Amount (₹)</span>
                  <input
                    type="number"
                    min={1}
                    className="mt-1 block w-full rounded-lg border border-line bg-surface-card px-3 py-2 text-sm text-ink placeholder:text-ink-muted"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    autoFocus
                  />
                </label>
                <Button variant="accent" loading={withdrawing} onClick={onWithdraw}>
                  {t.withdrawButton}
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
