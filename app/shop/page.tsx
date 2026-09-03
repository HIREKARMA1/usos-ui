'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Search, ShoppingCart, User } from 'lucide-react';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { PublicFooter } from '@/components/layout/PublicShell';
import { ShopCategoryNav } from '@/components/shop/ShopCategoryNav';
import { ShopPromoBanner } from '@/components/shop/ShopPromoBanner';
import { Spinner } from '@/components/ui/Spinner';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

type Product = {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  category?: string | null;
  price_inr: number;
  image_url?: string;
  stock_count: number;
  points_per_unit: number;
  sort_order?: number;
};

type SortOption = 'Popular' | 'Price: Low to High' | 'Price: High to Low' | 'Points';

function productText(p: Product) {
  return `${p.name} ${p.description || ''} ${p.sku || ''}`.toLowerCase();
}

/** Collapse duplicate labels (Apparel ≈ Fashion). */
function normalizeCategory(category: string) {
  const cat = category.trim();
  if (/^apparel$/i.test(cat)) return 'Fashion';
  return cat;
}

function matchesCategory(p: Product, category: string) {
  if (category === 'All') return true;
  return normalizeCategory(p.category || '') === category;
}

function matchesSearch(p: Product, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return productText(p).includes(q);
}

function sortProducts(list: Product[], sort: SortOption) {
  const next = [...list];
  switch (sort) {
    case 'Price: Low to High':
      return next.sort((a, b) => a.price_inr - b.price_inr);
    case 'Price: High to Low':
      return next.sort((a, b) => b.price_inr - a.price_inr);
    case 'Points':
      return next.sort((a, b) => b.points_per_unit - a.points_per_unit);
    case 'Popular':
    default:
      return next.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }
}

function countCartUnits(cart: { items?: Array<{ quantity?: number }> } | null | undefined) {
  return (cart?.items || []).reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
}

