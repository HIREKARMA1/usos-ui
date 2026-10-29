'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, ChevronLeft, ChevronRight, Download, Search, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Spinner } from '@/components/ui/Spinner';
import { useContent } from '@/hooks/useContent';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatCurrency, formatDate, getInitials } from '@/lib/format';
import type { AccountStatus, AdminUserRow, PackagePlan } from '@/types';

const PAGE_SIZE = 8;

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

type StatusFilter = 'all' | 'active' | 'inactive' | 'pending';
type PackageFilter = 'all' | string;
type LevelFilter = 'all' | number;

const FALLBACK_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8];

function BackspaceKeyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 28" className={className} aria-hidden="true">
      <path
        fill="#2C3A6B"
        d="M12.4 2.2c-.9 0-1.7.4-2.3 1.1L3.1 12.1c-.7.9-.7 2.2 0 3.1l7 8.8c.6.7 1.4 1.1 2.3 1.1h15.6c3.2 0 5.8-2.6 5.8-5.8V8c0-3.2-2.6-5.8-5.8-5.8H12.4z"
      />
      <path
        d="M18.4 9.3l7.6 9M26 9.3l-7.6 9"
        stroke="#111"
        strokeWidth="2.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function avatarGradient(name: string) {
  const index = (name || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

function StatusBadge({ status, label }: { status: AccountStatus; label: string }) {
  const styles: Record<AccountStatus, string> = {
    active:
      'bg-emerald-500/10 text-emerald-700 dark:bg-[#22C55E]/15 dark:text-[#22C55E]',
    inactive: 'bg-red-500/10 text-red-600 dark:bg-[#EF4444]/15 dark:text-[#EF4444]',
    pending: 'bg-amber-500/10 text-amber-700 dark:bg-[#F59E0B]/15 dark:text-[#F59E0B]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        styles[status]
      )}
    >
      {label}
    </span>
  );
}

