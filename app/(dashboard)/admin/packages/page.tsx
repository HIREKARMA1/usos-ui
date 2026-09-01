'use client';

import { FormEvent, MouseEvent, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  MoreVertical,
  Package as PackageIcon,
  Pencil,
  Plus,
  Power,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useContent } from '@/hooks/useContent';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatCurrency, formatNumber } from '@/lib/format';
import type { PackagePlan } from '@/types';

const PAGE_SIZE = 10;

const GRID =
  'grid grid-cols-[minmax(220px,2.2fr)_0.75fr_0.8fr_0.85fr_0.85fr_0.95fr_8.5rem] items-center gap-3 sm:gap-4';

const controlClass =
  'h-11 rounded-xl border border-line bg-surface-card text-sm text-ink transition duration-200 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/90';

const iconBtnClass =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-card text-ink-muted transition duration-200 hover:bg-surface-muted hover:text-ink disabled:pointer-events-none disabled:opacity-30 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/60 dark:hover:bg-white/[0.08] dark:hover:text-white';

type StatusFilter = 'all' | 'active' | 'inactive';
type FormMode = 'create' | 'edit' | 'products';
type Dialog =
  | { type: 'details'; pkg: PackagePlan }
  | { type: 'items'; pkg: PackagePlan }
  | { type: 'delete'; pkg: PackagePlan }
  | null;

type ItemRow = { name: string; quantity: number };
type CatalogProduct = { id: string; name: string };

const emptyForm = {
  code: '',
  name: '',
  description: '',
  price_inr: '',
  stock_count: '0',
  is_active: true,
  image_url: '',
  items: [{ name: '', quantity: 1 }] as ItemRow[],
};

function interpolate(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''));
}

function packageItems(pkg: PackagePlan): ItemRow[] {
  if (pkg.items?.length) return pkg.items;
  return (pkg.features || []).map((name) => ({ name, quantity: 1 }));
}

function formatCreatedParts(value?: string) {
  if (!value) return { date: '—', time: '' };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: '—', time: '' };
  return {
    date: new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date),
    time: new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date),
  };
}

function apiError(err: unknown, fallback: string) {
  const detail =
    err && typeof err === 'object' && 'response' in err
      ? (err as { response?: { data?: { detail?: unknown } } }).response?.data?.detail
      : undefined;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => (d && typeof d === 'object' && 'msg' in d ? String(d.msg) : '')).filter(Boolean).join(', ') || fallback;
  }
  return fallback;
}

function StatusBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        active
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
          : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/70'
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-emerald-500' : 'bg-slate-400')} />
      {label}
    </span>
  );
}

