'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, Upload, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, Td, Tr } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';

const emptyForm = {
  sku: '',
  name: '',
  description: '',
  category: '',
  price_inr: '',
  image_urls: [] as string[],
  stock_count: '100',
  points_per_unit: '10',
};

type ProductAction = 'activate' | 'deactivate' | 'delete';

export default function AdminProductsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [statusLoadingId, setStatusLoadingId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    id: string;
    name: string;
    action: ProductAction;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function load() {
    api
      .getAdminProducts()
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    if (fileRef.current) fileRef.current.value = '';
  }

  function openAddForm() {
    resetForm();
    setFormOpen(true);
  }

  function closeForm() {
    resetForm();
    setFormOpen(false);
  }

  function startEdit(p: any) {
    setEditingId(p.id);
    const urls =
      Array.isArray(p.image_urls) && p.image_urls.length
        ? p.image_urls
        : p.image_url
          ? [p.image_url]
          : [];
    setForm({
      sku: p.sku,
      name: p.name,
      description: p.description || '',
      category: p.category || '',
      price_inr: String((p.price_paise || 0) / 100),
      image_urls: urls,
      stock_count: String(p.stock_count ?? 0),
      points_per_unit: String(p.points_per_unit ?? 0),
    });
    if (fileRef.current) fileRef.current.value = '';
    setFormOpen(true);
  }

  async function onImagesSelected(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files);
    for (const file of list) {
      if (!file.type.startsWith('image/')) {
        toast.error(`Skipped ${file.name}: not an image`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`Skipped ${file.name}: must be under 5 MB`);
        continue;
      }
    }
    const valid = list.filter((f) => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024);
    if (!valid.length) return;

    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of valid) {
        const { url } = await api.uploadProductImage(file);
        uploaded.push(url);
      }
      setForm((f) => ({ ...f, image_urls: [...f.image_urls, ...uploaded] }));
      toast.success(uploaded.length === 1 ? 'Image uploaded' : `${uploaded.length} images uploaded`);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Image upload failed');
      if (fileRef.current) fileRef.current.value = '';
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.image_urls.length) {
      toast.error('Upload at least one product image');
      return;
    }
    setSaving(true);
    const payload = {
      sku: form.sku,
      name: form.name,
      description: form.description,
      category: form.category.trim() || null,
      price_paise: Math.round(Number(form.price_inr) * 100),
      image_url: form.image_urls[0],
      image_urls: form.image_urls,
      stock_count: Number(form.stock_count),
      points_per_unit: Number(form.points_per_unit),
    };
    try {
      if (editingId) {
        await api.updateProduct(editingId, payload);
        toast.success('Product updated');
      } else {
        await api.createProduct(payload);
        toast.success('Product created');
      }
      closeForm();
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function applyStatusChange() {
    if (!confirmAction) return;
    const { id, action } = confirmAction;
    setStatusLoadingId(id);
    setConfirmAction(null);
    try {
      if (action === 'delete') {
        await api.permanentlyDeleteProduct(id);
        setRows((prev) => prev.filter((row) => row.id !== id));
        toast.success('Product deleted');
        return;
      }

      const nextActive = action === 'activate';
      const updated = await api.updateProduct(id, { is_active: nextActive });
      setRows((prev) =>
        prev.map((row) =>
          row.id === id
            ? { ...row, ...(updated && typeof updated === 'object' ? updated : {}), is_active: nextActive }
            : row
        )
      );
      toast.success(nextActive ? 'Product activated' : 'Product deactivated');
    } catch (err: any) {
      toast.error(
        err?.response?.data?.detail ||
          (action === 'delete' ? 'Failed to delete product' : 'Failed to update status')
      );
    } finally {
      setStatusLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Products</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Manage repurchase catalog — price, image, description, and points per purchase.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => (formOpen && !editingId ? closeForm() : openAddForm())}
          variant={formOpen && !editingId ? 'outline' : 'primary'}
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      <Card padding={false}>
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <Table
            headers={['Product', 'Price', 'Points', 'Stock', 'Status', 'Actions']}
            tableClassName="min-w-[920px]"
            headerCellClassNames={[undefined, 'whitespace-nowrap', 'whitespace-nowrap', 'whitespace-nowrap', 'whitespace-nowrap', 'text-center']}
            colGroup={
              <colgroup>
                <col className="w-[42%]" />
                <col className="w-[11%]" />
                <col className="w-[9%]" />
                <col className="w-[9%]" />
                <col className="w-[9%]" />
                <col className="w-[20%]" />
              </colgroup>
            }
          >
            {rows.map((p) => (
              <Tr key={p.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt="" className="h-12 w-12 rounded object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded bg-surface-muted" />
                    )}
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-ink-muted">{p.sku}</p>
                    </div>
                  </div>
                </Td>
                <Td>{formatCurrency((p.price_paise || 0) / 100)}</Td>
                <Td>{p.points_per_unit}</Td>
                <Td>{p.stock_count}</Td>
                <Td className="whitespace-nowrap">
                  <Badge tone={p.is_active ? 'success' : 'danger'}>
                    {p.is_active ? 'active' : 'inactive'}
                  </Badge>
                </Td>
                <Td className="whitespace-nowrap align-middle">
                  <div className="flex items-center justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(p)}>
                      Edit
                    </Button>
                    {p.is_active ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        loading={statusLoadingId === p.id}
                        disabled={statusLoadingId === p.id}
                        onClick={() =>
                          setConfirmAction({ id: p.id, name: p.name, action: 'deactivate' })
                        }
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        loading={statusLoadingId === p.id}
                        disabled={statusLoadingId === p.id}
                        onClick={() =>
                          setConfirmAction({ id: p.id, name: p.name, action: 'activate' })
                        }
                      >
                        Activate
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="danger"
                      loading={statusLoadingId === p.id}
                      disabled={statusLoadingId === p.id}
                      onClick={() => setConfirmAction({ id: p.id, name: p.name, action: 'delete' })}
                    >
                      Delete
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>

      <AnimatePresence initial={false}>
        {formOpen ? (
          <motion.div
            key="product-form-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
            onClick={closeForm}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="w-full max-w-4xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="max-h-[90vh] overflow-y-auto">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="font-display text-lg font-bold">
                    {editingId ? 'Edit product' : 'Add product'}
                  </h2>
                  <button
                    type="button"
                    aria-label="Close product form"
                    className="rounded-md p-1 text-ink-muted transition hover:bg-surface-muted hover:text-ink"
                    onClick={closeForm}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
                  {(
                    [
                      ['sku', 'SKU'],
                      ['name', 'Name'],
                      ['category', 'Category'],
                      ['price_inr', 'Price (₹)'],
                      ['points_per_unit', 'Points per unit'],
                      ['stock_count', 'Stock'],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="text-sm">
                      <span className="font-medium">{label}</span>
                      <input
                        required={key !== 'category'}
                        placeholder={key === 'category' ? 'e.g. Personal Care' : undefined}
                        className="mt-1 w-full rounded-lg border border-line bg-surface-card px-3 py-2 text-sm text-ink"
                        value={(form as any)[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      />
                    </label>
                  ))}

                  <div className="text-sm sm:col-span-2">
                    <span className="font-medium">Product images</span>
                    <div className="mt-1 flex flex-wrap items-start gap-4">
                      <div className="flex flex-wrap gap-2">
                        {form.image_urls.length ? (
                          form.image_urls.map((url, idx) => (
                            <div
                              key={`${url}-${idx}`}
                              className="relative h-28 w-28 overflow-hidden rounded-lg border border-line bg-surface-muted"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={url}
                                alt={`Product preview ${idx + 1}`}
                                className="h-full w-full object-cover"
                              />
                              <button
                                type="button"
                                aria-label={`Remove image ${idx + 1}`}
                                className="absolute right-1 top-1 rounded-md bg-ink/70 p-0.5 text-white hover:bg-accent-red"
                                onClick={() =>
                                  setForm((f) => ({
                                    ...f,
                                    image_urls: f.image_urls.filter((_, i) => i !== idx),
                                  }))
                                }
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="flex h-28 w-28 items-center justify-center rounded-lg border border-line bg-surface-muted text-ink-muted">
                            <Upload className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <input
                          ref={fileRef}
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="block w-full max-w-xs text-sm text-ink-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[var(--color-primary-hover)]"
                          onChange={(e) => onImagesSelected(e.target.files)}
                          disabled={uploading || saving}
                        />
                        <p className="text-xs text-ink-muted">
                          JPEG, PNG, WEBP or GIF · max 5 MB each · multiple files · stored on S3
                        </p>
                        {uploading ? (
                          <p className="text-xs font-medium text-primary">Uploading to S3…</p>
                        ) : null}
                        {form.image_urls.length ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-accent-red"
                            onClick={() => {
                              setForm((f) => ({ ...f, image_urls: [] }));
                              if (fileRef.current) fileRef.current.value = '';
                            }}
                          >
                            <X className="h-3.5 w-3.5" />
                            Remove all images
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <label className="text-sm sm:col-span-2">
                    <span className="font-medium">Description</span>
                    <textarea
                      className="mt-1 w-full rounded-lg border border-line bg-surface-card px-3 py-2 text-sm text-ink"
                      rows={3}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </label>
                  <div className="flex gap-2 sm:col-span-2">
                    <Button type="submit" loading={saving || uploading}>
                      {editingId ? 'Update' : 'Create'}
                    </Button>
                    <Button type="button" variant="outline" onClick={closeForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {confirmAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-xl border border-line bg-surface-card p-6 shadow-none"
          >
            <h3 className="font-display text-lg font-bold text-ink">
              {confirmAction.action === 'activate'
                ? 'Activate product?'
                : confirmAction.action === 'deactivate'
                  ? 'Deactivate product?'
                  : 'Delete product permanently?'}
            </h3>
            <p className="mt-2 text-sm text-ink-muted">
              {confirmAction.action === 'activate'
                ? `Make “${confirmAction.name}” visible in the shop again?`
                : confirmAction.action === 'deactivate'
                  ? `Hide “${confirmAction.name}” from the shop? You can activate it later.`
                  : `Permanently delete “${confirmAction.name}”? This cannot be undone.`}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setConfirmAction(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant={confirmAction.action === 'deactivate' || confirmAction.action === 'delete' ? 'danger' : 'primary'}
                onClick={applyStatusChange}
              >
                {confirmAction.action === 'activate'
                  ? 'Activate'
                  : confirmAction.action === 'deactivate'
                    ? 'Deactivate'
                    : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
