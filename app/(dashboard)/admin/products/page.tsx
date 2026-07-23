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

const emptyForm = {
  sku: '',
  name: '',
  description: '',
  price_inr: '',
  image_urls: [] as string[],
  stock_count: '100',
  points_per_unit: '10',
  is_active: true,
};

const MAX_IMAGES = 8;

export default function AdminProductsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
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

  function startEdit(p: any) {
    const urls: string[] =
      Array.isArray(p.image_urls) && p.image_urls.length
        ? p.image_urls
        : p.image_url
          ? [p.image_url]
          : [];
    setEditingId(p.id);
    setForm({
      sku: p.sku,
      name: p.name,
      description: p.description || '',
      price_inr: String((p.price_paise || 0) / 100),
      image_urls: urls,
      stock_count: String(p.stock_count ?? 0),
      points_per_unit: String(p.points_per_unit ?? 0),
      is_active: Boolean(p.is_active),
    });
    if (fileRef.current) fileRef.current.value = '';
  }

  async function onImagesSelected(files: FileList | null) {
    if (!files?.length) return;
    const remaining = MAX_IMAGES - form.image_urls.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }
    const selected = Array.from(files).slice(0, remaining);
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of selected) {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name}: not an image`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name}: must be under 5 MB`);
          continue;
        }
        const { url } = await api.uploadProductImage(file);
        uploaded.push(url);
      }
      if (uploaded.length) {
        setForm((f) => ({ ...f, image_urls: [...f.image_urls, ...uploaded] }));
        toast.success(uploaded.length === 1 ? 'Image uploaded' : `${uploaded.length} images uploaded`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Image upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function removeImage(url: string) {
    setForm((f) => ({ ...f, image_urls: f.image_urls.filter((u) => u !== url) }));
  }

  function moveImage(index: number, dir: -1 | 1) {
    setForm((f) => {
      const next = [...f.image_urls];
      const j = index + dir;
      if (j < 0 || j >= next.length) return f;
      [next[index], next[j]] = [next[j], next[index]];
      return { ...f, image_urls: next };
    });
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
      price_paise: Math.round(Number(form.price_inr) * 100),
      image_urls: form.image_urls,
      image_url: form.image_urls[0],
      stock_count: Number(form.stock_count),
      points_per_unit: Number(form.points_per_unit),
      is_active: form.is_active,
    };
    try {
      if (editingId) {
        await api.updateProduct(editingId, payload);
        toast.success('Product updated');
      } else {
        await api.createProduct(payload);
        toast.success('Product created');
      }
      resetForm();
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
          Manage repurchase catalog — price, images, description, and points per purchase.
        </p>
      </div>

      <Card>
        <h2 className="font-display text-lg font-bold">{editingId ? 'Edit product' : 'Add product'}</h2>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
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
                value={(form as any)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </label>
          ))}

          <div className="text-sm sm:col-span-2">
            <span className="font-medium">Product images</span>
            <p className="mt-0.5 text-xs text-ink-muted">
              First image is the cover. Upload up to {MAX_IMAGES} images (JPEG/PNG/WEBP/GIF · max 5 MB each).
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {form.image_urls.map((url, idx) => (
                <div key={url} className="relative w-28">
                  <div className="h-28 w-28 overflow-hidden rounded-lg border border-line bg-surface-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Product ${idx + 1}`} className="h-full w-full object-cover" />
                  </div>
                  {idx === 0 ? (
                    <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                      Cover
                    </span>
                  ) : null}
                  <div className="mt-1 flex justify-between gap-1">
                    <button
                      type="button"
                      className="text-[10px] font-semibold text-ink-muted hover:text-primary disabled:opacity-30"
                      disabled={idx === 0}
                      onClick={() => moveImage(idx, -1)}
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-ink-muted hover:text-accent-red"
                      onClick={() => removeImage(url)}
                    >
                      <X className="h-3 w-3" />
                      Remove
                    </button>
                    <button
                      type="button"
                      className="text-[10px] font-semibold text-ink-muted hover:text-primary disabled:opacity-30"
                      disabled={idx === form.image_urls.length - 1}
                      onClick={() => moveImage(idx, 1)}
                    >
                      →
                    </button>
                  </div>
                </div>
              ))}
              {form.image_urls.length < MAX_IMAGES ? (
                <label className="flex h-28 w-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-line bg-surface-muted text-ink-muted hover:border-primary hover:text-primary">
                  <Upload className="h-6 w-6" />
                  <span className="mt-1 text-[10px] font-semibold">Add images</span>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    className="hidden"
                    onChange={(e) => onImagesSelected(e.target.files)}
                    disabled={uploading || saving}
                  />
                </label>
              ) : null}
            </div>
            {uploading ? <p className="mt-2 text-xs font-medium text-primary">Uploading to S3…</p> : null}
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
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" loading={saving || uploading}>
              {editingId ? 'Update' : 'Create'}
            </Button>
            {editingId ? (
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            ) : null}
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
            {rows.map((p) => {
              const cover =
                (Array.isArray(p.image_urls) && p.image_urls[0]) || p.image_url || null;
              const count = Array.isArray(p.image_urls) ? p.image_urls.length : cover ? 1 : 0;
              return (
                <Tr key={p.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cover} alt="" className="h-12 w-12 rounded object-cover" />
                      ) : (
                        <div className="h-12 w-12 rounded bg-surface-muted" />
                      )}
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-ink-muted">
                          {p.sku}
                          {count > 1 ? ` · ${count} images` : ''}
                        </p>
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
              );
            })}
          </Table>
        )}
      </Card>
    </div>
  );
}
