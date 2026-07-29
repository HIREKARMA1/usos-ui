'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ShopBreadcrumb, ShopLayout } from '@/components/shop/ShopLayout';
import { Button } from '@/components/ui/Button';
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
              ? 'Activate your membership (₹2,500) before shopping.'
              : 'Couldn’t load your cart. Please try again.';
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
      <div className="flex min-h-screen items-center justify-center bg-[#f1f3f6]">
        <Spinner />
      </div>
    );
  }

  const items = cart?.items || [];
  const total = (cart?.total_paise || 0) / 100;

  return (
    <ShopLayout>
      <main className="page-container py-4 sm:py-6">
        <ShopBreadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Shop', href: '/shop' },
            { label: 'Cart' },
          ]}
        />
        <h1 className="mt-3 text-xl font-bold text-ink sm:text-2xl">
          My Cart {items.length ? `(${items.length})` : ''}
        </h1>

        {error ? (
          <div className="mt-4 border border-line bg-white p-8 text-center shadow-sm">
            <p className="text-ink-muted">{error}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button variant="outline" onClick={load}>
                Retry
              </Button>
              <Link href="/shop">
                <Button>Browse products</Button>
              </Link>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="mt-4 border border-line bg-white p-12 text-center shadow-sm">
            <p className="text-lg font-semibold text-ink">Your cart is empty</p>
            <p className="mt-1 text-sm text-ink-muted">Add products from the shop to continue.</p>
            <Link href="/shop" className="mt-6 inline-block">
              <Button>Shop now</Button>
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_0.7fr]">
            <div className="space-y-3">
              {items.map((item: any) => (
                <div key={item.id} className="flex gap-4 border border-line bg-white p-4 shadow-sm">
                  <Link href={`/shop/${item.product_id}`} className="h-24 w-24 shrink-0 overflow-hidden border border-line bg-white">
                    {item.product?.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.product.image_url} alt="" className="h-full w-full object-contain p-1" />
                    ) : null}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/shop/${item.product_id}`} className="font-semibold text-ink hover:text-primary">
                      {item.product?.name}
                    </Link>
                    <p className="mt-1 text-base font-bold text-ink">
                      {formatCurrency((item.product?.price_paise || 0) / 100)}
                    </p>
                    <p className="text-xs font-medium text-green">+{item.line_points} pts</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <div className="inline-flex items-center border border-line">
                        <button
                          type="button"
                          className="h-8 w-8 hover:bg-surface-muted"
                          onClick={() => setQty(item.product_id, item.quantity - 1)}
                        >
                          −
                        </button>
                        <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          type="button"
                          className="h-8 w-8 hover:bg-surface-muted"
                          onClick={() => setQty(item.product_id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        className="text-sm font-semibold text-ink-muted hover:text-accent-red"
                        onClick={() => setQty(item.product_id, 0)}
                      >
                        REMOVE
                      </button>
                    </div>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-bold text-ink">
                      {formatCurrency((item.line_total_paise || 0) / 100)}
                    </p>
                  </div>
                </div>
              ))}
              <div className="sticky bottom-0 border border-line bg-white p-4 shadow-elevated lg:hidden">
                <Link href="/shop/checkout">
                  <Button className="w-full" variant="accent" size="lg">
                    Place order · {formatCurrency(total)}
                  </Button>
                </Link>
              </div>
            </div>

            <aside className="h-fit border border-line bg-white p-4 shadow-sm lg:sticky lg:top-[7.5rem]">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Price details</p>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt>Price ({items.length} item{items.length > 1 ? 's' : ''})</dt>
                  <dd>{formatCurrency(total)}</dd>
                </div>
                <div className="flex justify-between text-green">
                  <dt>Points you earn</dt>
                  <dd>+{cart.total_points || 0} pts</dd>
                </div>
                <div className="flex justify-between border-t border-dashed border-line pt-3 text-base font-bold">
                  <dt>Total amount</dt>
                  <dd>{formatCurrency(total)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs font-medium text-green">You will earn {cart.total_points || 0} points on this order</p>
              <Link href="/shop/checkout" className="mt-5 hidden lg:block">
                <Button className="w-full" variant="accent" size="lg">
                  Place order
                </Button>
              </Link>
              <Link href="/shop" className="mt-3 block text-center text-sm font-semibold text-primary">
                Continue shopping
              </Link>
            </aside>
          </div>
        )}
      </main>
    </ShopLayout>
  );
}
