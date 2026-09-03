'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Network, Wallet, ShieldCheck, Gift, Languages, BadgeCheck } from 'lucide-react';
import { PublicFooter, PublicHeader } from '@/components/layout/PublicShell';
import { Button } from '@/components/ui/Button';
import { useContent } from '@/hooks/useContent';
import { useAuth } from '@/hooks/useAuth';
import { postAuthPath } from '@/lib/access';
import { api } from '@/lib/api';
import type { PackagePlan } from '@/types';

const featureIcons = [Network, Wallet, Gift, ShieldCheck, BadgeCheck, Languages];

export default function LandingPage() {
  const landing = useContent('landing');
  const packages = useContent('packages');
  const common = useContent('common');
  const { user, isAuthenticated } = useAuth();
  const dash = user ? postAuthPath(user) : '/user';
  const [livePackages, setLivePackages] = useState<PackagePlan[] | null>(null);

  useEffect(() => {
    api
      .getPackages()
      .then(setLivePackages)
      .catch(() => setLivePackages(null));
  }, []);

  const packageCards = livePackages && livePackages.length ? livePackages : packages.items;

  return (
    <div className="min-h-screen bg-surface-page">
      <PublicHeader />

      <section className="hero-gradient relative overflow-hidden">
        <div className="page-container grid items-center gap-6 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-10">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-200">
              {landing.hero.eyebrow}
            </p>
            <h1 className="mt-3 font-display text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
              {landing.hero.brand}
            </h1>
            <p className="mt-2 text-lg font-semibold text-white/90 sm:text-xl">{landing.hero.brandFull}</p>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              {landing.hero.subheadline}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {isAuthenticated && user ? (
                <Link href={dash}>
                  <Button size="lg">
                    {common.nav.dashboard}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/register">
                    <Button size="lg">
                      {landing.hero.ctaPrimary}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="lg" variant="outline">
                      {landing.hero.ctaSecondary}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="relative hidden min-h-[320px] rounded-2xl bg-gradient-to-br from-primary via-secondary-500 to-accent-orange p-8 text-white shadow-none lg:block"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">{common.brand.tagline}</p>
            <p className="mt-6 font-display text-4xl font-extrabold leading-tight">{landing.hero.headline}</p>
            <div className="mt-10 grid grid-cols-2 gap-4">
              {landing.stats.slice(0, 4).map((s: { value: string; label: string }) => (
                <div key={s.label} className="rounded-xl bg-white/10 p-4 backdrop-blur">
                  <p className="font-display text-2xl font-bold">{s.value}</p>
                  <p className="mt-1 text-xs text-white/80">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section id="features" className="page-container py-8 sm:py-10">
        <p className="section-eyebrow">{landing.features.eyebrow}</p>
        <h2 className="section-title mt-2">{landing.features.title}</h2>
        <p className="mt-3 max-w-2xl text-ink-muted">{landing.features.subtitle}</p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {landing.features.items.map((item: { title: string; description: string }, idx: number) => {
            const Icon = featureIcons[idx % featureIcons.length];
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-xl border border-line bg-surface-card p-5 shadow-none"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm text-ink-muted">{item.description}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section id="how" className="bg-surface-soft py-8 sm:py-10">
        <div className="page-container">
          <p className="section-eyebrow">{landing.howItWorks.eyebrow}</p>
          <h2 className="section-title mt-2">{landing.howItWorks.title}</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {landing.howItWorks.steps.map((step: { step: string; title: string; description: string }) => (
              <div key={step.step} className="rounded-xl bg-surface-card p-6 shadow-none">
                <p className="font-display text-3xl font-extrabold text-primary/20">{step.step}</p>
                <h3 className="mt-2 font-display text-xl font-bold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm text-ink-muted">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="packages" className="page-container py-8 sm:py-10">
        <p className="section-eyebrow">{landing.packages.eyebrow}</p>
        <h2 className="section-title mt-2">{landing.packages.title}</h2>
        <p className="mt-3 max-w-2xl text-ink-muted">{landing.packages.subtitle}</p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {packageCards.map((pkg: any, idx: number) => {
            const code = pkg.code || pkg.id;
            const features: string[] = pkg.features || (pkg.items || []).map((i: { name: string }) => i.name);
            return (
            <div key={code} className="rounded-xl border border-line bg-surface-card p-6 shadow-none">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-2xl font-bold text-ink">{pkg.name}</h3>
                  <p className="mt-1 text-sm text-ink-muted">{pkg.description}</p>
                </div>
                <p className="font-display text-3xl font-extrabold text-primary">₹{pkg.price}</p>
              </div>
              <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                {features.map((f: string) => (
                  <li key={f} className="text-sm text-ink-secondary">
                    • {f}
                  </li>
                ))}
              </ul>
              <Link href={`/register?package=${code}`} className="mt-6 inline-block">
                <Button variant={idx === 1 ? 'accent' : 'primary'}>{packages.selectLabel}</Button>
              </Link>
            </div>
            );
          })}
        </div>
      </section>

      <section id="shop" className="bg-surface-soft py-8 sm:py-10">
        <div className="page-container">
          <p className="section-eyebrow">Repurchase</p>
          <h2 className="section-title mt-2">Shop products. Earn points.</h2>
          <p className="mt-3 max-w-2xl text-ink-muted">
            After joining with Package A or B, repurchase products anytime. Each buy earns points — redeem to
            wallet with 50% shared with your referrer.
          </p>
          <Link href="/shop" className="mt-8 inline-block">
            <Button size="lg" variant="accent">
              Browse shop
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <section className="bg-primary py-8 text-white">
        <div className="page-container text-center">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">{landing.cta.title}</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/80">{landing.cta.subtitle}</p>
          <Link href="/register" className="mt-8 inline-block">
            <Button size="lg" variant="accent">
              {landing.cta.button}
            </Button>
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
