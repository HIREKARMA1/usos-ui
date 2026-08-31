'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Search,
  ShieldCheck,
  ShieldX,
  X,
  XCircle,
} from 'lucide-react';
import { KpiCard } from '@/components/dashboard/admin/KpiCard';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useContent } from '@/hooks/useContent';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatDate, formatDateTime, getInitials } from '@/lib/format';
import type { KycRow, KycStats } from '@/types';

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

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';
type Dialog = { type: 'view' | 'approve' | 'reject' | 'reset'; row: KycRow } | null;

function avatarGradient(name: string) {
  const index = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

function formatAadhaar(value?: string | null) {
  if (!value) return '—';
  const digits = value.replace(/\D/g, '');
  if (digits.length >= 4) return `XXXX XXXX ${digits.slice(-4)}`;
  return value;
}

function shortId(id: string) {
  return id.replace(/-/g, '').slice(0, 8).toUpperCase();
}

function KycBadge({ status, labels }: { status: string; labels: Record<string, string> }) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-700 dark:bg-[#F59E0B]/15 dark:text-[#F59E0B]',
    approved: 'bg-emerald-500/10 text-emerald-700 dark:bg-[#22C55E]/15 dark:text-[#22C55E]',
    rejected: 'bg-red-500/10 text-red-600 dark:bg-[#EF4444]/15 dark:text-[#EF4444]',
  };
  const key = status === 'verified' ? 'approved' : status;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        styles[key] || 'bg-surface-muted text-ink-muted'
      )}
    >
      {labels[key] || status}
    </span>
  );
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

