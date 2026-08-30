'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Check, Minus, Plus, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { PublicFooter } from '@/components/layout/PublicShell';
import { Spinner } from '@/components/ui/Spinner';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { useAuth } from '@/hooks/useAuth';

const PURPLE = '#5B5CE2';

type TabKey = 'description' | 'ingredients' | 'reviews';

const DEFAULT_FEATURES = ['100% Natural', 'Paraben Free', 'Cruelty Free'];
const DEFAULT_BENEFITS = ['Premium quality', 'Earn loyalty points on every purchase', 'Suitable for daily use'];

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeThumb, setActiveThumb] = useState(0);
  const [tab, setTab] = useState<TabKey>('description');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .getShopProduct(id)
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  const thumbs = useMemo((): string[] => {
    if (Array.isArray(product?.image_urls) && product.image_urls.length) {
      return product.image_urls;
    }
    if (!product?.image_url) return [];
    return [product.image_url];
  }, [product?.image_url, product?.image_urls]);

  const shortDescription = useMemo(() => {
    const d = (product?.description || '').trim();
    if (!d) return 'Quality product from the U.S.O.S store. Shop today and earn loyalty points.';
    if (d.length <= 140) return d;
    return `${d.slice(0, 137).trim()}...`;
  }, [product?.description]);

  async function upsertQty() {
    if (!user) {
      router.push(`/login?next=/shop/${id}`);
      return false;
    }
    const cart = await api.getCart().catch(() => ({ items: [] }));
    const existing = (cart.items || []).find((i: any) => i.product_id === id);
    await api.upsertCart(id, (existing?.quantity || 0) + qty);
    return true;
  }

  async function addToCart() {
    if (product?.stock_count < 1) return;
    setAdding(true);
    try {
      const ok = await upsertQty();
      if (!ok) return;
      toast.success('Added to cart');
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Failed');
    } finally {
      setAdding(false);
    }
  }

  async function buyNow() {
    if (product?.stock_count < 1) return;
    setAdding(true);
    try {
      const ok = await upsertQty();
      if (!ok) return;
      toast.success('Added to cart');
      router.push('/shop/checkout');
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Failed');
    } finally {
      setAdding(false);
    }
  }

  function changeQty(delta: number) {
    const max = Math.max(1, product?.stock_count || 1);
    setQty((q) => Math.min(max, Math.max(1, q + delta)));
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-page">
        <Spinner />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-surface-page">
        <div className="mx-auto max-w-7xl px-4 py-10 text-center sm:px-6 lg:px-8">
          <p className="text-ink">Product not found</p>
          <Link href="/shop" className="mt-4 inline-block font-semibold text-[#5B5CE2]">
            Back to shop
          </Link>
        </div>
      </div>
    );
  }

  const mainImage = thumbs[activeThumb] || product.image_url;

  return (
    <div className="min-h-screen bg-surface-page text-ink">
      {/* Header */}
      <header className="border-b border-line bg-surface-card">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
          <BrandLogo showFull={false} className="[&_span]:!text-base [&_span]:!font-extrabold" />
          <h1 className="flex-1 font-display text-lg font-bold text-[#3D2E8A] dark:text-[#A5B4FC] sm:text-xl">
            Product Details
          </h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="mb-5 text-sm text-[#8B93B0] sm:mb-7" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-[#5B5CE2]">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/shop" className="hover:text-[#5B5CE2]">
                Shop
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="truncate font-medium text-[#5B5CE2]">{product.name}</li>
          </ol>
        </nav>

        {/* Hero: image + details */}
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-6">
          {/* Gallery */}
          <div>
            <div className="overflow-hidden rounded-2xl bg-surface-muted">
              {mainImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mainImage}
                  alt={product.name}
                  className="aspect-square w-full object-contain p-6 sm:p-10"
                />
              ) : (
                <div className="flex aspect-square items-center justify-center text-ink-muted">No image</div>
              )}
            </div>
            {thumbs.length > 0 ? (
              <div className="mt-3 flex gap-2.5 sm:mt-4 sm:gap-3">
                {thumbs.map((src, i) => (
                  <button
                    key={`${src}-${i}`}
                    type="button"
                    onClick={() => setActiveThumb(i)}
                    className={`h-16 w-16 overflow-hidden rounded-xl border-2 bg-surface-muted sm:h-20 sm:w-20 ${
                      activeThumb === i ? 'border-[#5B5CE2]' : 'border-line'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-full w-full object-contain p-1.5" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* Info */}
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#3D2E8A] dark:text-[#A5B4FC] sm:text-3xl md:text-4xl">
              {product.name}
            </h2>

            <p className="mt-3 text-2xl font-bold text-ink sm:text-3xl">
              {formatCurrency(product.price_inr)}
            </p>
            <p className="mt-1 text-sm text-ink-muted sm:text-base">
              Earn {product.points_per_unit} Points
            </p>

            {/* Static rating display for catalog UI (no reviews API yet) */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-0.5" aria-hidden>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`h-4 w-4 ${n <= 4 ? 'fill-amber-400 text-amber-400' : 'fill-amber-400/40 text-amber-400/40'}`}
                  />
                ))}
              </div>
              <span className="text-sm text-ink-secondary">4.6 (70 reviews)</span>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-ink-secondary sm:text-[0.95rem]">{shortDescription}</p>

            <ul className="mt-5 space-y-2.5">
              {DEFAULT_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-ink sm:text-[0.95rem]">
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            {/* Quantity */}
            <div className="mt-7">
              <p className="mb-2 text-sm font-semibold text-ink">Quantity</p>
              <div className="inline-flex items-center overflow-hidden rounded-xl border border-line bg-surface-card">
                <button
                  type="button"
                  onClick={() => changeQty(-1)}
                  disabled={qty <= 1}
                  className="inline-flex h-11 w-11 items-center justify-center text-ink transition hover:bg-surface-muted disabled:opacity-40"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="flex h-11 min-w-[3rem] items-center justify-center border-x border-line text-sm font-semibold text-ink">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => changeQty(1)}
                  disabled={qty >= (product.stock_count || 1)}
                  className="inline-flex h-11 w-11 items-center justify-center text-ink transition hover:bg-surface-muted disabled:opacity-40"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {product.stock_count < 1 ? (
                <p className="mt-2 text-sm text-red-500">Out of stock</p>
              ) : (
                <p className="mt-2 text-xs text-gray-400">{product.stock_count} in stock</p>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={addToCart}
                disabled={product.stock_count < 1 || adding}
                className="w-full rounded-xl px-5 py-3.5 text-sm font-semibold text-white shadow-none transition hover:opacity-95 disabled:opacity-50"
                style={{ background: `linear-gradient(180deg, #6B6CF0 0%, ${PURPLE} 100%)` }}
              >
                {adding ? 'Please wait…' : 'Add to Cart'}
              </button>
              <button
                type="button"
                onClick={buyNow}
                disabled={product.stock_count < 1 || adding}
                className="w-full rounded-xl border-2 border-[#5B5CE2] bg-surface-card px-5 py-3.5 text-sm font-semibold text-[#5B5CE2] transition hover:bg-[#5B5CE2]/10 disabled:opacity-50"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-10 border-t border-line pt-6 sm:mt-14 sm:pt-8">
          <div className="flex gap-6 overflow-x-auto border-b border-line sm:gap-8" role="tablist">
            {(
              [
                { key: 'description' as const, label: 'Description' },
                { key: 'ingredients' as const, label: 'Ingredients' },
                { key: 'reviews' as const, label: 'Reviews (70)' },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={`shrink-0 border-b-2 pb-3 text-sm font-semibold transition sm:text-base ${
                  tab === t.key
                    ? 'border-[#5B5CE2] text-[#5B5CE2]'
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="py-5 sm:py-6" role="tabpanel">
            {tab === 'description' ? (
              <div>
                <p className="text-sm leading-relaxed text-ink-secondary sm:text-[0.95rem]">
                  {product.description ||
                    'Enriched with quality ingredients. Helps you get the most from every purchase with loyalty points.'}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {DEFAULT_BENEFITS.map((b) => (
                    <li key={b} className="flex items-center gap-2.5 text-sm text-ink">
                      <Check className="h-4 w-4 shrink-0 text-emerald-500" strokeWidth={2.5} />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {tab === 'ingredients' ? (
              <p className="text-sm leading-relaxed text-ink-secondary sm:text-[0.95rem]">
                {product.description
                  ? `Based on product details: ${product.description}`
                  : 'Ingredient details will be listed here for this product. Formulated for everyday use with care.'}
              </p>
            ) : null}

            {tab === 'reviews' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5" aria-hidden>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-ink">4.6 out of 5</span>
                  <span className="text-sm text-ink-muted">· 70 reviews</span>
                </div>
                <p className="text-sm text-ink-secondary">
                  Customer reviews will appear here once available. Shoppers love earning points on every
                  repurchase.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
