'use client';

<<<<<<< HEAD
import { type ReactNode, Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, Package, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { ShopBreadcrumb, ShopLayout } from '@/components/shop/ShopLayout';
import { Button } from '@/components/ui/Button';
=======
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Gift, ShoppingCart, Sparkles, Users, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { PublicFooter, PublicHeader } from '@/components/layout/PublicShell';
import { withHighlightMark } from '@/components/ui/HighlightMark';
>>>>>>> 52d4af87a69552211b6b2788ab3be3d58288c4fa
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { useAuth } from '@/hooks/useAuth';
<<<<<<< HEAD
=======
import { useAuthGate } from '@/hooks/useAuthGate';
import { useContent } from '@/hooks/useContent';
import { useLocale } from '@/hooks/useLocale';
>>>>>>> 52d4af87a69552211b6b2788ab3be3d58288c4fa
import { cn } from '@/lib/cn';

type Product = {
  id: string;
  name: string;
  description?: string;
  price_inr: number;
  image_url?: string;
  stock_count: number;
  points_per_unit: number;
  sku?: string;
  avg_rating?: number;
  review_count?: number;
};

<<<<<<< HEAD
const PRICE_FILTERS = [
  { id: '0-299', label: 'Under ₹300', min: 0, max: 299 },
  { id: '300-599', label: '₹300 – ₹599', min: 300, max: 599 },
  { id: '600-999', label: '₹600 – ₹999', min: 600, max: 999 },
  { id: '1000+', label: '₹1000 & above', min: 1000, max: Infinity },
];

const POINTS_FILTERS = [
  { id: '1-20', label: '1 – 20 pts', min: 1, max: 20 },
  { id: '21-50', label: '21 – 50 pts', min: 21, max: 50 },
  { id: '51+', label: '51+ pts', min: 51, max: Infinity },
];

function ShopListingInner() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = (searchParams.get('q') || '').trim().toLowerCase();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceIds, setPriceIds] = useState<string[]>([]);
  const [pointsIds, setPointsIds] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
=======
const easeOut = [0.22, 1, 0.36, 1] as const;

export default function ShopPage() {
  const shop = useContent('landing').shop;
  const { user } = useAuth();
  const { openAuth } = useAuthGate();
  const { locale } = useLocale();
  const reduceMotion = useReducedMotion();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);

  const fadeUp = {
    hidden: { opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0 : 0.45, ease: easeOut },
    },
  };

  const stagger = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.06,
        delayChildren: reduceMotion ? 0 : 0.04,
      },
    },
  };
