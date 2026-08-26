'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Upload, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, Td, Tr } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';

type ProductForm = {
  sku: string;
  name: string;
  description: string;
  price_inr: string;
  image_url: string;
  stock_count: string;
  points_per_unit: string;
  is_active: boolean;
};

const emptyForm: ProductForm = {
  sku: '',
  name: '',
  description: '',
  price_inr: '',
  image_url: '',
  stock_count: '100',
  points_per_unit: '10',
  is_active: true,
};

function ProductFields({
  form,
  setForm,
  fileRef,
  uploading,
  saving,
  onImageSelected,
}: {
  form: ProductForm;
  setForm: (next: ProductForm | ((prev: ProductForm) => ProductForm)) => void;
  fileRef: React.RefObject<HTMLInputElement | null>;
  uploading: boolean;
  saving: boolean;
  onImageSelected: (file: File | null) => void;
}) {
  return (
    <>
      {(
        [
          ['sku', 'SKU'],
          ['name', 'Name'],
          ['price_inr', 'Price (₹)'],
          ['points_per_unit', 'Points per unit'],
          ['stock_count', 'Stock'],
        ] as const
      ).map(([key, label]) => (
        <label key={key} className="text-sm">
          <span className="font-medium">{label}</span>
          <input
            required
            className="mt-1 w-full rounded-lg border border-line px-3 py-2"
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          />
        </label>
      ))}

      <div className="text-sm sm:col-span-2">
        <span className="font-medium">Product image</span>
        <div className="mt-1 flex flex-wrap items-start gap-4">
          <div className="h-28 w-28 overflow-hidden rounded-lg border border-line bg-surface-muted">
            {form.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.image_url} alt="Product preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-ink-muted">
                <Upload className="h-6 w-6" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="block w-full max-w-xs text-sm text-ink-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-primary-600"
              onChange={(e) => onImageSelected(e.target.files?.[0] || null)}
              disabled={uploading || saving}
            />
            <p className="text-xs text-ink-muted">JPEG, PNG, WEBP or GIF · max 5 MB · stored on S3</p>
            {uploading ? <p className="text-xs font-medium text-primary">Uploading to S3…</p> : null}
            {form.image_url ? (
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-accent-red"
                onClick={() => {
                  setForm((f) => ({ ...f, image_url: '' }));
                  if (fileRef.current) fileRef.current.value = '';
                }}
              >
                <X className="h-3.5 w-3.5" />
                Remove image
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <label className="text-sm sm:col-span-2">
        <span className="font-medium">Description</span>
        <textarea
          className="mt-1 w-full rounded-lg border border-line px-3 py-2"
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
        />
        Active (visible in shop)
      </label>
    </>
  );
}

export default function AdminProductsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const createFileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (!editingId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeEdit();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [editingId]);

  function closeEdit() {
    setEditingId(null);
    setEditForm(emptyForm);
    if (editFileRef.current) editFileRef.current.value = '';
  }

  function startEdit(p: any) {
    setEditingId(p.id);
    setEditForm({
      sku: p.sku,
      name: p.name,
      description: p.description || '',
      price_inr: String((p.price_paise || 0) / 100),
      image_url: p.image_url || '',
      stock_count: String(p.stock_count ?? 0),
      points_per_unit: String(p.points_per_unit ?? 0),
      is_active: Boolean(p.is_active),
    });
    if (editFileRef.current) editFileRef.current.value = '';
  }

  async function onImageSelected(
    file: File | null,
    setForm: (next: ProductForm | ((prev: ProductForm) => ProductForm)) => void,
    fileRef: React.RefObject<HTMLInputElement | null>
  ) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB');
      return;
    }
    setUploading(true);
    try {
      const { url } = await api.uploadProductImage(file);
      setForm((f) => ({ ...f, image_url: url }));
      toast.success('Image uploaded');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Image upload failed');
      if (fileRef.current) fileRef.current.value = '';
    } finally {
      setUploading(false);
    }
  }

  function toPayload(form: ProductForm) {
    return {
      sku: form.sku,
      name: form.name,
      description: form.description,
      price_paise: Math.round(Number(form.price_inr) * 100),
      image_url: form.image_url,
      stock_count: Number(form.stock_count),
      points_per_unit: Number(form.points_per_unit),
      is_active: form.is_active,
    };
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!createForm.image_url) {
      toast.error('Upload a product image');
      return;
    }
    setSaving(true);
    try {
      await api.createProduct(toPayload(createForm));
      toast.success('Product created');
      setCreateForm(emptyForm);
      if (createFileRef.current) createFileRef.current.value = '';
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function onUpdate(e: FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    if (!editForm.image_url) {
      toast.error('Upload a product image');
      return;
    }
    setSaving(true);
    try {
      await api.updateProduct(editingId, toPayload(editForm));
      toast.success('Product updated');
      closeEdit();
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(id: string) {
    try {
      await api.deleteProduct(id);
      toast.success('Product deactivated');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Products</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Manage repurchase catalog — price, image, description, and points per purchase.
        </p>
      </div>

      <Card>
        <h2 className="font-display text-lg font-bold">Add product</h2>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={onCreate}>
          <ProductFields
            form={createForm}
            setForm={setCreateForm}
            fileRef={createFileRef}
            uploading={uploading}
            saving={saving}
            onImageSelected={(file) => onImageSelected(file, setCreateForm, createFileRef)}
          />
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" loading={saving || uploading}>
              Create
            </Button>
          </div>
        </form>
      </Card>

      <Card padding={false}>
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <Table headers={['Product', 'Price', 'Points', 'Stock', 'Status', '']}>
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
                <Td>
                  <Badge tone={p.is_active ? 'success' : 'danger'}>{p.is_active ? 'active' : 'off'}</Badge>
                </Td>
                <Td>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(p)}>
                      Edit
                    </Button>
                    {p.is_active ? (
                      <Button size="sm" variant="ghost" onClick={() => deactivate(p.id)}>
                        Deactivate
                      </Button>
                    ) : null}
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>

      {editingId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden p-4">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40"
            aria-label="Close edit form"
            onClick={closeEdit}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-product-title"
            className="relative z-10 flex w-full max-w-2xl max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-xl border border-line bg-white shadow-elevated"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
              <h2 id="edit-product-title" className="font-display text-lg font-bold">
                Edit product
              </h2>
              <button
                type="button"
                className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-muted hover:text-ink"
                aria-label="Close"
                onClick={closeEdit}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form className="flex min-h-0 flex-1 flex-col" onSubmit={onUpdate}>
              <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto px-5 py-4 sm:grid-cols-2 sm:px-6">
                <ProductFields
                  form={editForm}
                  setForm={setEditForm}
                  fileRef={editFileRef}
                  uploading={uploading}
                  saving={saving}
                  onImageSelected={(file) => onImageSelected(file, setEditForm, editFileRef)}
                />
              </div>
              <div className="flex shrink-0 gap-2 border-t border-line px-5 py-4 sm:px-6">
                <Button type="submit" loading={saving || uploading}>
                  Update
                </Button>
                <Button type="button" variant="outline" onClick={closeEdit}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
