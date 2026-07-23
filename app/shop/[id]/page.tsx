'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PublicFooter, PublicHeader } from '@/components/layout/PublicShell';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { useAuth } from '@/hooks/useAuth';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api
      .getShopProduct(id)
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  async function addToCart() {
    if (!user) {
      router.push(`/login?next=/shop/${id}`);
      return;
    }
    try {
      const cart = await api.getCart().catch(() => ({ items: [] }));
      const existing = (cart.items || []).find((i: any) => i.product_id === id);
      await api.upsertCart(id, (existing?.quantity || 0) + qty);
      toast.success('Added to cart');
      router.push('/shop/cart');
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Failed');
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page-container py-20 text-center">
        <p>Product not found</p>
        <Link href="/shop" className="mt-4 inline-block text-primary">
          Back to shop
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      <main className="page-container grid gap-10 py-10 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-line bg-surface-muted">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image_url} alt={product.name} className="aspect-square w-full object-cover" />
          ) : (
            <div className="flex aspect-square items-center justify-center text-ink-muted">No image</div>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{product.sku}</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-ink">{product.name}</h1>
          <p className="mt-4 text-ink-secondary">{product.description}</p>
          <p className="mt-6 font-display text-4xl font-extrabold text-primary">
            {formatCurrency(product.price_inr)}
          </p>
          <p className="mt-2 text-sm text-amber-700">Earn {product.points_per_unit} points per unit</p>
          <p className="mt-1 text-sm text-ink-muted">In stock: {product.stock_count}</p>
          <div className="mt-6 flex items-center gap-3">
            <label className="text-sm font-medium">Qty</label>
            <input
              type="number"
              min={1}
              max={product.stock_count}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
              className="w-20 rounded-lg border border-line px-3 py-2"
            />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={addToCart} disabled={product.stock_count < 1}>
              Add to cart
            </Button>
            <Link href="/shop">
              <Button variant="outline">Continue shopping</Button>
            </Link>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
