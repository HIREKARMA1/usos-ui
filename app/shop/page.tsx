'use client';

import { type ReactNode, Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, Package, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { ShopBreadcrumb, ShopLayout } from '@/components/shop/ShopLayout';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { useAuth } from '@/hooks/useAuth';
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
      toast.error('Please log in to add items to cart');
      router.push(`/login?next=/shop`);
      return;
    }
    try {
      const cart = await api.getCart().catch(() => ({ items: [] }));
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
