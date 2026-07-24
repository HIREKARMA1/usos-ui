'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Gift, ShoppingCart, Sparkles, Users, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { PublicFooter, PublicHeader } from '@/components/layout/PublicShell';
import { withHighlightMark } from '@/components/ui/HighlightMark';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { useAuth } from '@/hooks/useAuth';
import { useAuthGate } from '@/hooks/useAuthGate';
import { useContent } from '@/hooks/useContent';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/lib/cn';

type Product = {
  id: string;
  name: string;
  description?: string;
  price_inr: number;
  image_url?: string;
  stock_count: number;
  points_per_unit: number;
};

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

  useEffect(() => {
    api
      .getShopProducts()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  async function addToCart(productId: string) {
    if (!user) {
      toast.error(shop.loginToCart);
      openAuth({ mode: 'login', next: '/shop' });
      return;
    }
    setAddingId(productId);
    try {
      const cart = await api.getCart().catch(() => ({ items: [] }));
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
    </div>
  );
}
