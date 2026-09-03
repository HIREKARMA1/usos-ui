'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ChevronDown, ChevronLeft, ChevronRight, Download, Search } from 'lucide-react';
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

type StatusFilter = 'all' | 'active' | 'inactive';
type PackageFilter = 'all' | string;

function avatarGradient(name: string) {
  const index = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
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
  const headers = ['Name', 'Email', 'Contact', 'Package', 'Earnings', 'Status', 'Joined'];
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
        `Package ${u.packageId}`,
        earnings,
        statusLabels[u.status] || u.status,
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

export default function AdminUsersPage() {
  const t = useContent('admin').users;
  const common = useContent('common');
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [packages, setPackages] = useState<PackagePlan[]>([]);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [packageFilter, setPackageFilter] = useState<PackageFilter>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getAdminUsers();
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
      const pkgs = await api.getPackages({ activeOnly: false }).catch(() => [] as PackagePlan[]);
      setPackages(pkgs);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [q, statusFilter, packageFilter]);

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
        if (query && !r.name.toLowerCase().includes(query) && !r.email.toLowerCase().includes(query)) {
          return false;
        }
        if (statusFilter !== 'all' && r.status !== statusFilter) return false;
        if (packageFilter !== 'all' && r.packageId !== packageFilter) return false;
        return true;
      }),
    [rows, q, statusFilter, packageFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  async function toggle(userId: string, current: string) {
    const next = current === 'active' ? 'suspended' : 'active';
    await api.toggleUserStatus(userId, next);
    toast.success(t.statusUpdated);
    load();
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
                  type="search"
                  placeholder={t.searchPlaceholder}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className={cn(controlClass, 'w-full pl-9 pr-3 placeholder:text-ink-muted dark:placeholder:text-white/40')}
                />
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
                <table className="w-full min-w-[860px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-line bg-surface-muted/80 dark:border-white/[0.06] dark:bg-white/[0.04]">
                      {[
                        { label: t.table.name, align: 'left' as const },
                        { label: t.table.contact, align: 'left' as const },
                        { label: t.table.package, align: 'left' as const },
                        { label: t.table.earnings, align: 'right' as const },
                        { label: t.table.status, align: 'left' as const },
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
                        <td colSpan={7} className="px-4 py-16 text-center text-sm text-ink-muted dark:text-white/40">
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
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold text-white shadow-md',
                                  avatarGradient(u.name)
                                )}
                              >
                                {getInitials(u.name)}
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
                          <td className="px-4 py-4 text-right font-medium text-emerald-600 dark:text-[#22C55E]">
                            {formatCurrency(getUserEarnings(u))}
                          </td>
                          <td className="px-4 py-4">
                            <StatusBadge
                              status={u.status}
                              label={common.status[u.status] || u.status}
                            />
                          </td>
                          <td className="px-4 py-4 text-ink-secondary dark:text-white/70">
                            {formatDate(u.joinedAt)}
                          </td>
                          <td className="px-4 py-4">
                            <button
                              type="button"
                              onClick={() => toggle(u.id, u.status)}
                              className={cn(
                                'rounded-full px-3.5 py-1.5 text-xs font-semibold transition duration-300',
                                u.status === 'active'
                                  ? 'bg-red-500/10 text-red-600 hover:bg-red-500/20 hover:shadow-[0_0_16px_rgba(239,68,68,0.15)] dark:bg-[#EF4444]/15 dark:text-[#EF4444] dark:hover:bg-[#EF4444]/25 dark:hover:shadow-[0_0_16px_rgba(239,68,68,0.25)]'
                                  : 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 hover:shadow-[0_0_16px_rgba(34,197,94,0.15)] dark:bg-[#22C55E]/15 dark:text-[#22C55E] dark:hover:bg-[#22C55E]/25 dark:hover:shadow-[0_0_16px_rgba(34,197,94,0.25)]'
                              )}
                            >
                              {u.status === 'active' ? t.deactivate : t.activate}
                            </button>
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
    </div>
  );
}
