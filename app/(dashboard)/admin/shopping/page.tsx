'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  FileText,
  IndianRupee,
  Mail,
  MapPin,
  Package,
  Phone,
  Search,
  ShieldCheck,
  ShoppingBag,
  UserRound,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { KpiCard } from '@/components/dashboard/admin/KpiCard';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useContent } from '@/hooks/useContent';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatCurrency, formatDateTime, getInitials } from '@/lib/format';
import { resolveUploadUrl } from '@/lib/media';
import type { AdminPaymentRow } from '@/types';

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

function ItemThumb({ name, imageUrl }: { name: string; imageUrl?: string | null }) {
  const src = resolveUploadUrl(imageUrl);
  if (src) {
    return <img src={src} alt={name} className="h-14 w-14 shrink-0 rounded-xl object-cover" />;
  }
  return (
    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/80 text-[#6C63FF] dark:bg-white/10">
      <ShoppingBag className="h-4 w-4" />
    </span>
  );
}

function deliveryAddress(row: AdminPaymentRow) {
  return [row.shipping_address, row.shipping_city, row.shipping_state, row.shipping_pincode]
    .map((part) => (part || '').trim())
    .filter(Boolean)
    .join(', ');
}

const ITEM_TONES = [
  'bg-[#F3F6FF] dark:bg-[#6C63FF]/10',
  'bg-[#F6F3FF] dark:bg-[#A855F7]/10',
  'bg-[#F2F7FF] dark:bg-sky-400/10',
  'bg-[#FBF4F8] dark:bg-pink-400/10',
];

function DetailField({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-white/50">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] text-ink-muted dark:text-white/40">{label}</p>
        <p className="break-words text-sm font-semibold text-ink dark:text-white">{value || '—'}</p>
      </div>
    </div>
  );
}

function BuyerDetails({
  row,
  labels,
}: {
  row: AdminPaymentRow;
  labels: {
    memberId: string;
    phone: string;
    email: string;
    referral: string;
    deliveryName: string;
    address: string;
  };
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <DetailField icon={CreditCard} label={labels.memberId} value={row.member_id || '—'} />
      <DetailField icon={Phone} label={labels.phone} value={row.shipping_phone || row.phone || '—'} />
      <DetailField icon={Mail} label={labels.email} value={row.email || '—'} />
      <DetailField icon={MapPin} label={labels.address} value={deliveryAddress(row) || '—'} />
      <DetailField icon={Users} label={labels.referral} value={row.referral_code || '—'} />
      <DetailField icon={UserRound} label={labels.deliveryName} value={row.shipping_name || row.user_name || '—'} />
    </div>
  );
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

export default function AdminShoppingPage() {
  const t = useContent('admin').shopping;
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
        kind: 'shop',
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

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageNumbers = getPageNumbers(page, totalPages);
  const statusLabels = t.status as Record<string, string>;
  const filters = t.filters as Record<string, string>;

  const filterCounts: Record<StatusFilter, number> = {
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

  return (
    <div className="-m-4 min-h-full bg-[#F4F7FB] p-4 sm:-m-6 sm:p-6 lg:-m-8 lg:p-8 dark:bg-[#050B17]">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted dark:text-white/40">
            {t.breadcrumb} / {t.title}
          </p>
          <h1 className="mt-1 text-lg font-semibold tracking-tight text-ink sm:text-xl dark:text-white">{t.title}</h1>
          <p className="mt-0.5 max-w-xl text-sm text-ink-muted dark:text-white/50">{t.subtitle}</p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <KpiCard label={t.stats.total} value={stats.total} icon={ShoppingBag} tone="info" />
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
              <div className="flex flex-wrap gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-white/[0.06]">
                {(['all', 'pending_approval', 'approved', 'rejected'] as StatusFilter[]).map((key) => {
                  const active = statusFilter === key;
                  const activeStyles: Record<StatusFilter, string> = {
                    all: 'bg-[#4F46E5] text-white shadow-sm',
                    pending_approval: 'bg-amber-500 text-white shadow-sm',
                    approved: 'bg-emerald-600 text-white shadow-sm',
                    rejected: 'bg-red-500 text-white shadow-sm',
                  };
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setStatusFilter(key)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                        active
                          ? activeStyles[key]
                          : 'text-ink-muted hover:bg-white/70 hover:text-ink dark:text-white/45 dark:hover:bg-white/[0.06] dark:hover:text-white/80'
                      )}
                    >
                      {filters[key]}
                      <span
                        className={cn(
                          'rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                          active
                            ? 'bg-white/20 text-white'
                            : 'bg-white text-ink-muted dark:bg-white/[0.08] dark:text-white/40'
                        )}
                      >
                        {filterCounts[key]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : rows.length === 0 ? (
            <div className="px-4 py-16 text-center text-sm text-ink-muted dark:text-white/40">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-muted dark:bg-white/[0.04]">
                <IndianRupee className="h-5 w-5 opacity-50" />
              </div>
              <p className="mt-3 font-medium text-ink-secondary dark:text-white/60">{t.empty}</p>
              <p className="mt-1 text-xs">{t.emptyHint}</p>
            </div>
          ) : (
            <>
              <ul className="space-y-5">
                {rows.map((row) => {
                  const itemCount = row.items?.length || 0;
                  const verified = row.kyc_status === 'approved' || row.kyc_status === 'verified';
                  const panel =
                    'rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-white/[0.08] dark:bg-[#0B1220]';
                  return (
                  <li key={row.id} className="space-y-3">
                    <div className={cn(panel, 'flex items-center justify-between gap-3 px-4 py-3')}>
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-ink dark:text-white">{t.orderDetails}</p>
                        {verified ? (
                          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            {t.verifiedBuyer}
                          </span>
                        ) : null}
                      </div>
                      <div className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2 text-right shadow-sm dark:border-white/[0.08] dark:bg-white/[0.03]">
                        <p className="text-lg font-bold tabular-nums text-ink dark:text-white">
                          {formatCurrency((row.amount_paise || 0) / 100)}
                        </p>
                        <div className="mt-1 flex justify-end">
                          <StatusBadge status={row.status} labels={statusLabels} />
                        </div>
                      </div>
                    </div>

                    <div className={cn(panel, 'p-4 sm:p-5')}>
                      <div className="mb-4 flex items-center gap-3">
                        <div
                          className={cn(
                            'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-semibold text-white shadow-sm',
                            avatarGradient(row.user_name)
                          )}
                        >
                          {getInitials(row.user_name)}
                        </div>
                        <p className="truncate text-base font-semibold text-ink dark:text-white">{row.user_name}</p>
                      </div>
                      <BuyerDetails row={row} labels={t.buyer} />
                    </div>

                    <div className={cn(panel, 'p-4 sm:p-5')}>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="flex items-center gap-2 text-sm font-semibold text-ink dark:text-white">
                          <Package className="h-4 w-4 text-ink-muted" />
                          {t.itemsHeading} ({itemCount})
                        </p>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-ink-secondary dark:bg-white/[0.06] dark:text-white/60">
                          {String(t.itemsCount || '').replace('{count}', String(itemCount))}
                        </span>
                      </div>
                      <ul className="grid gap-3 sm:grid-cols-2">
                        {(row.items || []).length > 0 ? (
                          row.items!.map((item, index) => (
                            <li
                              key={`${item.product_id}-${index}`}
                              className={cn(
                                'flex items-center gap-3 rounded-2xl px-3 py-2.5',
                                ITEM_TONES[index % ITEM_TONES.length]
                              )}
                            >
                              <ItemThumb name={item.product_name} imageUrl={item.image_url} />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-ink dark:text-white">{item.product_name}</p>
                                <p className="mt-0.5 text-xs text-ink-muted">
                                  {t.table.qty} {item.quantity}
                                </p>
                              </div>
                              <p className="shrink-0 text-sm font-semibold tabular-nums text-ink dark:text-white">
                                {formatCurrency((item.line_total_paise || 0) / 100)}
                              </p>
                            </li>
                          ))
                        ) : (
                          <li className="text-sm text-ink-muted">{row.package_name || '—'}</li>
                        )}
                      </ul>
                    </div>

                    <div className={cn(panel, 'flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between')}>
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-ink-muted" />
                          <div>
                            <p className="text-[11px] text-ink-muted">{t.table.order}</p>
                            <p className="font-mono text-sm font-semibold text-ink dark:text-white" title={row.application_id}>
                              {shortId(row.application_id)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-ink-muted" />
                          <div>
                            <p className="text-[11px] text-ink-muted">{t.dateTime}</p>
                            <p className="text-sm font-semibold text-ink dark:text-white">
                              {row.submitted_at ? formatDateTime(row.submitted_at) : '—'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <IndianRupee className="h-4 w-4 text-ink-muted" />
                          <div>
                            <p className="text-[11px] text-ink-muted">{t.totalAmount}</p>
                            <p className="text-sm font-semibold tabular-nums text-ink dark:text-white">
                              {formatCurrency((row.amount_paise || 0) / 100)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-ink-muted" />
                          <div>
                            <p className="text-[11px] text-ink-muted">{t.table.utr}</p>
                            <p className="font-mono text-sm font-semibold text-ink dark:text-white">
                              {row.transaction_id || '—'}
                            </p>
                          </div>
                        </div>
                      </div>
                      {row.status === 'pending_approval' ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setReason('');
                              setDialog({ type: 'approve', row });
                            }}
                            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
                          >
                            <Check className="h-4 w-4" />
                            {t.approve}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setReason('');
                              setDialog({ type: 'reject', row });
                            }}
                            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-ink transition hover:bg-slate-50 dark:border-white/[0.1] dark:bg-transparent dark:text-white dark:hover:bg-white/[0.04]"
                          >
                            <X className="h-4 w-4" />
                            {t.reject}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </li>
                  );
                })}
              </ul>

              {total > 0 ? (
                <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3.5 dark:border-white/[0.06]">
                  <p className="hidden text-xs text-ink-muted sm:block dark:text-white/40">
                    {total} {total === 1 ? 'order' : 'orders'}
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

      {dialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            onClick={() => !busy && setDialog(null)}
          />
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-surface-card shadow-xl dark:border-white/[0.08] dark:bg-[#0B1220]">
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
                      {t.table.utr}: {dialog.row.transaction_id || '—'}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold tabular-nums text-ink dark:text-white">
                    {formatCurrency((dialog.row.amount_paise || 0) / 100)}
                  </p>
                </div>
                <div className="mt-3">
                  <BuyerDetails row={dialog.row} labels={t.buyer} />
                </div>
                {dialog.row.items && dialog.row.items.length > 0 ? (
                  <ul className="mt-3 space-y-2 border-t border-line pt-3 dark:border-white/[0.06]">
                    {dialog.row.items.map((item, index) => (
                      <li key={`${item.product_id}-${index}`} className="flex items-center gap-3">
                        <ItemThumb name={item.product_name} imageUrl={item.image_url} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink dark:text-white">{item.product_name}</p>
                          <p className="text-xs text-ink-muted">
                            {t.table.qty} {item.quantity}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-ink dark:text-white">
                          {formatCurrency((item.line_total_paise || 0) / 100)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              {dialog.type === 'approve' ? (
                <p className="text-sm leading-relaxed text-ink-secondary dark:text-white/60">{t.approveBankHint}</p>
              ) : (
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
              )}

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