export default function ShopPage() {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortLabel, setSortLabel] = useState<SortOption>('Popular');
  const [cartCount, setCartCount] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const cartSyncRef = useRef(0);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    api
      .getShopProducts()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      cartSyncRef.current += 1;
      setCartCount(0);
      return;
    }
    const syncId = ++cartSyncRef.current;
    api
      .getCart()
      .then((cart) => {
        if (syncId !== cartSyncRef.current) return;
        setCartCount(countCartUnits(cart));
      })
      .catch(() => {
        /* keep badge */
      });
  }, [user, authLoading]);

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () => setHeaderHeight(el.getBoundingClientRect().height);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /** Unique categories from product data, in first-seen order. */
  const productCategories = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const p of products) {
      const raw = (p.category || '').trim();
      if (!raw) continue;
      const cat = normalizeCategory(raw);
      if (seen.has(cat)) continue;
      seen.add(cat);
      list.push(cat);
    }
    return list;
  }, [products]);

  const navCategories = useMemo(() => ['All', ...productCategories], [productCategories]);

  useEffect(() => {
    if (activeCategory === 'All') return;
    if (!productCategories.includes(activeCategory)) {
      setActiveCategory('All');
    }
  }, [activeCategory, productCategories]);

  const visibleProducts = useMemo(() => {
    const filtered = products.filter(
      (p) => matchesSearch(p, searchQuery) && matchesCategory(p, activeCategory)
    );
    return sortProducts(filtered, sortLabel);
  }, [products, searchQuery, activeCategory, sortLabel]);

  async function refreshCartCount() {
    const syncId = ++cartSyncRef.current;
    try {
      const cart = await api.getCart();
      if (syncId !== cartSyncRef.current) return;
      setCartCount(countCartUnits(cart));
    } catch {
      /* leave as-is */
    }
  }

  async function addToCart(productId: string) {
    if (!user) {
      toast.error('Please log in to add items to cart');
      window.location.href = `/login?next=/shop`;
      return;
    }
    try {
      const cart = await api.getCart().catch(() => ({ items: [] as any[] }));
      const existing = (cart.items || []).find((i: any) => i.product_id === productId);
      const qty = (existing?.quantity || 0) + 1;

      cartSyncRef.current += 1;
      const syncId = cartSyncRef.current;
      setCartCount((c) => c + 1);

      const next = (await api.upsertCart(productId, qty)) as {
        items?: Array<{ quantity?: number }>;
      };

      if (syncId !== cartSyncRef.current) return;

      const fromResponse = countCartUnits(next);
      if (fromResponse > 0) {
        setCartCount(fromResponse);
      } else {
        await refreshCartCount();
      }
      toast.success('Added to cart');
    } catch (e: any) {
      await refreshCartCount();
      toast.error(e?.response?.data?.detail || 'Could not add to cart');
    }
  }

  function selectCategory(cat: string) {
    setActiveCategory(cat);
  }

  const profileHref = user
    ? user.role === 'admin'
      ? '/admin'
      : '/user/profile'
    : '/login?next=/shop';

  const badgeLabel = cartCount > 99 ? '99+' : String(cartCount);

  function HeaderActions({ className }: { className?: string }) {
    return (
      <div className={className}>
        <ThemeToggle className="rounded-xl border-0 bg-[var(--color-shop-icon-bg)] hover:opacity-90" />
        <Link
          href="/shop/cart"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-shop-icon-bg)] text-[var(--color-shop-text)] transition hover:opacity-90"
          aria-label={`Cart, ${cartCount} items`}
        >
          <ShoppingCart className="h-5 w-5" strokeWidth={1.75} />
          <span className="absolute -right-1 -top-1 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EF4444] px-1 text-[10px] font-bold leading-none text-white shadow-none ring-2 ring-[var(--color-shop-card)]">
            {badgeLabel}
          </span>
        </Link>
        <Link
          href={profileHref}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-shop-icon-bg)] text-[var(--color-shop-text)] transition hover:opacity-90"
          aria-label="Profile"
        >
          <User className="h-5 w-5" strokeWidth={1.75} />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-shop-bg)] text-[var(--color-shop-text)]">
      {/* Header */}
      <header
        ref={headerRef}
        className="sticky top-0 z-40 border-b border-[var(--color-shop-border)] bg-[var(--color-shop-card)]"
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:gap-8 lg:px-8 lg:py-3.5">
          <div className="flex shrink-0 items-center justify-between gap-3">
            <BrandLogo
              showFull={false}
              className="[&_span]:!text-[1.35rem] [&_span]:!font-extrabold [&_span]:!tracking-tight"
            />
            <HeaderActions className="flex items-center gap-2.5 lg:hidden" />
          </div>

          <div className="relative mx-auto w-full max-w-2xl flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-shop-muted-text)]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="h-11 w-full rounded-full border border-[var(--color-shop-border)] bg-[var(--color-shop-card)] py-2 pl-11 pr-4 text-sm text-[var(--color-shop-text)] placeholder:text-[var(--color-shop-muted-text)] outline-none transition focus:border-[#5B5CE2]/50 focus:ring-2 focus:ring-[#5B5CE2]/15"
            />
          </div>

          <HeaderActions className="hidden shrink-0 items-center gap-2.5 lg:flex" />
        </div>
      </header>

      <main className="w-full">
        {/* Category strip — centered under header, like Flipkart */}
        <ShopCategoryNav
          categories={navCategories}
          activeCategory={activeCategory}
          onSelect={selectCategory}
          stickyTop={headerHeight}
        />

        <div className="mx-auto w-full max-w-7xl px-4 pt-5 sm:px-6 sm:pt-6 lg:px-8">
          <ShopPromoBanner />
        </div>

        <div className="mx-auto w-full max-w-7xl px-4 pb-6 sm:px-6 sm:pb-8 lg:px-8">
          <div className="mt-5 flex justify-end sm:mt-6">
            <div className="relative shrink-0">
              <label className="sr-only" htmlFor="shop-sort">
                Sort
              </label>
              <select
                id="shop-sort"
                value={sortLabel}
                onChange={(e) => setSortLabel(e.target.value as SortOption)}
                className="h-10 appearance-none rounded-full border border-[var(--color-shop-border)] bg-[var(--color-shop-card)] py-2 pl-4 pr-9 text-sm font-medium text-[var(--color-shop-text)] outline-none transition focus:border-[#5B5CE2]/50 focus:ring-2 focus:ring-[#5B5CE2]/15"
              >
                <option value="Popular">Sort: Popular</option>
                <option value="Price: Low to High">Sort: Price: Low to High</option>
                <option value="Price: High to Low">Sort: Price: High to Low</option>
                <option value="Points">Sort: Points</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

        {/* Product grid */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-[var(--color-shop-border)] bg-[var(--color-shop-card)] px-6 py-8 text-center">
            <p className="text-base font-semibold text-[var(--color-shop-text)]">No products found</p>
            <p className="mt-1 text-sm text-[var(--color-shop-muted-text)]">Try a different search term or category.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('All');
                setSortLabel('Popular');
              }}
              className="mt-4 inline-flex rounded-xl border-2 border-[#5B5CE2] px-4 py-2 text-sm font-semibold text-[#5B5CE2] transition hover:bg-[#5B5CE2] hover:text-white"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="mt-7 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
            {visibleProducts.map((p) => (
              <article
                key={p.id}
                className="group flex flex-col rounded-2xl border border-[var(--color-shop-border)] bg-[var(--color-shop-card)] p-3 transition duration-200 hover:-translate-y-0.5 hover:shadow-none sm:p-4"
              >
                <Link
                  href={`/shop/${p.id}`}
                  className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-[var(--color-shop-muted)]"
                >
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="h-full w-full object-contain p-3 transition duration-200 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-400">
                      No image
                    </div>
                  )}
                </Link>

                <div className="mt-3 flex flex-1 flex-col sm:mt-3.5">
                  <Link
                    href={`/shop/${p.id}`}
                    className="line-clamp-2 text-sm font-semibold text-[var(--color-shop-text)] hover:opacity-80 sm:text-[0.95rem]"
                  >
                    {p.name}
                  </Link>
                  <p className="mt-1.5 text-base font-bold text-[var(--color-shop-text)] sm:text-lg">
                    {formatCurrency(p.price_inr)}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--color-shop-muted-text)] sm:text-sm">
                    Earn {p.points_per_unit} Points
                  </p>

                  <div className="mt-auto pt-3 sm:pt-4">
                    <button
                      type="button"
                      onClick={() => addToCart(p.id)}
                      disabled={p.stock_count < 1}
                      className="w-full rounded-xl border-2 border-[#5B5CE2] bg-[var(--color-shop-card)] px-3 py-2 text-xs font-semibold text-[#5B5CE2] transition hover:bg-[#5B5CE2] hover:text-white disabled:pointer-events-none disabled:opacity-50 sm:px-4 sm:py-2.5 sm:text-sm"
                    >
                      {p.stock_count < 1 ? 'Out of stock' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
