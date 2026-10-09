'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ImagePlus,
  IndianRupee,
  QrCode,
  Search,
  Settings2,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { KpiCard } from '@/components/dashboard/admin/KpiCard';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useContent } from '@/hooks/useContent';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { resolveUploadUrl } from '@/lib/media';
import { formatCurrency, formatDateTime, getInitials } from '@/lib/format';
import type { AdminPaymentRow, PaymentSettings } from '@/types';

const PAGE_SIZE = 10;

const AVATAR_COLORS = [
  'from-[#6C63FF] to-[#4F46E5]',
  'from-[#22C55E] to-[#16A34A]',
  'from-[#F59E0B] to-[#D97706]',
  'from-[#EF4444] to-[#DC2626]',
  'from-[#06B6D4] to-[#0891B2]',
  'from-[#A855F7] to-[#9333EA]',
];

const controlClass =
  'h-10 rounded-xl border border-line bg-surface-card text-sm text-ink transition duration-300 focus:border-[#6C63FF]/50 focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/90';

const iconBtnClass =
  'flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface-muted text-ink-muted transition duration-300 hover:bg-surface-soft hover:text-ink disabled:pointer-events-none disabled:opacity-30 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/60 dark:hover:bg-white/[0.08] dark:hover:text-white';

type StatusFilter = 'all' | 'pending_approval' | 'approved' | 'rejected';
type Dialog = { type: 'approve' | 'reject'; row: AdminPaymentRow } | null;

function avatarGradient(name: string) {
  const index = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

function errorDetail(err: unknown, fallback: string) {
  const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail[0] && typeof detail[0] === 'object' && 'msg' in detail[0]) {
    return String((detail[0] as { msg?: string }).msg || fallback);
  }
  return fallback;
}

function shortId(id: string) {
  return id.replace(/-/g, '').slice(0, 8).toUpperCase();
}

function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | 'ellipsis')[] = [1];
  if (current > 3) pages.push('ellipsis');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i += 1) pages.push(i);
  if (current < total - 2) pages.push('ellipsis');
  pages.push(total);
  return pages;
}

function StatusBadge({ status, labels }: { status: string; labels: Record<string, string> }) {
  const styles: Record<string, { badge: string; dot: string }> = {
    pending_approval: {
      badge: 'bg-amber-500/10 text-amber-700 dark:bg-[#F59E0B]/15 dark:text-[#F59E0B]',
      dot: 'bg-amber-500 dark:bg-[#F59E0B]',
    },
    approved: {
      badge: 'bg-emerald-500/10 text-emerald-700 dark:bg-[#22C55E]/15 dark:text-[#22C55E]',
      dot: 'bg-emerald-500 dark:bg-[#22C55E]',
    },
    rejected: {
      badge: 'bg-red-500/10 text-red-600 dark:bg-[#EF4444]/15 dark:text-[#EF4444]',
      dot: 'bg-red-500 dark:bg-[#EF4444]',
    },
  };
  const style = styles[status] || {
    badge: 'bg-surface-muted text-ink-muted',
    dot: 'bg-ink-muted',
  };
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', style.badge)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
      {labels[status] || status}
    </span>
  );
}

