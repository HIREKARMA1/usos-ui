'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Minus, Plus, ShieldCheck, Star, Truck } from 'lucide-react';
import { ProductReviews } from '@/components/shop/ProductReviews';
import { ShopBreadcrumb, ShopLayout } from '@/components/shop/ShopLayout';
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
  const [busy, setBusy] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    if (!id) return;
    api
      .getShopProduct(id)
      .then((p) => {
        setProduct(p);
        setActiveImage(0);
        setAvgRating(Number(p.avg_rating) || 0);
        setReviewCount(Number(p.review_count) || 0);
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  async function ensureAuth() {
    if (!user) {
      router.push(`/login?next=/shop/${id}`);
      return false;
    }
    return true;
  }

  async function upsertQty(extra: number) {
    const cart = await api.getCart().catch(() => ({ items: [] }));
    const existing = (cart.items || []).find((i: any) => i.product_id === id);
    await api.upsertCart(id, (existing?.quantity || 0) + extra);
  }

  async function addToCart() {
    if (!(await ensureAuth())) return;
    setBusy(true);
    try {
      await upsertQty(qty);
      toast.success('Added to cart');
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Failed');
    } finally {
      setBusy(false);
    }
  }

  async function buyNow() {
    if (!(await ensureAuth())) return;
    setBusy(true);
    try {
      await upsertQty(qty);
      router.push('/shop/checkout');
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Failed');
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f1f3f6]">
        <Spinner />
      </div>
    );
  }

  if (!product) {
    return (
      <ShopLayout>
        <main className="page-container py-16 text-center">
          <p className="font-semibold">Product not found</p>
          <Link href="/shop" className="mt-4 inline-block text-primary">
            Back to shop
          </Link>
        </main>
      </ShopLayout>
    );
  }

  const maxQty = Math.max(1, product.stock_count || 1);
  const gallery: string[] =
    Array.isArray(product.image_urls) && product.image_urls.length
      ? product.image_urls
      : product.image_url
        ? [product.image_url]
        : [];
  const mainImage = gallery[Math.min(activeImage, Math.max(gallery.length - 1, 0))] || null;

  return (
    <ShopLayout>
      <main className="page-container py-4 sm:py-6">
        <ShopBreadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Shop', href: '/shop' },
            { label: product.name },
          ]}
        />

        <div className="mt-3 grid gap-4 bg-white p-4 shadow-sm lg:grid-cols-[1.1fr_1fr] lg:p-6">
          <div className="lg:sticky lg:top-[7.5rem] lg:self-start">
            <div className="flex gap-3">
              {gallery.length > 1 ? (
                <div className="hidden w-16 shrink-0 flex-col gap-2 sm:flex">
                  {gallery.map((url, idx) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setActiveImage(idx)}
                      className={`overflow-hidden rounded border bg-white ${
                        idx === activeImage ? 'border-primary ring-1 ring-primary' : 'border-line'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="aspect-square w-full object-contain p-1" />
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="min-w-0 flex-1 overflow-hidden rounded border border-line bg-white">
                {mainImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mainImage} alt={product.name} className="aspect-square w-full object-contain p-6" />
                ) : (
                  <div className="flex aspect-square items-center justify-center text-ink-muted">No image</div>
                )}
              </div>
            </div>
            {gallery.length > 1 ? (
              <div className="mt-3 flex gap-2 overflow-x-auto sm:hidden">
                {gallery.map((url, idx) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setActiveImage(idx)}
                    className={`h-14 w-14 shrink-0 overflow-hidden rounded border ${
                      idx === activeImage ? 'border-primary' : 'border-line'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            ) : null}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button
                size="lg"
                variant="outline"
                className="h-12 border-primary font-bold text-primary"
                loading={busy}
                disabled={product.stock_count < 1}
                onClick={addToCart}
              >
                ADD TO CART
              </Button>
              <Button
                size="lg"
                variant="accent"
                className="h-12 font-bold"
                loading={busy}
                disabled={product.stock_count < 1}
                onClick={buyNow}
              >
                BUY NOW
              </Button>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{product.sku}</p>
            <h1 className="mt-1 text-xl font-bold text-ink sm:text-2xl">{product.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {reviewCount > 0 ? (
                <>
                  <span className="inline-flex items-center gap-1 rounded-sm bg-green px-2 py-0.5 text-sm font-bold text-white">
                    {avgRating.toFixed(1)} <Star className="h-3.5 w-3.5 fill-white" />
                  </span>
                  <span className="text-sm font-medium text-ink-muted">
                    {reviewCount} rating{reviewCount === 1 ? '' : 's'}
                  </span>
                </>
              ) : (
                <span className="text-sm font-medium text-ink-muted">No ratings yet</span>
              )}
              <span className="text-sm font-medium text-ink-muted">· Earn {product.points_per_unit} points / unit</span>
            </div>

            <div className="mt-5 border-y border-line py-4">
              <p className="text-3xl font-bold text-ink">{formatCurrency(product.price_inr)}</p>
              <p className="mt-1 text-sm font-semibold text-green">Inclusive of all taxes · Points credited after payment</p>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-ink-secondary">
              {product.description || 'Quality product from the U.S.O.S repurchase catalog.'}
            </p>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Truck className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-ink">Delivery to your address</p>
                  <p className="text-ink-muted">Enter address at checkout — PayU secure payment.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-ink">Secure checkout</p>
                  <p className="text-ink-muted">Pay via PayU · points auto-credited on success.</p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold text-ink">Quantity</p>
              <div className="mt-2 inline-flex items-center border border-line">
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center hover:bg-surface-muted"
                  onClick={() => setQty((n) => Math.max(1, n - 1))}
                  aria-label="Decrease"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center text-sm font-bold">{qty}</span>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center hover:bg-surface-muted"
                  onClick={() => setQty((n) => Math.min(maxQty, n + 1))}
                  aria-label="Increase"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-xs text-ink-muted">
                {product.stock_count > 0 ? `${product.stock_count} available` : 'Currently out of stock'}
              </p>
            </div>

            <div className="mt-6 rounded border border-line bg-[#f1f3f6] p-4 text-sm">
              <p className="font-semibold text-ink">You will earn</p>
              <p className="mt-1 text-lg font-bold text-primary">{product.points_per_unit * qty} points</p>
              <p className="mt-1 text-xs text-ink-muted">Redeem later — 50% to you, 50% to your referrer.</p>
            </div>
          </div>
        </div>

        <ProductReviews
          productId={String(id)}
          avgRating={avgRating}
          reviewCount={reviewCount}
          onSummaryChange={(avg, count) => {
            setAvgRating(avg);
            setReviewCount(count);
          }}
        />
      </main>
    </ShopLayout>
  );
}
