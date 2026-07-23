'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Star } from 'lucide-react';
import { PublicFooter, PublicHeader } from '@/components/layout/PublicShell';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

type Product = {
  id: string;
  name: string;
  description?: string;
  price_inr: number;
  image_url?: string;
  stock_count: number;
  points_per_unit: number;
};

export default function ShopPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getShopProducts()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  async function addToCart(productId: string) {
    if (!user) {
      toast.error('Please log in to add items to cart');
      window.location.href = `/login?next=/shop`;
      return;
    }
    try {
      const cart = await api.getCart().catch(() => ({ items: [] }));
      const existing = (cart.items || []).find((i: any) => i.product_id === productId);
      const qty = (existing?.quantity || 0) + 1;
      await api.upsertCart(productId, qty);
      toast.success('Added to cart');
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Could not add to cart');
    }
  }

  return (
    <div className="min-h-screen bg-surface-soft">
      <PublicHeader />
      <main className="page-container py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-eyebrow">Repurchase store</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-ink sm:text-4xl">Shop products</h1>
            <p className="mt-2 max-w-2xl text-sm text-ink-muted">
              Buy products individually after joining. Every purchase earns points — redeem points to wallet
              (50% to you, 50% to your referrer).
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/shop/cart">
              <Button variant="outline">
                <ShoppingCart className="h-4 w-4" /> Cart
              </Button>
            </Link>
            {user ? (
              <Link href="/user/points">
                <Button variant="primary">My points</Button>
              </Link>
            ) : null}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Spinner />
          </div>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => (
              <article
                key={p.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-line bg-white shadow-sm transition hover:shadow-md"
              >
                <Link href={`/shop/${p.id}`} className="relative aspect-square bg-surface-muted">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-ink-muted">No image</div>
                  )}
                </Link>
                <div className="flex flex-1 flex-col p-4">
                  <Link href={`/shop/${p.id}`} className="font-display text-base font-bold text-ink hover:text-primary">
                    {p.name}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{p.description}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-amber-700">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    Earn {p.points_per_unit} pts
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                    <p className="font-display text-lg font-extrabold text-primary">{formatCurrency(p.price_inr)}</p>
                    <Button size="sm" onClick={() => addToCart(p.id)} disabled={p.stock_count < 1}>
                      {p.stock_count < 1 ? 'Out of stock' : 'Add'}
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