export default function AdminPaymentsPage() {
  const t = useContent('admin').payments;
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AdminPaymentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [dialog, setDialog] = useState<Dialog>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, statusFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getAdminPayments({
        q: debouncedQ || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        page,
        page_size: PAGE_SIZE,
      });
      setRows(data.items || []);
      setTotal(data.total || 0);
      setStats(data.stats || { total: 0, pending: 0, approved: 0, rejected: 0 });
    } catch (err: unknown) {
      toast.error(errorDetail(err, t.loadError));
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, statusFilter, page, t.loadError]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void api
      .getPaymentSettings()
      .then(setSettings)
      .catch((err: unknown) => toast.error(errorDetail(err, t.settingsError)));
  }, [t.settingsError]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageNumbers = getPageNumbers(page, totalPages);
  const statusLabels = t.status as Record<string, string>;
  const filters = t.filters as Record<string, string>;

  const filterCounts: Record<StatusFilter, number | null> = {
    all: stats.total,
    pending_approval: stats.pending,
    approved: stats.approved,
    rejected: stats.rejected,
  };

  async function confirmAction() {
    if (!dialog) return;
    if (dialog.type === 'reject' && reason.trim().length < 3) {
      toast.error(t.rejectReasonRequired);
      return;
    }
    setBusy(true);
    try {
      if (dialog.type === 'approve') {
        await api.approveAdminPayment(dialog.row.id);
        toast.success(t.approvedToast);
      } else {
        await api.rejectAdminPayment(dialog.row.id, reason.trim());
        toast.success(t.rejectedToast);
      }
      setDialog(null);
      setReason('');
      await load();
    } catch (err: unknown) {
      toast.error(errorDetail(err, t.loadError));
    } finally {
      setBusy(false);
    }
  }

  async function saveSettings(event: FormEvent) {
    event.preventDefault();
    if (!settings) return;
    setSavingSettings(true);
    try {
      const saved = await api.updatePaymentSettings({
        upi_id: settings.upi_id.trim(),
        display_name: settings.display_name.trim(),
        qr_code_url: settings.qr_code_url || null,
        instructions: settings.instructions.trim(),
      });
      setSettings(saved);
      setSettingsOpen(false);
      toast.success(t.settingsSaved);
    } catch (err: unknown) {
      toast.error(errorDetail(err, t.settingsError));
    } finally {
      setSavingSettings(false);
    }
  }

  async function onUploadQr(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await api.uploadPaymentQr(file);
      setSettings((current) => (current ? { ...current, qr_code_url: url } : current));
      toast.success(t.qrUploaded);
    } catch (err: unknown) {
      toast.error(errorDetail(err, t.settingsError));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="-m-4 min-h-full bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100 p-4 sm:-m-6 sm:p-6 lg:-m-8 lg:p-8 dark:from-[#050B17] dark:via-[#091426] dark:to-[#0D1B2A]">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted dark:text-white/40">
              {t.breadcrumb} / {t.title}
            </p>
            <h1 className="mt-1 text-lg font-semibold tracking-tight text-ink sm:text-xl dark:text-white">{t.title}</h1>
            <p className="mt-0.5 max-w-xl text-sm text-ink-muted dark:text-white/50">{t.subtitle}</p>
            {settings?.upi_id ? (
              <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-xl border border-[#F5821F]/20 bg-[#F5821F]/8 px-3 py-1.5 text-xs font-medium text-ink-secondary dark:border-[#F5821F]/25 dark:bg-[#F5821F]/10 dark:text-white/70">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#F5821F]/15 text-[#F5821F]">
                  <QrCode className="h-3 w-3" />
                </span>
                <span className="truncate">
                  {(t.upiConfigured || 'Paying to {upi}').replace('{upi}', settings.upi_id)}
                </span>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="inline-flex h-9 shrink-0 items-center gap-2 self-start rounded-xl border border-line bg-surface-card px-3.5 text-sm font-semibold text-ink transition hover:bg-surface-muted dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-white/90 dark:hover:bg-white/[0.08]"
          >
            <Settings2 className="h-3.5 w-3.5 text-ink-muted dark:text-white/50" />
            {t.configureUpi || 'UPI settings'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <KpiCard label={t.stats.total} value={stats.total} icon={IndianRupee} tone="info" />
          <KpiCard label={t.stats.pending} value={stats.pending} icon={Clock} tone="warning" />
          <KpiCard label={t.stats.approved} value={stats.approved} icon={CheckCircle2} tone="success" />
          <KpiCard label={t.stats.rejected} value={stats.rejected} icon={XCircle} tone="danger" />
        </div>

        <div
          className={cn(
            'overflow-hidden rounded-2xl border shadow-sm backdrop-blur-sm',
            'border-slate-200/80 bg-white/90 shadow-[0_4px_24px_rgba(15,23,42,0.06)]',
            'dark:border-white/[0.08] dark:bg-white/[0.03] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] dark:backdrop-blur-xl'
          )}
        >
          <div className="border-b border-line p-4 sm:p-5 dark:border-white/[0.06]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative min-w-0 max-w-md flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted dark:text-white/40" />
                <input
                  type="search"
                  value={q}
                  onChange={(event) => setQ(event.target.value)}
                  placeholder={filters.search}
                  className={cn(controlClass, 'w-full pl-9 pr-3 placeholder:text-ink-muted dark:placeholder:text-white/40')}
                />
              </div>
              <div className="flex flex-wrap gap-1.5 rounded-xl bg-surface-muted/70 p-1 dark:bg-white/[0.04]">
                {(['all', 'pending_approval', 'approved', 'rejected'] as StatusFilter[]).map((key) => {
                  const count = filterCounts[key];
                  const active = statusFilter === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setStatusFilter(key)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                        active
                          ? 'bg-white text-ink shadow-sm dark:bg-white/[0.12] dark:text-white'
                          : 'text-ink-muted hover:text-ink dark:text-white/45 dark:hover:text-white/80'
                      )}
                    >
                      {filters[key]}
                      {count != null ? (
                        <span
                          className={cn(
                            'rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                            active
                              ? 'bg-primary/10 text-primary dark:bg-[#6C63FF]/25 dark:text-[#A5A0FF]'
                              : 'bg-black/[0.04] text-ink-muted dark:bg-white/[0.06] dark:text-white/40'
                          )}
                        >
                          {count}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-line bg-surface-muted/80 dark:border-white/[0.06] dark:bg-white/[0.04]">
                      {[
                        t.table.user,
                        t.table.type || 'Type',
                        t.table.email,
                        t.table.application,
                        t.table.amount,
                        t.table.utr,
                        t.table.submitted,
                        t.table.status,
                        t.table.action,
                      ].map((label) => (
                        <th
                          key={label}
                          className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted dark:text-white/45"
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-16 text-center text-sm text-ink-muted dark:text-white/40">
                          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-muted dark:bg-white/[0.04]">
                            <IndianRupee className="h-5 w-5 opacity-50" />
                          </div>
                          <p className="mt-3 font-medium text-ink-secondary dark:text-white/60">{t.empty}</p>
                          <p className="mt-1 text-xs">{t.emptyHint}</p>
                        </td>
                      </tr>
                    ) : (
                      rows.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b border-line/60 transition duration-200 last:border-0 hover:bg-surface-muted/50 dark:border-white/[0.04] dark:hover:bg-white/[0.025]"
                        >
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold text-white shadow-sm',
                                  avatarGradient(row.user_name)
                                )}
                              >
                                {getInitials(row.user_name)}
                              </div>
                              <p className="truncate font-medium text-ink dark:text-white">{row.user_name}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="inline-flex rounded-md bg-surface-muted px-2 py-0.5 text-[11px] font-semibold text-ink-secondary dark:bg-white/[0.06] dark:text-white/65">
                              {row.kind === 'shop' ? t.kinds?.shop || 'Shop' : t.kinds?.membership || 'Membership'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-ink-secondary dark:text-white/65">{row.email}</td>
                          <td className="px-4 py-3.5 font-mono text-xs text-ink-secondary dark:text-white/60" title={row.application_id}>
                            {shortId(row.application_id)}
                          </td>
                          <td className="px-4 py-3.5 font-semibold tabular-nums text-ink dark:text-white">
                            {formatCurrency((row.amount_paise || 0) / 100)}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs text-ink-secondary dark:text-white/60">
                            {row.transaction_id || '—'}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-ink-secondary dark:text-white/65">
                            {row.submitted_at ? formatDateTime(row.submitted_at) : '—'}
                          </td>
                          <td className="px-4 py-3.5">
                            <StatusBadge status={row.status} labels={statusLabels} />
                          </td>
                          <td className="px-4 py-3.5">
                            {row.status === 'pending_approval' ? (
                              <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReason('');
                                    setDialog({ type: 'approve', row });
                                  }}
                                  className="rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-500/20 dark:text-[#22C55E]"
                                >
                                  {t.approve}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReason('');
                                    setDialog({ type: 'reject', row });
                                  }}
                                  className="rounded-lg bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-500/20 dark:text-[#EF4444]"
                                >
                                  {t.reject}
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-ink-muted dark:text-white/30">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {total > 0 ? (
                <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3.5 dark:border-white/[0.06]">
                  <p className="hidden text-xs text-ink-muted sm:block dark:text-white/40">
                    {total} {total === 1 ? 'payment' : 'payments'}
                  </p>
                  <div className="flex flex-1 items-center justify-center gap-1.5 sm:flex-none">
                    <button
                      type="button"
                      className={iconBtnClass}
                      disabled={page === 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {pageNumbers.map((item, index) =>
                      item === 'ellipsis' ? (
                        <span key={`e-${index}`} className="px-1 text-sm text-ink-muted">
                          …
                        </span>
                      ) : (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setPage(item)}
                          className={cn(
                            'flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium transition',
                            page === item ? 'bg-[#6C63FF] text-white shadow-sm' : iconBtnClass
                          )}
                        >
                          {item}
                        </button>
                      )
                    )}
                    <button
                      type="button"
                      className={iconBtnClass}
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      {settingsOpen && settings ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            aria-label={t.cancel}
            disabled={savingSettings || uploading}
            onClick={() => !savingSettings && !uploading && setSettingsOpen(false)}
          />
          <form
            onSubmit={(event) => void saveSettings(event)}
            className="relative flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-line bg-surface-card shadow-xl sm:rounded-2xl dark:border-white/[0.08] dark:bg-[#0B1220]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="upi-settings-title"
          >
            <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4 dark:border-white/[0.06]">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F5821F]/12 text-[#F5821F]">
                  <QrCode className="h-4 w-4" strokeWidth={2.25} />
                </span>
                <div>
                  <h2 id="upi-settings-title" className="text-sm font-semibold text-ink dark:text-white">
                    {t.settingsTitle}
                  </h2>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{t.settingsHint}</p>
                </div>
              </div>
              <button
                type="button"
                disabled={savingSettings || uploading}
                onClick={() => setSettingsOpen(false)}
                className="rounded-lg p-1 text-ink-muted transition hover:bg-surface-muted hover:text-ink dark:hover:bg-white/[0.06]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto">
              <div className="grid gap-0 lg:grid-cols-[1.35fr_0.9fr]">
                <div className="space-y-5 p-5">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                      {t.merchantSection || 'Merchant details'}
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label className="block space-y-1.5">
                        <span className="text-sm font-medium text-ink dark:text-white/90">{t.upiId}</span>
                        <input
                          className={cn(controlClass, 'w-full px-3 font-mono text-[13px]')}
                          value={settings.upi_id}
                          onChange={(event) => setSettings({ ...settings, upi_id: event.target.value })}
                          placeholder="name@upi"
                          required
                        />
                      </label>
                      <label className="block space-y-1.5">
                        <span className="text-sm font-medium text-ink dark:text-white/90">{t.displayName}</span>
                        <input
                          className={cn(controlClass, 'w-full px-3')}
                          value={settings.display_name}
                          onChange={(event) => setSettings({ ...settings, display_name: event.target.value })}
                          required
                        />
                      </label>
                    </div>
                  </div>

                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-ink dark:text-white/90">{t.instructions}</span>
                    <textarea
                      rows={5}
                      className="w-full resize-y rounded-xl border border-line bg-surface-muted/40 px-3 py-2.5 text-sm leading-relaxed text-ink transition duration-300 focus:border-[#6C63FF]/50 focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white/90"
                      value={settings.instructions}
                      onChange={(event) => setSettings({ ...settings, instructions: event.target.value })}
                      required
                    />
                    <span className="text-xs text-ink-muted">{t.instructionsHint}</span>
                  </label>
                </div>

                <div className="border-t border-line/80 bg-surface-muted/30 p-5 lg:border-l lg:border-t-0 dark:border-white/[0.06] dark:bg-white/[0.02]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                    {t.qrSection || 'Static QR (optional)'}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-muted">{t.qrOptionalHint}</p>

                  <div className="mt-4 flex flex-col items-stretch gap-3">
                    <div className="flex aspect-square max-h-44 w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-line bg-white dark:border-white/[0.1] dark:bg-[#050B17]">
                      {settings.qr_code_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={resolveUploadUrl(settings.qr_code_url)}
                          alt={t.qrUrl}
                          className="h-full w-full object-contain p-3"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 px-4 text-center text-ink-muted">
                          <ImagePlus className="h-7 w-7 opacity-40" />
                          <span className="text-xs font-medium">No image yet</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex cursor-pointer items-center">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          className="sr-only"
                          onChange={(event) => void onUploadQr(event.target.files?.[0])}
                        />
                        <span className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line bg-surface-card px-3 text-sm font-semibold text-ink transition hover:bg-surface-soft dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-white/90 dark:hover:bg-white/[0.08]">
                          <ImagePlus className="h-3.5 w-3.5" />
                          {uploading ? t.uploading : settings.qr_code_url ? t.replaceQr || t.uploadQr : t.uploadQr}
                        </span>
                      </label>
                      {settings.qr_code_url ? (
                        <button
                          type="button"
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line px-3 text-sm font-semibold text-ink-muted transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-white/[0.1] dark:hover:border-red-500/40 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                          onClick={() => setSettings({ ...settings, qr_code_url: null })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {t.removeQr || 'Remove'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-line px-5 py-3 dark:border-white/[0.06]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={savingSettings || uploading}
                onClick={() => setSettingsOpen(false)}
              >
                {t.cancel}
              </Button>
              <Button type="submit" size="sm" loading={savingSettings}>
                {t.saveSettings}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {dialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            onClick={() => !busy && setDialog(null)}
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-line bg-surface-card shadow-xl dark:border-white/[0.08] dark:bg-[#0B1220]">
            <div className="flex items-start gap-3 border-b border-line px-5 py-4 dark:border-white/[0.06]">
              <span
                className={cn(
                  'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                  dialog.type === 'approve'
                    ? 'bg-emerald-500/12 text-emerald-600 dark:text-[#22C55E]'
                    : 'bg-red-500/12 text-red-600 dark:text-[#EF4444]'
                )}
              >
                {dialog.type === 'approve' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-ink dark:text-white">
                  {dialog.type === 'approve' ? t.approveTitle : t.rejectTitle}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-ink-secondary dark:text-white/60">
                  {(dialog.type === 'approve' ? t.approveConfirm : t.rejectConfirm).replace('{name}', dialog.row.user_name)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => !busy && setDialog(null)}
                className="rounded-lg p-1 text-ink-muted transition hover:bg-surface-muted hover:text-ink dark:hover:bg-white/[0.06]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              <div className="rounded-xl border border-line bg-surface-muted/50 px-3.5 py-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink dark:text-white">{dialog.row.user_name}</p>
                    <p className="mt-0.5 font-mono text-xs text-ink-muted dark:text-white/45">
                      {dialog.row.transaction_id || shortId(dialog.row.application_id)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold tabular-nums text-ink dark:text-white">
                    {formatCurrency((dialog.row.amount_paise || 0) / 100)}
                  </p>
                </div>
              </div>

              {dialog.type === 'reject' ? (
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-ink dark:text-white/90">{t.rejectReasonLabel}</span>
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder={t.rejectReasonPlaceholder}
                    className="w-full resize-none rounded-xl border border-line bg-surface-card px-3 py-2.5 text-sm text-ink transition focus:border-[#6C63FF]/50 focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white/90"
                  />
                </label>
              ) : null}

              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => setDialog(null)}>
                  {t.cancel}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={dialog.type === 'approve' ? 'primary' : 'danger'}
                  loading={busy}
                  onClick={() => void confirmAction()}
                >
                  {dialog.type === 'approve' ? t.confirmApprove : t.confirmReject}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
