'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Banknote, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, Td, Tr } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { useContent } from '@/hooks/useContent';
import { api } from '@/lib/api';
import { apiErrorMessage } from '@/lib/access';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';

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
  payout_utr?: string | null;
  failure_reason?: string | null;
  rejection_reason?: string | null;
  processed_by_name?: string | null;
  reviewed_at?: string | null;
  created_at: string;
};

type TabKey = 'queue' | 'history';
type DialogState = { type: 'pay' | 'reject'; row: WithdrawalRow } | null;

function statusTone(status: string): 'warning' | 'success' | 'danger' | 'default' {
  if (status === 'paid') return 'success';
  if (status === 'pending' || status === 'processing') return 'warning';
  if (status === 'failed' || status === 'rejected') return 'danger';
  return 'default';
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      <p className={cn('mt-0.5 break-all text-sm text-ink', mono && 'font-mono')}>{value || '—'}</p>
    </div>
  );
}

export default function AdminWithdrawalsPage() {
  const t = useContent('admin').withdrawals;
  const [tab, setTab] = useState<TabKey>('queue');
  const [rows, setRows] = useState<WithdrawalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [utr, setUtr] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  async function load(nextTab = tab) {
    setLoading(true);
    try {
      const data = await api.getAdminWithdrawals(undefined, nextTab);
      setRows(data.items || []);
    } catch (e: unknown) {
      toast.error(apiErrorMessage(e, 'Could not load withdrawals'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  function openPay(row: WithdrawalRow) {
    setUtr('');
    setReason('');
    setFormError('');
    setDialog({ type: 'pay', row });
  }

  function openReject(row: WithdrawalRow) {
    setUtr('');
    setReason('');
    setFormError('');
    setDialog({ type: 'reject', row });
  }

  function closeDialog() {
    if (busy) return;
    setDialog(null);
    setFormError('');
  }

  async function confirmPayment() {
    if (!dialog || dialog.type !== 'pay') return;
    setBusy(true);
    setFormError('');
    try {
      const updated = await api.confirmWithdrawalPayment(dialog.row.id, utr);
      if (updated.status !== 'paid') {
        throw new Error('Payment was not confirmed');
      }
      toast.success(t.paid);
      setDialog(null);
      await load();
    } catch (e: unknown) {
      const message = apiErrorMessage(e, t.payFailed);
      setFormError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function confirmReject() {
    if (!dialog || dialog.type !== 'reject') return;
    if (reason.trim().length < 3) {
      setFormError(t.reasonRequired);
      return;
    }
    setBusy(true);
    setFormError('');
    try {
      const updated = await api.rejectWithdrawal(dialog.row.id, reason.trim());
      if (updated.status !== 'rejected') {
        throw new Error('Rejection was not confirmed');
      }
      toast.success(t.rejected);
      setDialog(null);
      await load();
    } catch (e: unknown) {
      const message = apiErrorMessage(e, t.rejectFailed);
      setFormError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function copyAccount(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t.copied);
    } catch {
      toast.error('Could not copy');
    }
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'queue', label: t.queueTab },
    { key: 'history', label: t.historyTab },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">{t.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">{t.subtitle}</p>
        </div>
        <p className="text-xs font-medium text-ink-muted">{t.manualLabel}</p>
      </div>

      <div className="border-b border-line">
        <div className="flex gap-6 overflow-x-auto" role="tablist">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={tab === item.key}
              onClick={() => setTab(item.key)}
              className={cn(
                'shrink-0 border-b-2 px-1 pb-3 text-sm font-semibold transition',
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

      <Card padding={false}>
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : rows.length ? (
          tab === 'queue' ? (
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
                      <Button size="sm" onClick={() => openPay(r)}>
                        {r.status === 'failed' ? t.retry : t.approve}
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => openReject(r)}>
                        {t.reject}
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Table>
          ) : (
            <Table
              headers={[
                t.table.user,
                t.table.amount,
                t.table.processed,
                t.table.status,
                t.table.reference,
                t.table.processedBy,
                t.table.reason,
              ]}
              tableClassName="min-w-[880px]"
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
                  <Td>{formatDate(r.reviewed_at || r.created_at)}</Td>
                  <Td>
                    <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                  </Td>
                  <Td className="font-mono text-xs">{r.payout_utr || '—'}</Td>
                  <Td>{r.processed_by_name || '—'}</Td>
                  <Td className="max-w-[220px] whitespace-normal text-sm">
                    {r.status === 'rejected' ? r.rejection_reason || r.failure_reason || '—' : '—'}
                  </Td>
                </Tr>
              ))}
            </Table>
          )
        ) : (
          <EmptyState
            icon={Banknote}
            title={tab === 'history' ? t.historyEmptyTitle : t.emptyTitle}
            description={tab === 'history' ? t.historyEmptyDescription : t.emptyDescription}
          />
        )}
      </Card>

      {dialog ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            aria-label={t.close}
            onClick={closeDialog}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="withdrawal-dialog-title"
            className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-line bg-surface-card shadow-xl sm:rounded-2xl dark:border-white/[0.08]"
          >
            <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
              <div>
                <h2 id="withdrawal-dialog-title" className="text-base font-semibold text-ink">
                  {dialog.type === 'pay' ? t.payTitle : t.rejectTitle}
                </h2>
                <p className="mt-1 text-sm text-ink-muted">
                  {dialog.type === 'pay' ? t.payHint : t.rejectHint}
                </p>
              </div>
              <button
                type="button"
                onClick={closeDialog}
                className="rounded-lg p-1 text-ink-muted transition hover:bg-surface-muted hover:text-ink"
                aria-label={t.close}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              <div className="grid grid-cols-1 gap-3 rounded-xl border border-line bg-surface-muted/50 p-3.5 sm:grid-cols-2">
                <Detail label={t.table.user} value={dialog.row.user_name || '—'} />
                <Detail label={t.table.amount} value={formatCurrency(dialog.row.amount_inr)} />
                <Detail label={t.accountName} value={dialog.row.bank_account_name} />
                <Detail label={t.bankName} value={dialog.row.bank_name || '—'} />
                <div className="sm:col-span-2">
                  <div className="flex items-end justify-between gap-3">
                    <Detail label={t.accountNumber} value={dialog.row.bank_account_number} mono />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => copyAccount(dialog.row.bank_account_number)}
                    >
                      {t.copy}
                    </Button>
                  </div>
                </div>
                <Detail label={t.ifsc} value={dialog.row.bank_ifsc} mono />
                <Detail label={t.requestId} value={dialog.row.id} mono />
              </div>

              {dialog.type === 'pay' ? (
                <Input
                  label={t.utrLabel}
                  hint={t.utrHint}
                  placeholder={t.utrPlaceholder}
                  value={utr}
                  maxLength={100}
                  autoComplete="off"
                  onChange={(event) => setUtr(event.target.value)}
                />
              ) : (
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-ink">{t.reasonLabel}</span>
                  <textarea
                    rows={3}
                    value={reason}
                    maxLength={500}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder={t.reasonPlaceholder}
                    className="w-full resize-none rounded-lg border border-line bg-surface-card px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus-ring"
                  />
                </label>
              )}

              {formError ? <p className="text-sm text-accent-red">{formError}</p> : null}

              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" disabled={busy} onClick={closeDialog}>
                  {t.cancel}
                </Button>
                <Button
                  type="button"
                  variant={dialog.type === 'pay' ? 'primary' : 'danger'}
                  loading={busy}
                  onClick={() => void (dialog.type === 'pay' ? confirmPayment() : confirmReject())}
                >
                  {dialog.type === 'pay' ? t.confirmPayment : t.confirmReject}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