function PackageThumb({ pkg }: { pkg: PackagePlan }) {
  const [failed, setFailed] = useState(false);
  const src = pkg.imageUrl;

  if (!src || failed) {
    return (
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <PackageIcon className="h-6 w-6" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-black/5"
      onError={() => setFailed(true)}
    />
  );
}

export default function AdminPackagesPage() {
  const t = useContent('admin').packages;
  const common = useContent('common');
  const [rows, setRows] = useState<PackagePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; openUp: boolean } | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  function load() {
    api
      .getPackages({ activeOnly: false })
      .then(setRows)
      .catch((err) => toast.error(apiError(err, t.emptyTitle)))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    api
      .getAdminProducts()
      .then((products) =>
        setCatalog((products || []).map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })))
      )
      .catch(() => setCatalog([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
  }, [q, statusFilter]);

  const menuPkg = useMemo(() => rows.find((row) => row.id === menuId) ?? null, [rows, menuId]);

  function closeMenu() {
    setMenuId(null);
    setMenuPos(null);
  }

  function toggleMenu(event: MouseEvent<HTMLButtonElement>, pkgId: string) {
    event.preventDefault();
    event.stopPropagation();
    if (menuId === pkgId) {
      closeMenu();
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 224;
    const estimatedHeight = 248;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < estimatedHeight && rect.top > estimatedHeight;
    const left = Math.min(Math.max(8, rect.right - menuWidth), window.innerWidth - menuWidth - 8);
    setMenuId(pkgId);
    setMenuPos({
      top: openUp ? rect.top - 6 : rect.bottom + 6,
      left,
      openUp,
    });
  }

  useEffect(() => {
    if (!menuId) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-package-menu]') || target.closest('[data-package-menu-trigger]')) return;
      closeMenu();
    };
    const onViewportChange = () => closeMenu();
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange, true);
    };
  }, [menuId]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((pkg) => {
      const active = pkg.isActive !== false;
      if (statusFilter === 'active' && !active) return false;
      if (statusFilter === 'inactive' && active) return false;
      if (!query) return true;
      return (
        pkg.name.toLowerCase().includes(query) ||
        pkg.description.toLowerCase().includes(query) ||
        pkg.code.toLowerCase().includes(query)
      );
    });
  }, [rows, q, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE;
  const paginated = filtered.slice(start, start + PAGE_SIZE);
  const showingFrom = filtered.length === 0 ? 0 : start + 1;
  const showingTo = start + paginated.length;

  function upsertRow(pkg: PackagePlan) {
    setRows((prev) => {
      const exists = prev.some((row) => row.id === pkg.id);
      return exists ? prev.map((row) => (row.id === pkg.id ? pkg : row)) : [pkg, ...prev];
    });
  }

  function openCreate() {
    closeMenu();
    setForm(emptyForm);
    setFormErrors({});
    setEditingId(null);
    setFormMode('create');
    setFormOpen(true);
    if (fileRef.current) fileRef.current.value = '';
  }

  function fillForm(pkg: PackagePlan, mode: FormMode) {
    closeMenu();
    const items = packageItems(pkg);
    setForm({
      code: pkg.code,
      name: pkg.name,
      description: pkg.description || '',
      price_inr: String(pkg.price ?? ''),
      stock_count: String(pkg.stock ?? 0),
      is_active: pkg.isActive !== false,
      image_url: pkg.imageUrl || '',
      items: items.length ? items : [{ name: '', quantity: 1 }],
    });
    setFormErrors({});
    setEditingId(pkg.id);
    setFormMode(mode);
    setFormOpen(true);
    if (fileRef.current) fileRef.current.value = '';
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormErrors({});
  }

  function cleanItems(items: ItemRow[]) {
    return items
      .map((item) => ({ name: item.name.trim(), quantity: Math.max(1, Number(item.quantity) || 1) }))
      .filter((item) => item.name);
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (formMode !== 'products') {
      if (!form.name.trim()) next.name = t.nameRequired;
      if (formMode === 'create' && !form.code.trim()) next.code = t.codeRequired;
      const price = Number(form.price_inr);
      if (!Number.isFinite(price) || price <= 0) next.price = t.priceRequired;
      if (formMode === 'create' && !form.image_url) next.image = t.imageRequired;
    }
    setFormErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onImagesSelected(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(t.uploadHint);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t.uploadHint);
      return;
    }
    setUploading(true);
    try {
      const { url } = await api.uploadPackageImage(file);
      setForm((f) => ({ ...f, image_url: url }));
      setFormErrors((e) => ({ ...e, image: '' }));
    } catch (err) {
      toast.error(apiError(err, t.uploadHint));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const items = cleanItems(form.items);
    try {
      if (formMode === 'products' && editingId) {
        const updated = await api.updatePackage(editingId, { items });
        upsertRow(updated);
        toast.success(t.productsSaved);
        closeForm();
        return;
      }
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        image_url: form.image_url || null,
        price_paise: Math.round(Number(form.price_inr) * 100),
        stock_count: Math.max(0, Number(form.stock_count) || 0),
        is_active: form.is_active,
        items,
      };
      if (formMode === 'edit' && editingId) {
        const updated = await api.updatePackage(editingId, { ...payload, code: form.code.trim() });
        upsertRow(updated);
        toast.success(t.saved);
      } else {
        const created = await api.createPackage({ ...payload, code: form.code.trim() });
        upsertRow(created);
        toast.success(t.created);
      }
      closeForm();
    } catch (err) {
      toast.error(apiError(err, formMode === 'create' ? t.createTitle : t.editTitle));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(pkg: PackagePlan) {
    closeMenu();
    setBusyId(pkg.id);
    try {
      const updated = await api.updatePackage(pkg.id, { is_active: pkg.isActive === false });
      upsertRow(updated);
      toast.success(updated.isActive === false ? t.deactivated : t.activated);
    } catch (err) {
      toast.error(apiError(err, t.editTitle));
    } finally {
      setBusyId(null);
    }
  }

  async function duplicate(pkg: PackagePlan) {
    closeMenu();
    setBusyId(pkg.id);
    try {
      const copy = await api.duplicatePackage(pkg.id);
      upsertRow(copy);
      toast.success(t.duplicated);
    } catch (err) {
      toast.error(apiError(err, t.duplicate));
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (dialog?.type !== 'delete') return;
    const pkg = dialog.pkg;
    setBusyId(pkg.id);
    try {
      await api.deletePackage(pkg.id);
      setRows((prev) => prev.filter((row) => row.id !== pkg.id));
      toast.success(t.deleted);
      setDialog(null);
    } catch (err) {
      toast.error(apiError(err, t.delete));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          {t.title}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">{t.subtitle}</p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.searchPlaceholder}
            className={cn(controlClass, 'w-full pl-10 pr-3 placeholder:text-ink-muted')}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="relative">
            <span className="sr-only">{t.allStatus}</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className={cn(controlClass, 'min-w-[9.5rem] appearance-none py-2 pl-3.5 pr-9')}
            >
              <option value="all">{t.allStatus}</option>
              <option value="active">{common.status.active}</option>
              <option value="inactive">{common.status.inactive}</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          </label>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--color-primary-hover)]"
          >
            <Plus className="h-4 w-4" />
            {t.addNew}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto overflow-y-visible pb-1">
            <div className="min-w-[980px] space-y-3">
              <div className={cn(GRID, 'px-5')}>
                {[
                  t.table.name,
                  t.table.price,
                  t.table.stock,
                  t.table.items,
                  t.table.status,
                  t.table.createdAt,
                  t.table.actions,
                ].map((label, idx, arr) => (
                  <p
                    key={label}
                    className={cn('text-sm font-medium text-ink-muted', idx === arr.length - 1 && 'text-right')}
                  >
                    {label}
                  </p>
                ))}
              </div>

              {paginated.length === 0 ? (
                <div className="rounded-2xl border border-line bg-surface-card px-6 py-16 text-center shadow-[0_4px_24px_rgba(15,23,42,0.04)]">
                  <p className="font-medium text-ink">{t.emptyTitle}</p>
                  <p className="mt-1 text-sm text-ink-muted">{t.emptyDescription}</p>
                </div>
              ) : (
                paginated.map((pkg) => {
                  const active = pkg.isActive !== false;
                  const stock = pkg.stock ?? 0;
                  const items = packageItems(pkg);
                  const created = formatCreatedParts(pkg.createdAt);

                  return (
                    <div
                      key={pkg.id}
                      className="overflow-visible rounded-2xl border border-line/80 bg-surface-card px-5 py-4 shadow-[0_4px_24px_rgba(15,23,42,0.05)] transition duration-200 hover:shadow-[0_8px_28px_rgba(15,23,42,0.08)] dark:border-white/[0.08] dark:bg-white/[0.03]"
                    >
                      <div className={GRID}>
                        <div className="flex min-w-0 items-center gap-3.5">
                          <PackageThumb pkg={pkg} />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate font-semibold text-ink">{pkg.name}</p>
                              <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                                {pkg.code}
                              </span>
                            </div>
                            <p className="mt-0.5 truncate text-xs text-ink-muted">{pkg.description || '—'}</p>
                          </div>
                        </div>

                        <p className="text-sm font-medium text-ink">{formatCurrency(pkg.price)}</p>

                        <div>
                          <p className="text-sm font-medium text-ink">{formatNumber(stock)}</p>
                          <p
                            className={cn(
                              'mt-0.5 text-xs font-medium',
                              stock > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                            )}
                          >
                            {stock > 0 ? t.inStock : t.outOfStock}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-ink">
                            {interpolate(t.itemsCount, { count: items.length })}
                          </p>
                          <button
                            type="button"
                            onClick={() => setDialog({ type: 'items', pkg })}
                            className="mt-0.5 text-xs font-medium text-primary underline-offset-2 hover:underline"
                          >
                            {t.viewItems}
                          </button>
                        </div>

                        <div>
                          <StatusBadge
                            active={active}
                            label={active ? common.status.active : common.status.inactive}
                          />
                        </div>

                        <div className="leading-tight">
                          <p className="text-sm text-ink-secondary">{created.date}</p>
                          {created.time ? <p className="mt-0.5 text-xs text-ink-muted">{created.time}</p> : null}
                        </div>

                        <div className="flex shrink-0 items-center justify-end gap-1.5">
                          <button
                            type="button"
                            aria-label={t.edit}
                            title={t.edit}
                            onClick={() => fillForm(pkg, 'edit')}
                            className={cn(iconBtnClass, 'text-primary hover:text-primary')}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label={t.delete}
                            title={t.delete}
                            onClick={() => setDialog({ type: 'delete', pkg })}
                            className={cn(
                              iconBtnClass,
                              'text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10'
                            )}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label={t.more}
                            title={t.more}
                            aria-expanded={menuId === pkg.id}
                            aria-haspopup="menu"
                            data-package-menu-trigger
                            onClick={(e) => toggleMenu(e, pkg.id)}
                            className={iconBtnClass}
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink-muted">
              {interpolate(t.showingSummary, {
                from: showingFrom,
                to: showingTo,
                total: filtered.length,
              })}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label={common.pagination.previous}
                className={iconBtnClass}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="flex h-8 min-w-8 items-center justify-center rounded-lg border border-primary bg-primary/5 px-2.5 text-sm font-semibold text-primary">
                {currentPage}
              </span>
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
          </div>
        </>
      )}

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          <button type="button" className="absolute inset-0 bg-ink/40" aria-label={t.close} onClick={closeForm} />
          <form
            onSubmit={onSubmit}
            className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-surface-card shadow-xl dark:border-white/[0.08]"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
              <h2 className="font-display text-lg font-bold text-ink">
                {formMode === 'create' ? t.createTitle : formMode === 'products' ? t.manageProducts : t.editTitle}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg p-1 text-ink-muted hover:bg-surface-muted hover:text-ink"
                aria-label={t.close}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
              {formMode !== 'products' ? (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="min-w-0 text-sm">
                      <span className="mb-1.5 block font-medium">{t.nameLabel}</span>
                      <input
                        className={cn(controlClass, 'w-full px-3')}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />
                      {formErrors.name ? <span className="mt-1 block text-xs text-red-500">{formErrors.name}</span> : null}
                    </label>
                    <label className="min-w-0 text-sm">
                      <span className="mb-1.5 block font-medium">{t.codeLabel}</span>
                      <input
                        className={cn(controlClass, 'w-full px-3 uppercase')}
                        value={form.code}
                        onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                      />
                      <span className="mt-1 block text-xs text-ink-muted">{t.codeHint}</span>
                      {formErrors.code ? <span className="mt-1 block text-xs text-red-500">{formErrors.code}</span> : null}
                    </label>
                    <label className="min-w-0 text-sm">
                      <span className="mb-1.5 block font-medium">{t.priceLabel}</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        className={cn(controlClass, 'w-full px-3')}
                        value={form.price_inr}
                        onChange={(e) => setForm({ ...form, price_inr: e.target.value })}
                      />
                      {formErrors.price ? <span className="mt-1 block text-xs text-red-500">{formErrors.price}</span> : null}
                    </label>
                    <label className="min-w-0 text-sm">
                      <span className="mb-1.5 block font-medium">{t.stockLabel}</span>
                      <input
                        type="number"
                        min="0"
                        className={cn(controlClass, 'w-full px-3')}
                        value={form.stock_count}
                        onChange={(e) => setForm({ ...form, stock_count: e.target.value })}
                      />
                    </label>
                    <label className="min-w-0 text-sm sm:col-span-2 lg:col-span-1">
                      <span className="mb-1.5 block font-medium">{t.statusLabel}</span>
                      <select
                        className={cn(controlClass, 'w-full px-3')}
                        value={form.is_active ? 'active' : 'inactive'}
                        onChange={(e) => setForm({ ...form, is_active: e.target.value === 'active' })}
                      >
                        <option value="active">{common.status.active}</option>
                        <option value="inactive">{common.status.inactive}</option>
                      </select>
                    </label>
                  </div>

                  <label className="block min-w-0 text-sm">
                    <span className="mb-1.5 block font-medium">{t.descriptionLabel}</span>
                    <textarea
                      rows={2}
                      className="w-full rounded-xl border border-line bg-surface-card px-3 py-2.5 text-sm text-ink"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </label>

                  <div className="min-w-0 text-sm">
                    <span className="mb-1.5 block font-medium">{t.imageLabel}</span>
                    <div className="flex min-w-0 flex-wrap items-center gap-4">
                      {form.image_url ? (
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-line bg-surface-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={form.image_url} alt="" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            className="absolute right-1 top-1 rounded-md bg-ink/70 p-0.5 text-white hover:bg-accent-red"
                            onClick={() => setForm((f) => ({ ...f, image_url: '' }))}
                            aria-label={t.delete}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-line bg-surface-muted text-ink-muted">
                          <Upload className="h-6 w-6" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1 space-y-2">
                        <input
                          ref={fileRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="block w-full max-w-full text-sm text-ink-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[var(--color-primary-hover)]"
                          onChange={(e) => onImagesSelected(e.target.files)}
                          disabled={uploading || saving}
                        />
                        <p className="text-xs text-ink-muted">{t.uploadHint}</p>
                        {uploading ? <p className="text-xs font-medium text-primary">Uploading…</p> : null}
                        {formErrors.image ? <p className="text-xs text-red-500">{formErrors.image}</p> : null}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className={cn('min-w-0 text-sm', formMode !== 'products' && 'mt-4')}>
                <span className="mb-1.5 block font-medium">{t.itemsLabel}</span>
                <div className="space-y-2">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="flex min-w-0 items-center gap-2">
                      <input
                        placeholder={t.itemName}
                        className={cn(controlClass, 'h-10 min-w-0 flex-1 px-3')}
                        value={item.name}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            items: form.items.map((row, i) => (i === idx ? { ...row, name: e.target.value } : row)),
                          })
                        }
                      />
                      <input
                        type="number"
                        min="1"
                        aria-label={t.itemQty}
                        className={cn(controlClass, 'h-10 w-16 shrink-0 px-2 sm:w-20 sm:px-3')}
                        value={item.quantity}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            items: form.items.map((row, i) =>
                              i === idx ? { ...row, quantity: Number(e.target.value) || 1 } : row
                            ),
                          })
                        }
                      />
                      <button
                        type="button"
                        className={iconBtnClass}
                        aria-label={t.delete}
                        onClick={() =>
                          setForm({
                            ...form,
                            items: form.items.length > 1 ? form.items.filter((_, i) => i !== idx) : [{ name: '', quantity: 1 }],
                          })
                        }
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setForm({ ...form, items: [...form.items, { name: '', quantity: 1 }] })}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {t.addItem}
                  </Button>
                  {catalog.length ? (
                    <label className="relative min-w-0">
                      <span className="sr-only">{t.addFromCatalog}</span>
                      <select
                        className={cn(controlClass, 'h-9 max-w-full appearance-none py-0 pl-3 pr-8 text-xs')}
                        defaultValue=""
                        onChange={(e) => {
                          const name = e.target.value;
                          if (!name) return;
                          setForm((f) => ({ ...f, items: [...f.items.filter((i) => i.name.trim()), { name, quantity: 1 }] }));
                          e.target.value = '';
                        }}
                      >
                        <option value="">{t.selectProduct}</option>
                        {catalog.map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 justify-end gap-2 border-t border-line bg-surface-card px-5 py-4 sm:px-6">
              <Button type="button" variant="outline" onClick={closeForm}>
                {t.cancel}
              </Button>
              <Button type="submit" loading={saving || uploading}>
                {formMode === 'create' ? t.create : formMode === 'products' ? t.saveProducts : t.save}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {dialog?.type === 'items' || dialog?.type === 'details' ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40"
            aria-label={t.close}
            onClick={() => setDialog(null)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-line bg-surface-card p-5 shadow-xl dark:border-white/[0.08]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-ink">
                  {dialog.type === 'details' ? t.detailsTitle : t.itemsTitle}
                </h2>
                <p className="mt-0.5 text-sm text-ink-muted">{dialog.pkg.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setDialog(null)}
                className="rounded-lg p-1 text-ink-muted hover:bg-surface-muted hover:text-ink"
                aria-label={t.close}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {dialog.type === 'details' ? (
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase text-ink-muted">{t.codeLabel}</dt>
                  <dd className="mt-0.5 text-sm font-medium">{dialog.pkg.code}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-ink-muted">{t.priceLabel}</dt>
                  <dd className="mt-0.5 text-sm font-medium">{formatCurrency(dialog.pkg.price)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-ink-muted">{t.stockLabel}</dt>
                  <dd className="mt-0.5 text-sm font-medium">{formatNumber(dialog.pkg.stock ?? 0)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-ink-muted">{t.statusLabel}</dt>
                  <dd className="mt-0.5">
                    <StatusBadge
                      active={dialog.pkg.isActive !== false}
                      label={dialog.pkg.isActive !== false ? common.status.active : common.status.inactive}
                    />
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase text-ink-muted">{t.descriptionLabel}</dt>
                  <dd className="mt-0.5 text-sm">{dialog.pkg.description || '—'}</dd>
                </div>
              </dl>
            ) : null}
            <ul className="mt-4 max-h-[50vh] space-y-2 overflow-y-auto">
              {packageItems(dialog.pkg).length ? (
                packageItems(dialog.pkg).map((item, idx) => (
                  <li
                    key={`${item.name}-${idx}`}
                    className="flex items-center justify-between rounded-xl border border-line/80 px-3 py-2 text-sm"
                  >
                    <span className="text-ink">{item.name}</span>
                    <span className="text-xs font-medium text-ink-muted">× {item.quantity}</span>
                  </li>
                ))
              ) : (
                <p className="text-sm text-ink-muted">{t.noItems}</p>
              )}
            </ul>
          </div>
        </div>
      ) : null}

      {dialog?.type === 'delete' ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-ink/40" onClick={() => setDialog(null)} />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md rounded-2xl border border-line bg-surface-card p-6 shadow-xl"
          >
            <h3 className="font-display text-lg font-bold text-ink">{t.deleteTitle}</h3>
            <p className="mt-2 text-sm text-ink-muted">{interpolate(t.deleteConfirm, { name: dialog.pkg.name })}</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialog(null)}>
                {t.cancel}
              </Button>
              <Button type="button" variant="danger" loading={busyId === dialog.pkg.id} onClick={confirmDelete}>
                {t.delete}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {menuPkg && menuPos && typeof document !== 'undefined'
        ? createPortal(
            <div
              role="menu"
              data-package-menu
              className="fixed z-[80] w-56 rounded-xl border border-line bg-surface-card py-1 shadow-xl dark:border-white/[0.08]"
              style={{
                top: menuPos.top,
                left: menuPos.left,
                transform: menuPos.openUp ? 'translateY(-100%)' : undefined,
              }}
            >
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-surface-muted"
                  onClick={() => {
                    closeMenu();
                    setDialog({ type: 'details', pkg: menuPkg });
                  }}
                >
                  <Eye className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
                  {t.viewDetails}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-surface-muted"
                  onClick={() => fillForm(menuPkg, 'products')}
                >
                  <PackageIcon className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
                  {t.manageProducts}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  disabled={busyId === menuPkg.id}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-surface-muted disabled:opacity-50"
                  onClick={() => duplicate(menuPkg)}
                >
                  <Copy className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
                  {t.duplicate}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  disabled={busyId === menuPkg.id}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-surface-muted disabled:opacity-50"
                  onClick={() => toggleActive(menuPkg)}
                >
                  <Power className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
                  {menuPkg.isActive !== false ? t.deactivate : t.activate}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                  onClick={() => {
                    closeMenu();
                    setDialog({ type: 'delete', pkg: menuPkg });
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 shrink-0" />
                  {t.delete}
                </button>
              </div>,
            document.body
          )
        : null}
    </div>
  );
}
