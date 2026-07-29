'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Network, Wallet, ShieldCheck, Gift, Languages, BadgeCheck } from 'lucide-react';
import { PublicFooter, PublicHeader } from '@/components/layout/PublicShell';
import { Button } from '@/components/ui/Button';
import { withHighlightMark } from '@/components/ui/HighlightMark';
import { ProofWallSection } from '@/components/landing/ProofWallSection';
import { useContent } from '@/hooks/useContent';
import { useAuth } from '@/hooks/useAuth';
import { useAuthGate } from '@/hooks/useAuthGate';
import { useLocale } from '@/hooks/useLocale';
import { roleHome } from '@/lib/api';

const featureIcons = [Network, Wallet, Gift, ShieldCheck, BadgeCheck, Languages];
const featureAccents = ['#1b52a4', '#00a2e5', '#f58020', '#098855', '#fec40d', '#d64246'];

const easeOut = [0.22, 1, 0.36, 1] as const;

export default function LandingPage() {
  const landing = useContent('landing');
  const packages = useContent('packages');
  const common = useContent('common');
  const { locale } = useLocale();
  const { user, isAuthenticated } = useAuth();
  const { openAuth } = useAuthGate();
  const dash = user ? roleHome(user.role) : '/user';
  const reduceMotion = useReducedMotion();

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
        staggerChildren: reduceMotion ? 0 : 0.07,
        delayChildren: reduceMotion ? 0 : 0.05,
      },
    },
  };

  // Remount in-view animations when locale changes so cards don't stay opacity:0
  const motionKey = locale;

  return (
    <div className="min-h-screen bg-[#0f1622]">
      <PublicHeader />

      {/* Compact hero */}
      <section className="relative isolate overflow-hidden">
        <motion.div
          className="absolute inset-0"
          initial={reduceMotion ? false : { scale: 1.06, opacity: 0.85 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.1, ease: easeOut }}
        >
          <Image
            src="/images/landing/hero-network.png"
            alt=""
            fill
            priority
            className="object-cover object-[center_30%]"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f1622] via-[#0f1622]/90 to-[#1b52a4]/40" aria-hidden />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1622] via-transparent to-[#0f1622]/40" aria-hidden />
        </motion.div>

        <div className="page-container relative grid items-center gap-8 py-12 sm:py-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10 lg:py-16">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="max-w-xl space-y-4"
          >
            <motion.p variants={fadeUp} className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky">
              {landing.hero.eyebrow}
            </motion.p>
            <motion.h1
              variants={fadeUp}
              className="text-[1.85rem] font-bold leading-[1.12] tracking-tight text-white sm:text-[2.35rem] lg:text-[2.6rem]"
            >
              {withHighlightMark(landing.hero.headline, landing.hero.headlineHighlight)}
            </motion.h1>
            <motion.p variants={fadeUp} className="text-[14px] leading-relaxed text-white/72 sm:text-[15px]">
              {landing.hero.subheadline}
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-2.5 pt-1">
              {isAuthenticated && user ? (
                <Link href={dash}>
                  <Button>
                    {common.nav.dashboard}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Button type="button" onClick={() => openAuth({ mode: 'register' })}>
                    {landing.hero.ctaPrimary}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-white/35 bg-white/10 text-white hover:border-white hover:bg-white/15"
                    onClick={() => openAuth({ mode: 'login' })}
                  >
                    {landing.hero.ctaSecondary}
                  </Button>
                </>
              )}
            </motion.div>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 gap-2.5"
          >
            {landing.stats.map((s: { value: string; label: string }) => (
              <motion.div
                key={s.label}
                variants={fadeUp}
                whileHover={reduceMotion ? undefined : { y: -3, transition: { duration: 0.2 } }}
                className="rounded-xl border border-white/15 bg-white/10 px-3.5 py-3 backdrop-blur-md"
              >
                <p className="text-lg font-bold tracking-tight text-white sm:text-xl">{s.value}</p>
                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-white/60">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Why U.S.O.S — rich bento + pathway */}
      <section id="features" className="relative overflow-hidden bg-[#0f1622] py-10 text-white sm:py-12">
        <div
          className="animate-hk-glow pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full blur-[100px]"
          style={{ background: 'rgba(27,82,164,0.35)' }}
          aria-hidden
        />
        <div
          className="animate-hk-glow pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full blur-[90px]"
          style={{ background: 'rgba(0,162,229,0.22)', animationDelay: '1.5s' }}
          aria-hidden
        />

        <div className="page-container relative space-y-7" key={`features-${motionKey}`}>
          <motion.div
            key={`features-head-${motionKey}`}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between"
          >
            <motion.div variants={fadeUp} className="max-w-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky">
                {landing.features.eyebrow}
              </p>
              <h2 className="mt-1.5 text-xl font-bold tracking-tight text-white sm:text-2xl">
                {withHighlightMark(landing.features.title, landing.features.titleHighlight)}
              </h2>
            </motion.div>
            <motion.p variants={fadeUp} className="max-w-md text-sm leading-relaxed text-white/65">
              {landing.features.subtitle}
            </motion.p>
          </motion.div>

          <motion.div
            key={`features-grid-${motionKey}`}
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            className="grid gap-3 lg:grid-cols-12"
          >
            {landing.features.items.map((item: { title: string; description: string }, idx: number) => {
              const Icon = featureIcons[idx % featureIcons.length];
              const accent = featureAccents[idx % featureAccents.length];
              const featured = idx < 2;
              return (
                <motion.div
                  key={`${motionKey}-${idx}-${item.title}`}
                  variants={fadeUp}
                  whileHover={
                    reduceMotion
                      ? undefined
                      : { y: -4, borderColor: 'rgba(255,255,255,0.22)', transition: { duration: 0.2 } }
                  }
                  className={
                    featured
                      ? 'group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.1] to-white/[0.03] p-5 lg:col-span-6'
                      : 'group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 lg:col-span-3'
                  }
                >
                  <span
                    className="absolute inset-x-0 top-0 h-1 opacity-90 transition-all duration-300 group-hover:h-1.5"
                    style={{ background: accent }}
                    aria-hidden
                  />
                  <motion.div
                    whileHover={reduceMotion ? undefined : { scale: 1.06 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                    className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${accent}22`, color: accent }}
                  >
                    <Icon className="h-5 w-5" />
                  </motion.div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                    {String(idx + 1).padStart(2, '0')}
                  </p>
                  <h3
                    className={
                      featured
                        ? 'mt-1 text-lg font-bold tracking-tight text-white'
                        : 'mt-1 text-sm font-bold tracking-tight text-white'
                    }
                  >
                    {item.title}
                  </h3>
                  <p
                    className={
                      featured
                        ? 'mt-2 text-sm leading-relaxed text-white/70'
                        : 'mt-1.5 text-[12.5px] leading-snug text-white/60'
                    }
                  >
                    {item.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div
            id="how"
            key={`how-${motionKey}`}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky">
                  {landing.howItWorks.eyebrow}
                </p>
                <h2 className="mt-1 text-base font-bold tracking-tight text-white sm:text-lg">
                  {withHighlightMark(landing.howItWorks.title, landing.howItWorks.titleHighlight)}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => openAuth({ mode: 'register' })}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky transition hover:gap-2.5 hover:text-white"
              >
                Start now <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <motion.div
              key={`how-steps-${motionKey}`}
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="grid gap-3 md:grid-cols-3"
            >
              {landing.howItWorks.steps.map(
                (step: { step: string; title: string; description: string }, idx: number) => (
                  <motion.div
                    key={step.step}
                    variants={fadeUp}
                    whileHover={reduceMotion ? undefined : { y: -3, transition: { duration: 0.2 } }}
                    className="relative rounded-xl border border-white/10 bg-[#0f1622]/60 p-3.5"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-[#0f1622]"
                        style={{ backgroundColor: featureAccents[idx] }}
                      >
                        {step.step}
                      </span>
                      {idx < 2 ? (
                        <span className="hidden h-px flex-1 bg-gradient-to-r from-white/25 to-transparent md:block" />
                      ) : null}
                    </div>
                    <h3 className="mt-2.5 text-sm font-bold tracking-tight text-white">{step.title}</h3>
                    <p className="mt-1 text-[12.5px] leading-snug text-white/60">{step.description}</p>
                  </motion.div>
                )
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Starter kits */}
      <section id="packages" className="relative overflow-hidden bg-[#101a2c] py-10 text-white sm:py-12">
        <div
          className="animate-hk-glow pointer-events-none absolute right-0 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full blur-[110px]"
          style={{ background: 'rgba(245,128,32,0.18)' }}
          aria-hidden
        />
        <div
          className="animate-hk-glow pointer-events-none absolute -left-10 bottom-0 h-64 w-64 rounded-full blur-[100px]"
          style={{ background: 'rgba(27,82,164,0.28)', animationDelay: '2s' }}
          aria-hidden
        />

        <div className="page-container relative space-y-6" key={`packages-${motionKey}`}>
          <motion.div
            key={`packages-head-${motionKey}`}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between"
          >
            <motion.div variants={fadeUp} className="max-w-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky">
                {landing.packages.eyebrow}
              </p>
              <h2 className="mt-1.5 text-xl font-bold tracking-tight text-white sm:text-2xl">
                {withHighlightMark(landing.packages.title, landing.packages.titleHighlight)}
              </h2>
            </motion.div>
            <motion.p variants={fadeUp} className="max-w-md text-sm leading-relaxed text-white/65">
              {landing.packages.subtitle}
            </motion.p>
          </motion.div>

          <div className="grid gap-3 lg:grid-cols-12 lg:items-stretch">
            <motion.div
              key={`kit-media-${motionKey}`}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp}
              whileHover={reduceMotion ? undefined : { scale: 1.01 }}
              transition={{ duration: 0.35 }}
              className="relative min-h-[200px] overflow-hidden rounded-2xl border border-white/10 lg:col-span-4 lg:min-h-full"
            >
              <Image
                src="/images/landing/kit-products.png"
                alt="U.S.O.S starter kit products"
                fill
                className="object-cover transition duration-700 hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f1622] via-[#0f1622]/25 to-transparent" aria-hidden />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky">Join fee</p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-white">₹2,500</p>
                <p className="mt-1 text-[12.5px] text-white/70">One payment · same ladder for both kits</p>
              </div>
            </motion.div>

            <motion.div
              key={`kit-cards-${motionKey}`}
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              className="grid gap-3 sm:grid-cols-2 lg:col-span-8"
            >
              {packages.items.map((pkg: any) => {
                const isB = pkg.id === 'B';
                const accent = isB ? '#f58020' : '#00a2e5';
                return (
                  <motion.div
                    key={pkg.id}
                    variants={fadeUp}
                    whileHover={
                      reduceMotion
                        ? undefined
                        : { y: -5, borderColor: 'rgba(255,255,255,0.28)', transition: { duration: 0.22 } }
                    }
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.1] to-white/[0.03] p-5"
                  >
                    <span className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} aria-hidden />
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold tracking-tight text-white">{pkg.name}</h3>
                          {pkg.badge ? (
                            <span
                              className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#0f1622]"
                              style={{ backgroundColor: accent }}
                            >
                              {pkg.badge}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-[12.5px] leading-snug text-white/60">{pkg.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold tracking-tight" style={{ color: accent }}>
                          ₹{pkg.price}
                        </p>
                        <p className="text-[10px] uppercase tracking-wide text-white/45">one-time</p>
                      </div>
                    </div>

                    <div className="mt-4 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                        {packages.featuresLabel}
                      </p>
                      <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
                        {pkg.features.map((f: string) => (
                          <li key={f} className="flex items-start gap-1.5 text-[12.5px] text-white/75">
                            <span
                              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{ backgroundColor: accent }}
                            />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      className="mt-5 w-full"
                      variant={isB ? 'accent' : 'secondary'}
                      onClick={() => openAuth({ mode: 'register', packageCode: pkg.id })}
                    >
                      {packages.selectLabel}
                      <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                    </Button>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          <p className="text-center text-[12px] text-white/45">{packages.note}</p>
        </div>
      </section>

      <ProofWallSection copy={landing.proof} />

      {/* Shop + join */}
      <section id="shop" className="relative isolate overflow-hidden py-10 sm:py-12">
        <Image
          src="/images/landing/community-smile.png"
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[#0f1622]/80" aria-hidden />
        <motion.div
          key={`cta-${motionKey}`}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          variants={stagger}
          className="page-container relative"
        >
          <div className="grid items-center gap-6 lg:grid-cols-[1.2fr_auto]">
            <motion.div variants={fadeUp}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky">
                {landing.shop?.eyebrow || 'Next step'}
              </p>
              <h2 className="mt-1.5 text-xl font-bold tracking-tight text-white sm:text-2xl">
                {withHighlightMark(landing.cta.title, landing.cta.titleHighlight)}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">
                {landing.cta.subtitle} {landing.shop?.subtitle}
              </p>
            </motion.div>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-2.5">
              <Button type="button" variant="accent" onClick={() => openAuth({ mode: 'register' })}>
                {landing.cta.button}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Link href="/shop">
                <Button variant="outline" className="border-white/35 bg-white/10 text-white hover:bg-white/15">
                  Browse shop
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      <PublicFooter />
    </div>
  );
}