export default function AdminKycPage() {
  const t = useContent('admin').kyc;
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<KycRow[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<KycStats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [dialog, setDialog] = useState<Dialog>(null);
  const [detail, setDetail] = useState<KycRow | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

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
      const data = await api.getAdminKyc({
        q: debouncedQ || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        page,
        page_size: PAGE_SIZE,
      });
      setRows(data.items || []);
      setTotal(data.total || 0);
      setStats(data.stats || { total: 0, pending: 0, approved: 0, rejected: 0 });
    } catch (e: unknown) {
      const detailMsg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      toast.error(detailMsg || t.loadError);
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, statusFilter, page, t.loadError]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageNumbers = getPageNumbers(page, totalPages);

  async function openView(row: KycRow) {
    setDialog({ type: 'view', row });
    setDetail(null);
    try {
      setDetail(await api.getAdminKycDetail(row.id));
    } catch {
      setDetail(row);
    }
  }

  async function confirmAction() {
    if (!dialog || dialog.type === 'view') return;
    if (dialog.type === 'reject' && reason.trim().length < 3) {
      toast.error(t.rejectReasonRequired);
      return;
    }
    setBusy(true);
    try {
      if (dialog.type === 'approve') {
        await api.approveKyc(dialog.row.id);
        toast.success(t.approved);
      } else if (dialog.type === 'reject') {
        await api.rejectKyc(dialog.row.id, reason.trim());
        toast.success(t.rejected);
      } else {
        await api.resetKyc(dialog.row.id);
        toast.success(t.resetDone);
      }
      setDialog(null);
      setReason('');
      await load();
    } catch (e: unknown) {
      const detailMsg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      toast.error(typeof detailMsg === 'string' ? detailMsg : t.loadError);
    } finally {
      setBusy(false);
    }
  }

  const shown = dialog?.type === 'view' ? detail || dialog.row : dialog?.row;
  const statusLabels = t.status as Record<string, string>;

  return (
    <div className="-m-4 min-h-full bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100 p-4 sm:-m-6 sm:p-6 lg:-m-8 lg:p-8 dark:from-[#050B17] dark:via-[#091426] dark:to-[#0D1B2A]">
      <div className="mx-auto max-w-7xl space-y-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted dark:text-white/40">
            {t.breadcrumb} / {t.title}
          </p>
          <h1 className="mt-1 text-lg font-semibold tracking-tight text-ink sm:text-xl dark:text-white">{t.title}</h1>
          <p className="mt-0.5 text-sm text-ink-muted dark:text-white/50">{t.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label={t.stats.total} value={stats.total} icon={ShieldCheck} />
          <KpiCard label={t.stats.pending} value={stats.pending} icon={Clock} />
          <KpiCard label={t.stats.approved} value={stats.approved} icon={CheckCircle2} />
          <KpiCard label={t.stats.rejected} value={stats.rejected} icon={XCircle} />
        </div>

        <div
          className={cn(
            'overflow-hidden rounded-2xl border shadow-sm backdrop-blur-sm',
            'border-slate-200/80 bg-white/90 shadow-[0_4px_24px_rgba(15,23,42,0.06)]',
            'dark:border-white/[0.08] dark:bg-white/[0.03] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] dark:backdrop-blur-xl'
          )}
        >
          <div className="border-b border-line p-4 sm:p-5 dark:border-white/[0.06]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted dark:text-white/40" />
                <input
                  type="search"
                  placeholder={t.searchPlaceholder}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className={cn(controlClass, 'w-full pl-9 pr-3 placeholder:text-ink-muted dark:placeholder:text-white/40')}
                />
              </div>
              <label className="relative inline-block w-fit max-w-full self-start">
                <span className="sr-only">{t.table.status}</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className={cn(controlClass, 'block w-full appearance-none py-2 pl-3 pr-8')}
                >
                  <option value="all">{t.filters.all}</option>
                  <option value="pending">{t.filters.pending}</option>
                  <option value="approved">{t.filters.approved}</option>
                  <option value="rejected">{t.filters.rejected}</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted dark:text-white/50" />
              </label>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-line bg-surface-muted/80 dark:border-white/[0.06] dark:bg-white/[0.04]">
                      {[
                        t.table.name,
                        t.table.userId,
                        t.table.email,
                        t.table.pan,
                        t.table.aadhaar,
                        t.table.submitted,
                        t.table.status,
                        t.table.actions,
                      ].map((label) => (
                        <th
                          key={label}
                          className="px-4 py-3.5 text-xs font-medium uppercase tracking-wide text-ink-muted dark:text-white/50"
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-16 text-center text-sm text-ink-muted dark:text-white/40">
                          <p className="font-medium text-ink-secondary dark:text-white/60">{t.emptyTitle}</p>
                          <p className="mt-1 text-xs">{t.emptyDescription}</p>
                        </td>
                      </tr>
                    ) : (
                      rows.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b border-line/60 transition duration-300 last:border-0 hover:bg-surface-muted/60 dark:border-white/[0.04] dark:hover:bg-white/[0.03]"
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold text-white shadow-md',
                                  avatarGradient(row.full_name)
                                )}
                              >
                                {getInitials(row.full_name)}
                              </div>
                              <p className="truncate font-medium text-ink dark:text-white">{row.full_name}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4 font-mono text-xs text-ink-secondary dark:text-white/70" title={row.id}>
                            {shortId(row.id)}
                          </td>
                          <td className="px-4 py-4 text-ink-secondary dark:text-white/70">{row.email}</td>
                          <td className="px-4 py-4 font-medium text-ink dark:text-white/80">{row.pan_number || '—'}</td>
                          <td className="px-4 py-4 font-mono text-ink-secondary dark:text-white/70">
                            {formatAadhaar(row.aadhaar_masked || row.aadhaar_number)}
                          </td>
                          <td className="px-4 py-4 text-ink-secondary dark:text-white/70">
                            {row.submitted_at ? formatDate(row.submitted_at) : '—'}
                          </td>
                          <td className="px-4 py-4">
                            <KycBadge status={row.kyc_status} labels={statusLabels} />
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openView(row)}
                                className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-surface-muted dark:border-white/[0.08] dark:text-white/80"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                {t.actions.view}
                              </button>
                              {row.kyc_status === 'pending' ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setDialog({ type: 'approve', row })}
                                    className="rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/20 dark:text-[#22C55E]"
                                  >
                                    {t.actions.approve}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReason('');
                                      setDialog({ type: 'reject', row });
                                    }}
                                    className="rounded-lg bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-500/20 dark:text-[#EF4444]"
                                  >
                                    {t.actions.reject}
                                  </button>
                                </>
                              ) : row.kyc_status === 'approved' ? (
                                <button
                                  type="button"
                                  onClick={() => setDialog({ type: 'reset', row })}
                                  className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-ink-muted hover:bg-surface-muted"
                                >
                                  {t.actions.reset}
                                </button>
                              ) : row.kyc_status === 'rejected' ? (
                                <button
                                  type="button"
                                  onClick={() => setDialog({ type: 'approve', row })}
                                  className="rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/20 dark:text-[#22C55E]"
                                >
                                  {t.actions.approve}
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {total > 0 ? (
                <div className="flex items-center justify-center gap-1.5 border-t border-line px-4 py-4 dark:border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className={iconBtnClass}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {pageNumbers.map((item, idx) =>
                    item === 'ellipsis' ? (
                      <span key={`e-${idx}`} className="px-1 text-sm text-ink-muted">
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setPage(item)}
                        className={cn(
                          'flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium',
                          item === page ? 'bg-[#6C63FF] text-white' : iconBtnClass
                        )}
                      >
                        {item}
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className={iconBtnClass}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      {dialog && shown ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-ink/40" onClick={() => !busy && setDialog(null)} />
          <div className="relative w-full max-w-lg rounded-2xl border border-line bg-surface-card p-5 shadow-xl dark:border-white/[0.08]">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-lg font-bold text-ink">
                {dialog.type === 'view'
                  ? t.detailsTitle
                  : dialog.type === 'approve'
                    ? t.approveTitle
                    : dialog.type === 'reject'
                      ? t.rejectTitle
                      : t.resetTitle}
              </h2>
              <button type="button" onClick={() => !busy && setDialog(null)} className="rounded-lg p-1 hover:bg-surface-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            {dialog.type === 'view' ? (
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase text-ink-muted">{t.table.name}</dt>
                  <dd className="mt-0.5 text-sm font-medium">{shown.full_name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-ink-muted">{t.table.userId}</dt>
                  <dd className="mt-0.5 break-all font-mono text-xs">{shown.id}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-ink-muted">{t.table.email}</dt>
                  <dd className="mt-0.5 text-sm">{shown.email}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-ink-muted">{t.table.status}</dt>
                  <dd className="mt-1">
                    <KycBadge status={shown.kyc_status} labels={statusLabels} />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-ink-muted">{t.table.pan}</dt>
                  <dd className="mt-0.5 text-sm font-medium">{shown.pan_number || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-ink-muted">{t.table.aadhaar}</dt>
                  <dd className="mt-0.5 font-mono text-sm">{shown.aadhaar_number || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-ink-muted">{t.table.submitted}</dt>
                  <dd className="mt-0.5 text-sm">{shown.submitted_at ? formatDateTime(shown.submitted_at) : '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-ink-muted">{t.status.approved}</dt>
                  <dd className="mt-0.5 text-sm">
                    {shown.approved_at ? `${formatDateTime(shown.approved_at)}${shown.approved_by_name ? ` · ${shown.approved_by_name}` : ''}` : '—'}
                  </dd>
                </div>
                {shown.rejected_reason ? (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold uppercase text-ink-muted">{t.rejectReasonLabel}</dt>
                    <dd className="mt-0.5 text-sm text-red-600 dark:text-red-400">{shown.rejected_reason}</dd>
                  </div>
                ) : null}
              </dl>
            ) : (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-ink-secondary">
                  {(dialog.type === 'approve' ? t.approveConfirm : dialog.type === 'reject' ? t.rejectConfirm : t.resetConfirm).replace(
                    '{name}',
                    shown.full_name
                  )}
                </p>
                {dialog.type === 'reject' ? (
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-ink">{t.rejectReasonLabel}</span>
                    <textarea
                      rows={4}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder={t.rejectReasonPlaceholder}
                      className="w-full rounded-lg border border-line bg-surface-card px-3 py-2 text-sm text-ink focus-ring"
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
                    onClick={confirmAction}
                  >
                    {dialog.type === 'approve' ? t.confirmApprove : dialog.type === 'reject' ? t.confirmReject : t.confirmReset}
                  </Button>
                </div>
              </div>
            )}

            {dialog.type === 'view' && shown.kyc_status === 'pending' ? (
              <div className="mt-5 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setReason('');
                    setDialog({ type: 'reject', row: shown });
                  }}
                >
                  <ShieldX className="h-4 w-4" />
                  {t.actions.reject}
                </Button>
                <Button type="button" size="sm" onClick={() => setDialog({ type: 'approve', row: shown })}>
                  {t.actions.approve}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