function MemberIdentity({
  user,
  packageName,
  statusLabel,
}: {
  user: AdminUserRow;
  packageName: string;
  statusLabel: string;
}) {
  const meta = [user.phone, packageName, user.usosId].filter(Boolean).join(' · ');

  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-muted/70 px-3 py-3 dark:border-white/10 dark:bg-white/[0.04]">
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold text-white',
          avatarGradient(user.name)
        )}
      >
        {getInitials(user.name)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-semibold text-ink">{user.name}</p>
          <StatusBadge status={user.status} label={statusLabel} />
        </div>
        <p className="truncate text-xs text-ink-muted">{user.email || '—'}</p>
        {meta ? <p className="mt-1 truncate text-xs text-ink-secondary">{meta}</p> : null}
      </div>
    </div>
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

function getUserEarnings(row: AdminUserRow): number {
  const paise = Number(row.totalEarningsPaise);
  if (Number.isFinite(paise) && paise > 0) return paise / 100;

  const rupees = Number(row.earnings);
  return Number.isFinite(rupees) ? rupees : 0;
}

function exportUsers(
  rows: AdminUserRow[],
  statusLabels: Record<string, string>
) {
  const headers = [
    'Name',
    'Email',
    'Contact',
    'Referral ID',
    'Sponsor',
    'Package',
    'Level',
    'Earnings',
    'Status',
    'Reason',
    'Initial payment',
    'Monthly eligible',
    'Threshold',
    'Joined',
  ];
  const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const lines = [
    headers.join(','),
    ...rows.map((u) => {
      const earnings = getUserEarnings(u);
      if (process.env.NODE_ENV === 'development') {
        console.debug('[admin/users] csv earnings', {
          name: u.name,
          totalEarningsPaise: u.totalEarningsPaise,
          earningsField: u.earnings,
          resolved: earnings,
        });
      }
      return [
        u.name,
        u.email,
        u.phone,
        u.referralCode || '',
        u.sponsorName || '',
        `Package ${u.packageId}`,
        u.level > 0 ? `Level ${u.level}` : '',
        earnings,
        statusLabels[u.status] || u.status,
        u.statusReason || '',
        u.initialPaymentStatus || '',
        (u.monthlyEligiblePaise || 0) / 100,
        (u.monthlyThresholdPaise || 0) / 100,
        formatDate(u.joinedAt),
      ]
        .map(escape)
        .join(',');
    }),
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'users-export.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function initialStatus(value: string | null): StatusFilter {
  return value === 'active' || value === 'inactive' || value === 'pending' ? value : 'all';
}

export default function AdminUsersPage() {
  const t = useContent('admin').users;
  const common = useContent('common');
  const reduceMotion = useReducedMotion();
  const search = useSearchParams();
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [packages, setPackages] = useState<PackagePlan[]>([]);
  const [levelOptions, setLevelOptions] = useState<number[]>(FALLBACK_LEVELS);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() => initialStatus(search.get('status')));
  const [packageFilter, setPackageFilter] = useState<PackageFilter>('all');
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<AdminUserRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [viewUser, setViewUser] = useState<AdminUserRow | null>(null);
  const [mounted, setMounted] = useState(false);
  const searchRequest = useRef(0);

  const loadUsers = useCallback(async (query: string) => {
    const requestId = ++searchRequest.current;
    setLoading(true);
    try {
      const data = await api.getAdminUsers(query);
      if (requestId !== searchRequest.current) return;
      if (process.env.NODE_ENV === 'development' && data.length > 0) {
        const sample = data[0];
        console.debug('[admin/users] api earnings', {
          name: sample.name,
          totalEarningsPaise: sample.totalEarningsPaise,
          earningsField: sample.earnings,
          resolved: getUserEarnings(sample),
          formatted: formatCurrency(getUserEarnings(sample)),
        });
      }
      setRows(data);
    } finally {
      if (requestId === searchRequest.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    let cancelled = false;
    api
      .getPackages({ activeOnly: false })
      .catch(() => [] as PackagePlan[])
      .then((pkgs) => {
        if (!cancelled) setPackages(pkgs);
      });
    api
      .getRewardPlan()
      .catch(() => ({ levels: [] as { level: number }[] }))
      .then((plan) => {
        if (cancelled) return;
        const levels = (plan.levels || [])
          .map((level) => Number(level.level))
          .filter((level) => Number.isFinite(level) && level > 0)
          .sort((a, b) => a - b);
        if (levels.length) setLevelOptions(levels);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void loadUsers(q);
    }, q.trim() ? 300 : 0);
    return () => window.clearTimeout(handle);
  }, [q, loadUsers]);

  useEffect(() => {
    setPage(1);
  }, [q, statusFilter, packageFilter, levelFilter]);

  const packageOptions = useMemo(() => {
    if (packages.length) return packages.map((p) => ({ code: p.code, name: p.name }));
    const codes = Array.from(new Set(rows.map((r) => r.packageId).filter(Boolean)));
    return codes.map((code) => ({ code, name: code }));
  }, [packages, rows]);

  const packageNameByCode = useMemo(() => {
    const map = new Map<string, string>();
    packageOptions.forEach((p) => map.set(p.code, p.name));
    return map;
  }, [packageOptions]);

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const query = q.trim().toLowerCase();
        const name = (r.name || '').toLowerCase();
        const email = (r.email || '').toLowerCase();
        if (query && !name.includes(query) && !email.includes(query)) {
          return false;
        }
        if (statusFilter !== 'all' && r.status !== statusFilter) return false;
        if (packageFilter !== 'all' && r.packageId !== packageFilter) return false;
        if (levelFilter !== 'all' && r.level !== levelFilter) return false;
        return true;
      }),
    [rows, statusFilter, packageFilter, levelFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api.deleteAdminUser(pendingDelete.id);
      toast.success(t.deleted);
      setPendingDelete(null);
      loadUsers(q);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : t.deleteFailed);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="-m-4 min-h-full bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100 p-4 sm:-m-6 sm:p-6 lg:-m-8 lg:p-8 dark:from-[#050B17] dark:via-[#091426] dark:to-[#0D1B2A]">
      <div className="mx-auto max-w-7xl space-y-5">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-ink sm:text-xl dark:text-white">
            {t.title}
          </h1>
          <p className="mt-0.5 text-sm text-ink-muted dark:text-white/50">{t.subtitle}</p>
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
                  id="search"
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className={cn(
                    controlClass,
                    'w-full pl-9 placeholder:text-ink-muted dark:placeholder:text-white/40',
                    q ? 'pr-12' : 'pr-3'
                  )}
                />
                {q ? (
                  <button
                    type="button"
                    aria-label="Backspace"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setQ((current) => current.slice(0, -1))}
                    className="absolute right-1.5 top-1/2 flex h-7 w-8 -translate-y-1/2 items-center justify-center rounded-md transition hover:bg-surface-muted dark:hover:bg-white/[0.06]"
                  >
                    <BackspaceKeyIcon className="h-5 w-6" />
                  </button>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="relative">
                  <span className="sr-only">Status filter</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    className={cn(controlClass, 'appearance-none py-2 pl-3 pr-8')}
                  >
                    <option value="all">Status: All</option>
                    <option value="active">Status: {common.status.active}</option>
                    <option value="inactive">Status: {common.status.inactive}</option>
                    <option value="pending">Status: {common.status.pending}</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted dark:text-white/50" />
                </label>

                <label className="relative">
                  <span className="sr-only">Package filter</span>
                  <select
                    value={packageFilter}
                    onChange={(e) => setPackageFilter(e.target.value as PackageFilter)}
                    className={cn(controlClass, 'appearance-none py-2 pl-3 pr-8')}
                  >
                    <option value="all">{t.table.package}: All</option>
                    {packageOptions.map((pkg) => (
                      <option key={pkg.code} value={pkg.code}>
                        {pkg.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted dark:text-white/50" />
                </label>

                <label className="relative">
                  <span className="sr-only">{t.table.level}</span>
                  <select
                    value={levelFilter === 'all' ? 'all' : String(levelFilter)}
                    onChange={(e) => {
                      const value = e.target.value;
                      setLevelFilter(value === 'all' ? 'all' : Number(value));
                    }}
                    className={cn(controlClass, 'appearance-none py-2 pl-3 pr-8')}
                  >
                    <option value="all">{t.levelAll}</option>
                    {levelOptions.map((level) => (
                      <option key={level} value={level}>
                        Level {level}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted dark:text-white/50" />
                </label>

                <button
                  type="button"
                  onClick={() => exportUsers(filtered, common.status)}
                  className={cn(
                    controlClass,
                    'inline-flex items-center gap-2 px-4 font-medium hover:bg-surface-muted dark:hover:border-white/[0.14] dark:hover:bg-white/[0.08]'
                  )}
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
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
                <table className="w-full min-w-[960px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-line bg-surface-muted/80 dark:border-white/[0.06] dark:bg-white/[0.04]">
                      {[
                        { label: t.table.userId, align: 'left' as const },
                        { label: t.table.name, align: 'left' as const },
                        { label: t.table.contact, align: 'left' as const },
                        { label: t.table.package, align: 'left' as const },
                        { label: t.table.level, align: 'left' as const },
                        { label: t.table.earnings, align: 'right' as const },
                        { label: t.activation.column, align: 'left' as const },
                        { label: t.table.joined, align: 'left' as const },
                        { label: t.table.actions, align: 'left' as const },
                      ].map((header) => (
                        <th
                          key={header.label}
                          className={cn(
                            'px-4 py-3.5 text-xs font-medium uppercase tracking-wide text-ink-muted dark:text-white/50',
                            header.align === 'right' && 'text-right'
                          )}
                        >
                          {header.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-16 text-center text-sm text-ink-muted dark:text-white/40">
                          <p className="font-medium text-ink-secondary dark:text-white/60">{t.emptyTitle}</p>
                          <p className="mt-1 text-xs">{t.emptyDescription}</p>
                        </td>
                      </tr>
                    ) : (
                      paginated.map((u) => (
                        <tr
                          key={u.id}
                          className="border-b border-line/60 transition duration-300 last:border-0 hover:bg-surface-muted/60 dark:border-white/[0.04] dark:hover:bg-white/[0.03]"
                        >
                          <td className="px-4 py-4 font-mono text-sm font-semibold text-ink dark:text-white">
                            {u.usosId || '—'}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold text-white shadow-md',
                                  avatarGradient(u.name || '')
                                )}
                              >
                                {getInitials(u.name || '')}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-medium text-ink dark:text-white">{u.name}</p>
                                <p className="truncate text-xs text-ink-muted dark:text-white/45">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-ink-secondary dark:text-white/70">{u.phone || '—'}</td>
                          <td className="px-4 py-4 font-medium text-ink dark:text-white/80">
                            {packageNameByCode.get(u.packageId) || u.packageId || '—'}
                          </td>
                          <td className="px-4 py-4 text-ink-secondary dark:text-white/70">
                            {u.level > 0 ? `Level ${u.level}` : '—'}
                          </td>
                          <td className="px-4 py-4 text-right font-medium text-emerald-600 dark:text-[#22C55E]">
                            {formatCurrency(getUserEarnings(u))}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4">
                            <StatusBadge
                              status={u.status}
                              label={common.status[u.status] || u.status}
                            />
                          </td>
                          <td className="px-4 py-4 text-ink-secondary dark:text-white/70">
                            {formatDate(u.joinedAt)}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setViewUser(u)}
                                className="rounded-full bg-[#6C63FF] px-3.5 py-1.5 text-xs font-semibold text-white transition duration-300 hover:bg-[#5b54e6]"
                              >
                                {t.activation.view}
                              </button>
                              <button
                                type="button"
                                onClick={() => setPendingDelete(u)}
                                className="rounded-full bg-accent-red/10 px-3.5 py-1.5 text-xs font-semibold text-accent-red transition duration-300 hover:bg-accent-red/20"
                              >
                                {t.delete}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {filtered.length > 0 && (
                <div className="flex items-center justify-center gap-1.5 border-t border-line px-4 py-4 dark:border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    aria-label={common.pagination.previous}
                    className={iconBtnClass}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {pageNumbers.map((item, idx) =>
                    item === 'ellipsis' ? (
                      <span key={`ellipsis-${idx}`} className="px-1 text-sm text-ink-muted dark:text-white/40">
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setPage(item)}
                        className={cn(
                          'flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium transition duration-300',
                          item === currentPage
                            ? 'bg-[#6C63FF] text-white shadow-[0_0_16px_rgba(108,99,255,0.35)]'
                            : cn(
                                iconBtnClass,
                                'h-8 min-w-8 border px-2'
                              )
                        )}
                      >
                        {item}
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    aria-label={common.pagination.next}
                    className={iconBtnClass}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {mounted
        ? createPortal(
            <>
              <ConfirmDialog
                open={Boolean(pendingDelete)}
                title={t.deleteTitle}
                description={pendingDelete ? t.deleteBody.replace('{name}', pendingDelete.name) : ''}
                confirmLabel={t.deleteConfirm}
                cancelLabel={t.cancel}
                loading={deleting}
                icon={Trash2}
                onConfirm={confirmDelete}
                onClose={() => {
                  if (!deleting) setPendingDelete(null);
                }}
              >
                {pendingDelete ? (
                  <MemberIdentity
                    user={pendingDelete}
                    packageName={packageNameByCode.get(pendingDelete.packageId) || pendingDelete.packageId || '—'}
                    statusLabel={common.status[pendingDelete.status] || pendingDelete.status}
                  />
                ) : null}
              </ConfirmDialog>
              <AnimatePresence>
              {viewUser ? (
                <motion.div
                  key="member-view"
                  className="fixed inset-0 z-[80] flex items-center justify-center p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.18 }}
                >
                  <button
                    type="button"
                    aria-label={common.actions.close}
                    className="absolute inset-0 bg-[#0f172a]/50 backdrop-blur-[3px] dark:bg-black/65"
                    onClick={() => setViewUser(null)}
                  />
                  <motion.div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="member-view-title"
                    className="relative w-full max-w-[420px] overflow-hidden rounded-2xl border border-line bg-surface-card shadow-[0_24px_70px_-28px_rgba(15,23,42,0.55)] dark:border-white/10 dark:shadow-[0_24px_70px_-28px_rgba(0,0,0,0.85)]"
                    initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="h-1 bg-primary" />
                    <div className="flex items-start justify-between gap-3 px-5 pb-4 pt-5 sm:px-6">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={cn(
                            'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-semibold text-white',
                            avatarGradient(viewUser.name)
                          )}
                        >
                          {getInitials(viewUser.name)}
                        </div>
                        <div className="min-w-0">
                          <h3 id="member-view-title" className="truncate font-display text-lg font-bold tracking-tight text-ink">
                            {viewUser.name}
                          </h3>
                          <p className="truncate text-sm text-ink-muted">{t.activation.viewTitle}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label={common.actions.close}
                        onClick={() => setViewUser(null)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-muted transition hover:bg-surface-muted hover:text-ink"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <dl className="space-y-3 px-5 pb-5 sm:px-6">
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-muted/70 px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.04]">
                        <dt className="text-xs font-medium text-ink-muted">{t.table.referralId}</dt>
                        <dd className="truncate font-mono text-sm font-semibold text-primary">
                          {viewUser.referralCode || '—'}
                        </dd>
                      </div>
                      <div className="rounded-xl border border-line px-3 py-2.5 dark:border-white/10">
                        <dt className="text-xs font-medium text-ink-muted">{t.table.sponsor}</dt>
                        <dd className="mt-1 text-sm text-ink">
                          <p className="font-medium">{viewUser.sponsorName || t.activation.noSponsor}</p>
                          <p className="mt-0.5 font-mono text-xs text-ink-muted">
                            {t.table.userId}: {viewUser.sponsorUsosId || '—'}
                          </p>
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2.5 dark:border-white/10">
                        <dt className="text-xs font-medium text-ink-muted">{t.activation.accountStatus}</dt>
                        <dd>
                          <StatusBadge
                            status={viewUser.status}
                            label={common.status[viewUser.status] || viewUser.status}
                          />
                        </dd>
                      </div>
                      <div
                        className={cn(
                          'rounded-xl px-3 py-3',
                          viewUser.status === 'active'
                            ? 'bg-emerald-500/10'
                            : 'bg-red-500/10'
                        )}
                      >
                        <dt className="text-xs font-medium text-ink-muted">
                          {viewUser.status === 'active' ? t.activation.reason : t.activation.inactiveReason}
                        </dt>
                        <dd className="mt-1 text-sm leading-snug text-ink">
                          {viewUser.status === 'active'
                            ? viewUser.statusReason || t.activation.activeNote
                            : viewUser.statusReason || t.activation.noReason}
                        </dd>
                      </div>
                    </dl>
                    <div className="flex justify-end border-t border-line bg-surface-muted/50 px-5 py-3.5 dark:bg-white/[0.03] sm:px-6">
                      <Button type="button" variant="outline" size="sm" onClick={() => setViewUser(null)}>
                        {common.actions.close}
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              ) : null}
              </AnimatePresence>
            </>,
            document.body
          )
        : null}
    </div>
  );
}