>>>>>>> 52d4af87a69552211b6b2788ab3be3d58288c4fa

  useEffect(() => {
    api
      .getShopProducts()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let rows = [...products];
    if (q) {
      rows = rows.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.sku || '').toLowerCase().includes(q)
      );
    }
    if (inStockOnly) rows = rows.filter((p) => p.stock_count > 0);
    if (priceIds.length) {
      rows = rows.filter((p) =>
        priceIds.some((id) => {
          const f = PRICE_FILTERS.find((x) => x.id === id)!;
          return p.price_inr >= f.min && p.price_inr <= f.max;
        })
      );
    }
    if (pointsIds.length) {
      rows = rows.filter((p) =>
        pointsIds.some((id) => {
          const f = POINTS_FILTERS.find((x) => x.id === id)!;
          return p.points_per_unit >= f.min && p.points_per_unit <= f.max;
        })
      );
    }
    return rows;
  }, [products, q, priceIds, pointsIds, inStockOnly]);

  function toggle(list: string[], id: string, setter: (v: string[]) => void) {
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  async function addToCart(productId: string) {
    if (!user) {
<<<<<<< HEAD
      toast.error('Please log in to add items to cart');
      router.push(`/login?next=/shop`);
=======
      toast.error(shop.loginToCart);
      openAuth({ mode: 'login', next: '/shop' });
>>>>>>> 52d4af87a69552211b6b2788ab3be3d58288c4fa
      return;
    }
    setAddingId(productId);
    try {
      const cart = await api.getCart().catch(() => ({ items: [] }));
<<<<<<< HEAD
      const existing = (cart.items || []).find((i: any) => i.product_id === productId);
      await api.upsertCart(productId, (existing?.quantity || 0) + 1);
      toast.success('Added to cart');
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Could not add to cart');
    }
  }

  const Filters = (
    <aside className="space-y-0 border border-line bg-white">
      <div className="border-b border-line px-4 py-3">
        <h2 className="text-lg font-bold text-ink">Filters</h2>
      </div>
      <div className="border-b border-line px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Categories</p>
        <p className="mt-2 text-sm text-ink">
          Shop <span className="text-ink-muted">›</span> <span className="font-medium">All products</span>
        </p>
      </div>
      <FilterBlock title="Availability">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="accent-primary"
          />
          In stock only
        </label>
      </FilterBlock>
      <FilterBlock title="Price">
        {PRICE_FILTERS.map((f) => (
          <label key={f.id} className="flex cursor-pointer items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={priceIds.includes(f.id)}
              onChange={() => toggle(priceIds, f.id, setPriceIds)}
              className="accent-primary"
            />
            {f.label}
          </label>
        ))}
      </FilterBlock>
      <FilterBlock title="Reward points">
        {POINTS_FILTERS.map((f) => (
          <label key={f.id} className="flex cursor-pointer items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={pointsIds.includes(f.id)}
              onChange={() => toggle(pointsIds, f.id, setPointsIds)}
              className="accent-primary"
            />
            {f.label}
          </label>
        ))}
      </FilterBlock>
      {(priceIds.length || pointsIds.length || inStockOnly) && (
        <div className="px-4 py-3">
          <button
            type="button"
            className="text-sm font-semibold text-primary"
            onClick={() => {
              setPriceIds([]);
              setPointsIds([]);
              setInStockOnly(false);
            }}
          >
            Clear all
          </button>
        </div>
      )}
    </aside>
  );

  return (
    <ShopLayout>
      <main className="page-container py-4 sm:py-6">
        <ShopBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Shop' }]} />

        <div className="mt-3 grid gap-3 lg:grid-cols-[240px_1fr]">
          <div className="hidden lg:block">{Filters}</div>

          <section className="min-w-0">
            <div className="border border-line bg-white px-4 py-3">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h1 className="text-xl font-bold text-ink sm:text-2xl">
                    {q ? `Results for “${searchParams.get('q')}”` : 'All products'}
                  </h1>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    Showing {filtered.length} of {products.length} products
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary lg:hidden"
                  onClick={() => setFiltersOpen((v) => !v)}
                >
                  Filters <ChevronDown className={cn('h-4 w-4 transition', filtersOpen && 'rotate-180')} />
                </button>
              </div>
              {filtersOpen ? <div className="mt-3 lg:hidden">{Filters}</div> : null}
            </div>

            {loading ? (
              <div className="flex justify-center bg-white py-24">
                <Spinner />
              </div>
            ) : filtered.length === 0 ? (
              <div className="mt-0 border border-t-0 border-line bg-white px-6 py-16 text-center">
                <Package className="mx-auto h-10 w-10 text-ink-muted" />
                <p className="mt-3 font-semibold text-ink">No products found</p>
                <p className="mt-1 text-sm text-ink-muted">Try clearing filters or searching another term.</p>
              </div>
            ) : (
              <div className="mt-0 grid grid-cols-2 border border-t-0 border-line bg-white sm:grid-cols-3 xl:grid-cols-4">
                {filtered.map((p) => (
                  <article
                    key={p.id}
                    className="group relative flex flex-col border-b border-r border-line p-3 transition hover:shadow-elevated"
                  >
                    <Link href={`/shop/${p.id}`} className="relative mx-auto aspect-square w-full max-w-[220px] bg-white">
                      {p.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image_url} alt={p.name} className="h-full w-full object-contain p-2" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-ink-muted">No image</div>
                      )}
                      {p.stock_count < 1 ? (
                        <span className="absolute left-2 top-2 rounded bg-ink/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          Out of stock
                        </span>
                      ) : null}
                    </Link>
                    <div className="mt-3 flex flex-1 flex-col">
                      <Link
                        href={`/shop/${p.id}`}
                        className="line-clamp-2 min-h-[2.5rem] text-sm font-medium text-ink hover:text-primary"
                      >
                        {p.name}
                      </Link>
                      {p.description ? (
                        <p className="mt-1 line-clamp-1 text-xs text-ink-muted">{p.description}</p>
                      ) : null}
                      <div className="mt-2 flex items-center gap-2">
                        {(p.review_count || 0) > 0 ? (
                          <span className="inline-flex items-center gap-0.5 rounded-sm bg-green px-1.5 py-0.5 text-[11px] font-bold text-white">
                            {(p.avg_rating || 0).toFixed(1)}
                            <Star className="h-3 w-3 fill-white" />
                          </span>
                        ) : (
                          <span className="text-[11px] text-ink-muted">New</span>
                        )}
                        <span className="text-xs text-ink-muted">Earn {p.points_per_unit} pts</span>
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <p className="text-base font-bold text-ink">{formatCurrency(p.price_inr)}</p>
                      </div>
                      <p className="mt-1 text-[11px] font-semibold text-green">Points deal</p>
                      <Button
                        size="sm"
                        className="mt-3 w-full"
                        disabled={p.stock_count < 1}
                        onClick={() => addToCart(p.id)}
                      >
                        {p.stock_count < 1 ? 'Out of stock' : 'Add to cart'}
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </ShopLayout>
  );
}

function FilterBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-b border-line px-4 py-3">
      <p className="mb-2 text-sm font-semibold text-ink">{title}</p>
      <div className="space-y-2">{children}</div>
=======
      const existing = (cart.items || []).find((i: { product_id: string }) => i.product_id === productId);
      const qty = (existing?.quantity || 0) + 1;
      await api.upsertCart(productId, qty);
      toast.success(shop.added);
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(detail || shop.addFailed);
    } finally {
      setAddingId(null);
    }
  }

  const perks = [
    { icon: Sparkles, label: shop.perkPoints },
    { icon: Wallet, label: shop.perkShare },
    { icon: Users, label: shop.perkMembers },
  ];

  return (
    <div className="min-h-screen bg-[#0f1622] text-white">
      <PublicHeader />

      <section className="relative isolate overflow-hidden pt-20 sm:pt-24">
        <div
          className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full blur-[110px]"
          style={{ background: 'rgba(0,162,229,0.18)' }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-16 top-24 h-72 w-72 rounded-full blur-[120px]"
          style={{ background: 'rgba(245,128,32,0.14)' }}
          aria-hidden
        />

        <div className="page-container relative pb-8 sm:pb-10">
          <motion.div
            key={`shop-hero-${locale}`}
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid items-center gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-10"
          >
            <div className="space-y-4">
              <motion.p variants={fadeUp} className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky">
                {shop.eyebrow}
              </motion.p>
              <motion.h1
                variants={fadeUp}
                className="text-[1.75rem] font-bold leading-[1.15] tracking-tight text-white sm:text-[2.25rem]"
              >
                {withHighlightMark(shop.title, shop.titleHighlight)}
              </motion.h1>
              <motion.p variants={fadeUp} className="max-w-xl text-sm leading-relaxed text-white/65 sm:text-[15px]">
                {shop.subtitle}
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-wrap gap-2 pt-1">
                {perks.map(({ icon: Icon, label }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white/70"
                  >
                    <Icon className="h-3.5 w-3.5 text-sky" />
                    {label}
                  </span>
                ))}
              </motion.div>

              <motion.div variants={fadeUp} className="flex flex-wrap gap-2 pt-2">
                <Link
                  href="/shop/cart"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-white/10"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {shop.cart}
                </Link>
                {user ? (
                  <Link
                    href="/user/points"
                    className="inline-flex items-center gap-2 rounded-full bg-sky px-4 py-2.5 text-[13px] font-semibold text-[#0f1622] transition hover:brightness-110"
                  >
                    <Gift className="h-4 w-4" />
                    {shop.myPoints}
                  </Link>
                ) : null}
              </motion.div>
            </div>

            <motion.div
              variants={fadeUp}
              className="relative hidden min-h-[200px] overflow-hidden rounded-2xl border border-white/10 sm:block lg:min-h-[240px]"
            >
              <Image
                src="/images/landing/kit-products.png"
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f1622] via-[#0f1622]/30 to-transparent" aria-hidden />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky">{shop.eyebrow}</p>
                <p className="mt-1 text-sm text-white/75">{shop.perkPoints}</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <main className="page-container relative pb-14">
        {loading ? (
          <div className="flex justify-center py-24">
            <Spinner className="h-8 w-8 border-sky/25 border-t-sky" />
          </div>
        ) : products.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky/15 text-sky">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-white">{shop.emptyTitle}</h2>
            <p className="mt-2 text-sm text-white/55">{shop.emptyBody}</p>
          </motion.div>
        ) : (
          <motion.div
            key={`shop-grid-${locale}`}
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {products.map((p) => {
              const out = p.stock_count < 1;
              return (
                <motion.article
                  key={p.id}
                  variants={fadeUp}
                  whileHover={
                    reduceMotion
                      ? undefined
                      : { y: -4, borderColor: 'rgba(255,255,255,0.22)', transition: { duration: 0.2 } }
                  }
                  className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.09] to-white/[0.02]"
                >
                  <Link href={`/shop/${p.id}`} className="relative aspect-[4/3] overflow-hidden bg-[#152033]">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#1b52a4]/40 to-[#00a2e5]/20">
                        <Gift className="h-10 w-10 text-white/35" />
                      </div>
                    )}
                    <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-[#0f1622]/75 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-300 backdrop-blur-sm">
                      {(shop.earnPts as string).replace('{n}', String(p.points_per_unit))}
                    </span>
                    {out ? (
                      <span className="absolute inset-0 flex items-center justify-center bg-[#0f1622]/55 text-[12px] font-semibold uppercase tracking-wide text-white/80 backdrop-blur-[2px]">
                        {shop.outOfStock}
                      </span>
                    ) : null}
                  </Link>

                  <div className="flex flex-1 flex-col p-4">
                    <Link
                      href={`/shop/${p.id}`}
                      className="line-clamp-1 text-[15px] font-semibold tracking-tight text-white transition hover:text-sky"
                    >
                      {p.name}
                    </Link>
                    {p.description ? (
                      <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-white/50">{p.description}</p>
                    ) : null}

                    <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                      <p className="text-lg font-bold tracking-tight text-white">{formatCurrency(p.price_inr)}</p>
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/shop/${p.id}`}
                          className="rounded-full border border-white/12 px-3 py-1.5 text-[12px] font-semibold text-white/70 transition hover:border-white/25 hover:text-white"
                        >
                          {shop.viewProduct}
                        </Link>
                        <button
                          type="button"
                          disabled={out || addingId === p.id}
                          onClick={() => addToCart(p.id)}
                          className={cn(
                            'rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition',
                            out
                              ? 'cursor-not-allowed bg-white/5 text-white/35'
                              : 'bg-sky text-[#0f1622] hover:brightness-110 disabled:opacity-60'
                          )}
                        >
                          {out ? shop.outOfStock : shop.add}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        )}
      </main>

      <PublicFooter />
>>>>>>> 52d4af87a69552211b6b2788ab3be3d58288c4fa
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <ShopListingInner />
    </Suspense>
  );
}
