'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PublicFooter, PublicHeader } from '@/components/layout/PublicShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { useAuth } from '@/hooks/useAuth';

export default function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    api
      .getCart()
      .then(setCart)
      .catch((e: any) => {
        const detail = e?.response?.data?.detail;
        const msg =
          typeof detail === 'string'
            ? detail
            : e?.response?.status === 403
              ? 'Only active members can use the cart. Complete entry payment first.'
              : 'Could not load cart';
        setError(msg);
        setCart({ items: [], total_paise: 0, total_points: 0 });
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login?next=/shop/cart');
      return;
    }
    load();
  }, [user, authLoading, router]);

  async function setQty(productId: string, quantity: number) {
    try {
      const next = await api.upsertCart(productId, quantity);
      setCart(next);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Update failed');
    }
  }

  if (authLoading || !user || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const items = cart?.items || [];

  return (
    <div className="min-h-screen bg-surface-soft">
      <PublicHeader />
      <main className="page-container py-10">
        <h1 className="font-display text-3xl font-extrabold text-ink">Your cart</h1>

        {error ? (
          <Card className="mt-8 space-y-3 text-center">
            <p className="text-ink-muted">{error}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" onClick={load}>
                Retry
              </Button>
              <Link href="/shop">
                <Button>Browse products</Button>
              </Link>
            </div>
          </Card>
        ) : items.length === 0 ? (
          <Card className="mt-8 text-center">
            <p className="text-ink-muted">Your cart is empty.</p>
            <Link href="/shop" className="mt-4 inline-block">
              <Button>Browse products</Button>
            </Link>
          </Card>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="space-y-3">
              {items.map((item: any) => (
                <Card key={item.id} className="flex gap-4">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                    {item.product?.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.product.image_url} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{item.product?.name}</p>
                    <p className="text-sm text-primary">
                      {formatCurrency((item.product?.price_paise || 0) / 100)}
                    </p>
                    <p className="text-xs text-amber-700">{item.line_points} pts</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setQty(item.product_id, item.quantity - 1)}
                      >
                        −
                      </Button>
                      <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setQty(item.product_id, item.quantity + 1)}
                      >
                        +
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setQty(item.product_id, 0)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <Card>
              <p className="text-sm text-ink-muted">Order total</p>
              <p className="mt-1 font-display text-3xl font-extrabold text-primary">
                {formatCurrency((cart.total_paise || 0) / 100)}
              </p>
              <p className="mt-2 text-sm text-amber-700">You will earn {cart.total_points || 0} points</p>
              <Link href="/shop/checkout" className="mt-6 block">
                <Button className="w-full" variant="accent">
                  Proceed to checkout
                </Button>
              </Link>
              <Link href="/shop" className="mt-3 block text-center text-sm text-primary">
                Continue shopping
              </Link>
            </Card>
          </div>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
