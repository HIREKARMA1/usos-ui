'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Banknote, X } from 'lucide-react';
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
  amount_paise: number;
  status: string;
  user_name?: string;
  user_email?: string;
  referral_code?: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_ifsc: string;
  bank_name?: string | null;
  beneficiary_upi_id?: string | null;
  payout_provider?: string | null;
  payout_id?: string | null;
  payout_utr?: string | null;
  payout_mode?: string | null;
  failure_reason?: string | null;
  upi_intent_url?: string | null;
  paid_at?: string | null;
  paid_by_name?: string | null;
  created_at: string;
};

function statusTone(status: string): 'warning' | 'success' | 'danger' | 'default' {
  if (status === 'paid') return 'success';
  if (status === 'pending' || status === 'processing' || status === 'payment_pending') return 'warning';
  if (status === 'failed' || status === 'rejected') return 'danger';
  return 'default';
}

function errorDetail(error: any, fallback: string) {
  const detail = error?.response?.data?.detail;
  return typeof detail === 'string' ? detail : fallback;
}

function openUpiApp(url: string) {
  const link = document.createElement('a');
  link.href = url;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export default function AdminWithdrawalsPage() {
  const t = useContent('admin').withdrawals;
  const [rows, setRows] = useState<WithdrawalRow[]>([]);
  const [provider, setProvider] = useState('mock');
  const [automatic, setAutomatic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selected, setSelected] = useState<WithdrawalRow | null>(null);
  const [upiUrl, setUpiUrl] = useState<string | null>(null);
  const [step, setStep] = useState<'choose' | 'confirm' | 'waiting'>('choose');
  const [utr, setUtr] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await api.getAdminWithdrawals();
      setProvider(data.payout_provider || 'mock');
      setAutomatic(Boolean(data.automatic_payout));
      setRows(data.items || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function closeModal() {
    setSelected(null);
    setUpiUrl(null);
    setStep('choose');
    setUtr('');
  }

  function openPay(row: WithdrawalRow) {
    setSelected(row);
    setUtr('');
    setUpiUrl(row.upi_intent_url || null);
    if (row.status === 'payment_pending' || row.status === 'processing') {
      setStep(row.payout_provider && row.payout_provider !== 'manual' ? 'waiting' : 'confirm');
    } else {
      setStep('choose');
    }
  }

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t.modal.copied);
    } catch {
      toast.error(t.approveFailed);
    }
  }

  async function payUpi() {
    if (!selected) return;
    setBusyId(selected.id);
    try {
      const result = await api.startWithdrawalUpi(selected.id);
      setSelected(result.withdrawal);
      setUpiUrl(result.upi_intent_url);
      setStep('confirm');
      if (result.upi_intent_url) openUpiApp(result.upi_intent_url);
      toast.success(t.started);
      await load();
    } catch (e: any) {
      toast.error(errorDetail(e, t.approveFailed));
    } finally {
      setBusyId(null);
    }
  }

  async function payBank() {
    if (!selected) return;
    setBusyId(selected.id);
    try {
      const result = await api.startWithdrawalBank(selected.id);
      setSelected(result.withdrawal);
      setUpiUrl(null);
      setStep('confirm');
      toast.success(t.started);
      await load();
    } catch (e: any) {
      toast.error(errorDetail(e, t.approveFailed));
    } finally {
      setBusyId(null);
    }
  }

  async function payApi() {
    if (!selected) return;
    setBusyId(selected.id);
    try {
      const updated = await api.startWithdrawalPayout(selected.id);
      setSelected(updated);
      setStep('waiting');
      toast.success(t.started);
      await load();
    } catch (e: any) {
      toast.error(errorDetail(e, t.approveFailed));
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function confirmPayment() {
    if (!selected) return;
    setBusyId(selected.id);
    try {
      await api.confirmWithdrawalPayment(selected.id, utr.trim());
      toast.success(t.approved);
      closeModal();
      await load();
    } catch (e: any) {
      toast.error(errorDetail(e, t.approveFailed));
    } finally {
      setBusyId(null);
    }
  }

  async function cancelPayment() {
    if (!selected) return;
    setBusyId(selected.id);
    try {
      await api.cancelWithdrawalPayment(selected.id);
      toast.success(t.cancelled);
      closeModal();
      await load();
    } catch (e: any) {
      toast.error(errorDetail(e, t.approveFailed));
    } finally {
      setBusyId(null);
    }
  }

  async function refreshPayout() {
    if (!selected) return;
    setBusyId(selected.id);
    try {
      const updated = await api.syncWithdrawalPayout(selected.id);
      setSelected(updated);
      if (updated.status === 'paid') {
        toast.success(t.approved);
        closeModal();
      }
      await load();
    } catch (e: any) {
      toast.error(errorDetail(e, t.approveFailed));
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
      toast.error(errorDetail(e, t.approveFailed));
    } finally {
      setBusyId(null);
    }
  }

  const upiId = selected?.beneficiary_upi_id || '';
  const canPay =
    selected && (selected.status === 'pending' || selected.status === 'failed' || step !== 'choose');

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
                  {r.referral_code ? <div className="text-xs text-ink-muted">{r.referral_code}</div> : null}
                </Td>
                <Td className="font-semibold">{formatCurrency(r.amount_inr)}</Td>
                <Td>
                  <div className="text-sm">{r.bank_account_name}</div>
                  <div className="text-xs text-ink-muted">
                    ****{String(r.bank_account_number).slice(-4)} · {r.bank_ifsc}
                  </div>
                  {r.bank_name ? <div className="text-xs text-ink-muted">{r.bank_name}</div> : null}
                  {r.payout_utr ? <div className="mt-1 text-xs text-ink-muted">UTR: {r.payout_utr}</div> : null}
                  {r.failure_reason ? <div className="mt-1 text-xs text-danger">{r.failure_reason}</div> : null}
                </Td>
                <Td>{formatDate(r.created_at)}</Td>
                <Td>
                  <Badge tone={statusTone(r.status)}>{t.statuses?.[r.status] || r.status}</Badge>
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-2">
                    {(r.status === 'pending' || r.status === 'failed') && (
                      <>
                        <Button size="sm" loading={busyId === r.id} onClick={() => openPay(r)}>
                          {r.status === 'failed' ? t.retry : t.approve}
                        </Button>
                        <Button size="sm" variant="danger" loading={busyId === r.id} onClick={() => reject(r.id)}>
                          {t.reject}
                        </Button>
                      </>
                    )}
                    {(r.status === 'payment_pending' || r.status === 'processing') && (
                      <Button size="sm" variant="outline" onClick={() => openPay(r)}>
                        {t.continuePay}
                      </Button>
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

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label={t.modal.close} onClick={closeModal} />
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-surface-card p-6 shadow-none">
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 className="font-display text-lg font-bold text-ink">{t.modal.title}</h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1.5 text-ink-muted transition hover:bg-surface-muted hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <dl className="grid grid-cols-[8rem_1fr] gap-x-3 gap-y-2 text-sm">
              <dt className="text-ink-muted">{t.modal.member}</dt>
              <dd className="font-medium text-ink">{selected.user_name || '—'}</dd>
              <dt className="text-ink-muted">{t.modal.accountName}</dt>
              <dd className="font-medium text-ink">{selected.bank_account_name}</dd>
              <dt className="text-ink-muted">{t.modal.accountNumber}</dt>
              <dd className="flex items-center gap-2 font-mono text-ink">
                {selected.bank_account_number}
                <button type="button" className="text-xs font-semibold text-primary" onClick={() => copyText(selected.bank_account_number)}>
                  {t.modal.copy}
                </button>
              </dd>
              <dt className="text-ink-muted">{t.modal.ifsc}</dt>
              <dd className="flex items-center gap-2 font-mono text-ink">
                {selected.bank_ifsc}
                <button type="button" className="text-xs font-semibold text-primary" onClick={() => copyText(selected.bank_ifsc)}>
                  {t.modal.copy}
                </button>
              </dd>
              <dt className="text-ink-muted">{t.modal.bank}</dt>
              <dd className="font-medium text-ink">{selected.bank_name || '—'}</dd>
              <dt className="text-ink-muted">{t.modal.amount}</dt>
              <dd className="text-base font-bold text-ink">{formatCurrency(selected.amount_inr)}</dd>
              <dt className="text-ink-muted">{t.modal.upi}</dt>
              <dd className="font-medium text-ink">
                {upiId ? (
                  <span className="flex items-center gap-2">
                    {upiId}
                    <button type="button" className="text-xs font-semibold text-primary" onClick={() => copyText(upiId)}>
                      {t.modal.copy}
                    </button>
                  </span>
                ) : (
                  <span className="text-ink-muted">{t.modal.noUpi}</span>
                )}
              </dd>
            </dl>

            {step === 'choose' && canPay ? (
              <div className="mt-5 flex flex-wrap gap-2">
                <Button size="sm" disabled={!upiId} loading={busyId === selected.id} onClick={payUpi}>
                  {t.modal.payUpi}
                </Button>
                <Button size="sm" variant="outline" loading={busyId === selected.id} onClick={payBank}>
                  {t.modal.payBank}
                </Button>
                {automatic ? (
                  <Button size="sm" variant="secondary" loading={busyId === selected.id} onClick={payApi}>
                    {t.modal.payApi}
                  </Button>
                ) : null}
              </div>
            ) : null}

            {step === 'confirm' ? (
              <div className="mt-5 space-y-3">
                <p className="text-sm text-ink-muted">{t.modal.utrHint}</p>
                {upiUrl ? (
                  <button type="button" className="text-sm font-semibold text-primary" onClick={() => openUpiApp(upiUrl)}>
                    {t.modal.payUpi}
                  </button>
                ) : null}
                <label className="block text-sm">
                  <span className="font-medium">{t.modal.utr}</span>
                  <input
                    className="mt-1 block w-full rounded-lg border border-line bg-surface-card px-3 py-2 font-mono text-sm text-ink"
                    value={utr}
                    onChange={(e) => setUtr(e.target.value)}
                    autoComplete="off"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" loading={busyId === selected.id} disabled={!utr.trim()} onClick={confirmPayment}>
                    {t.modal.confirm}
                  </Button>
                  <Button size="sm" variant="ghost" loading={busyId === selected.id} onClick={cancelPayment}>
                    {t.modal.notCompleted}
                  </Button>
                </div>
              </div>
            ) : null}

            {step === 'waiting' ? (
              <div className="mt-5 space-y-3">
                <p className="text-sm text-ink-muted">{t.modal.waiting}</p>
                <Button size="sm" variant="outline" loading={busyId === selected.id} onClick={refreshPayout}>
                  {t.modal.refresh}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
