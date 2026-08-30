'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Minus, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PublicFooter, PublicHeader } from '@/components/layout/PublicShell';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { useAuth } from '@/hooks/useAuth';

const PURPLE = '#5B5CE2';

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
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-shop-bg)]">
        <Spinner />
      </div>
    );
  }

  const items = cart?.items || [];
  const itemCount = items.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0);
  const subtotalInr = (cart?.total_paise || 0) / 100;
  const points = cart?.total_points || 0;
  const shippingInr = 0;

  return (
    <div className="min-h-screen bg-[var(--color-shop-bg)]">
      <PublicHeader />
      <main className="mx-auto w-full max-w-lg px-4 py-8 sm:px-6 sm:py-10">
        <div className="overflow-hidden rounded-[28px] border border-[var(--color-shop-border)] bg-[var(--color-shop-card)] p-5 shadow-none sm:p-7">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold text-white"
              style={{ backgroundColor: PURPLE }}
              aria-hidden
            >
              c
            </div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-[var(--color-shop-text)]">
              Cart
            </h1>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-sm text-[var(--color-shop-muted-text)]">
              My Cart ({itemCount} {itemCount === 1 ? 'Item' : 'Items'})
            </p>
            <Link
              href="/shop"
              className="shrink-0 text-sm font-semibold text-[#3B82F6] hover:underline"
            >
              Continue Shopping
            </Link>
          </div>

          {error ? (
            <div className="mt-8 space-y-4 text-center">
              <p className="text-sm text-[var(--color-shop-muted-text)]">{error}</p>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={load}
                  className="rounded-xl border border-[var(--color-shop-border)] px-4 py-2 text-sm font-semibold text-[var(--color-shop-text)] hover:bg-[var(--color-shop-muted)]"
                >
                  Retry
                </button>
                <Link
                  href="/shop"
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
                  style={{ backgroundColor: PURPLE }}
                >
                  Browse products
                </Link>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="mt-10 space-y-4 text-center">
              <p className="text-sm text-[var(--color-shop-muted-text)]">Your cart is empty.</p>
              <Link
                href="/shop"
                className="inline-flex rounded-full px-6 py-3 text-sm font-semibold text-white"
                style={{ backgroundColor: PURPLE }}
              >
                Browse products
              </Link>
            </div>
          ) : (
            <>
              {/* Line items */}
              <ul className="mt-6 divide-y divide-[var(--color-shop-border)]">
                {items.map((item: any) => {
                  const priceInr = (item.product?.price_paise || 0) / 100;
                  return (
                    <li key={item.id} className="flex items-center gap-3 py-4 first:pt-2">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#E8F0E9] dark:bg-[#1a2e22]">
                        {item.product?.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.product.image_url}
                            alt=""
                            className="h-full w-full object-contain p-1.5"
                          />
                        ) : (
                          <span className="text-lg font-bold text-emerald-700/70">•</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-[var(--color-shop-text)] sm:text-[0.95rem]">
                          {item.product?.name || 'Product'}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="text-xs text-[var(--color-shop-muted-text)]">Qty:</span>
                          <div className="inline-flex items-center overflow-hidden rounded-lg border border-[var(--color-shop-border)]">
                            <button
                              type="button"
                              onClick={() => setQty(item.product_id, item.quantity - 1)}
                              className="inline-flex h-7 w-7 items-center justify-center text-[var(--color-shop-muted-text)] hover:bg-[var(--color-shop-muted)]"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="min-w-[1.5rem] text-center text-xs font-semibold text-[var(--color-shop-text)]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => setQty(item.product_id, item.quantity + 1)}
                              className="inline-flex h-7 w-7 items-center justify-center text-[var(--color-shop-muted-text)] hover:bg-[var(--color-shop-muted)]"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                        <p className="text-sm font-bold text-[var(--color-shop-text)] sm:text-base">
                          {formatCurrency(priceInr * (item.quantity || 1))}
                        </p>
                        <button
                          type="button"
                          onClick={() => setQty(item.product_id, 0)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-shop-muted-text)] transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40"
                          aria-label={`Remove ${item.product?.name || 'item'}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Summary */}
              <div className="mt-2 space-y-3 border-t border-[var(--color-shop-border)] pt-5 text-sm">
                <div className="flex items-center justify-between text-[var(--color-shop-muted-text)]">
                  <span>Subtotal</span>
                  <span className="font-medium text-[var(--color-shop-text)]">
                    {formatCurrency(subtotalInr)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[var(--color-shop-muted-text)]">
                  <span>Points You Earn</span>
                  <span className="font-semibold text-emerald-500">{points}</span>
                </div>
                <div className="flex items-center justify-between text-[var(--color-shop-muted-text)]">
                  <span>Shipping</span>
                  <span className="font-medium text-[var(--color-shop-text)]">
                    {formatCurrency(shippingInr)}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[var(--color-shop-border)] pt-4">
                <span className="text-base font-bold text-[var(--color-shop-text)] sm:text-lg">
                  Total Amount
                </span>
                <span className="text-base font-bold text-[var(--color-shop-text)] sm:text-lg">
                  {formatCurrency(subtotalInr + shippingInr)}
                </span>
              </div>

              <Link
                href="/shop/checkout"
                className="mt-6 flex w-full items-center justify-center rounded-full px-5 py-3.5 text-sm font-bold text-white shadow-none transition hover:opacity-95"
                style={{ backgroundColor: PURPLE }}
              >
                Proceed to Checkout
              </Link>
            </>
          )}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
