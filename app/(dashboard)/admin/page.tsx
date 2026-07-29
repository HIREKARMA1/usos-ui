'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import {
  IndianRupee,
  Users,
  UserCheck,
  Gift,
  ArrowUpRight,
  Wallet,
  Package,
  Activity,
  Sparkles,
} from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { useContent } from '@/hooks/useContent';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { AdminStats } from '@/types';

const easeOut = [0.22, 1, 0.36, 1] as const;

function AnimatedNumber({
  value,
  format,
}: {
  value: number;
  format?: (n: number) => string;
}) {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 80, damping: 22 });
  const [display, setDisplay] = useState(format ? format(0) : '0');

  useEffect(() => {
    motionValue.set(value);
  }, [motionValue, value]);

  useEffect(() => {
    const unsub = spring.on('change', (latest) => {
      const n = Math.round(latest);
      setDisplay(format ? format(n) : String(n));
    });
    return () => unsub();
  }, [spring, format]);

  return <span>{display}</span>;
}

function ActivationRing({
  rate,
  label,
  hint,
  reduceMotion,
}: {
  rate: number;
  label: string;
  hint: string;
  reduceMotion: boolean | null;
}) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, rate));
  const offset = c - (clamped / 100) * c;

  return (
    <div className="relative flex flex-col items-center justify-center py-2">
      <div className="relative h-36 w-36">
        <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
          <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
          <motion.circle
            cx="64"
            cy="64"
            r={r}
            fill="none"
            stroke="url(#adminRing)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: reduceMotion ? offset : offset }}
            transition={{ duration: reduceMotion ? 0 : 1.1, ease: easeOut }}
          />
          <defs>
            <linearGradient id="adminRing" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#00a2e5" />
              <stop offset="100%" stopColor="#1b52a4" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-3xl font-bold tracking-tight text-white">
            <AnimatedNumber value={clamped} format={(n) => `${n}%`} />
          </p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
            {label}
          </p>
        </div>
        {!reduceMotion ? (
          <motion.span
            className="pointer-events-none absolute inset-3 rounded-full border border-sky/20"
            animate={{ opacity: [0.25, 0.6, 0.25], scale: [1, 1.04, 1] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden
          />
        ) : null}
      </div>
      <p className="mt-2 max-w-[12rem] text-center text-[12px] text-white/45">{hint}</p>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const t = useContent('admin').analytics;
  const nav = useContent('admin').nav;
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [clock, setClock] = useState(() => new Date());
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    api.getAdminStats().then(setStats).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setClock(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

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

  const totalUsers = stats?.totalUsers || 0;
  const activeUsers = stats?.activeUsers || 0;
  const pendingRewards = stats?.pendingRewards || 0;
  const activationRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
  const needsAttention = pendingRewards > 0;
  const firstName = user?.name?.split(' ')[0] || 'Admin';

  const timeLabel = useMemo(() => {
    return clock.toLocaleString(undefined, {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [clock]);

  const jumps = [
    { href: '/admin/users', label: nav.users, icon: Users, accent: '#00a2e5' },
    { href: '/admin/rewards', label: nav.rewards, icon: Gift, accent: '#f58020' },
    { href: '/admin/withdrawals', label: nav.withdrawals || 'Payouts', icon: Wallet, accent: '#fec40d' },
    { href: '/admin/packages', label: nav.packages, icon: Package, accent: '#098855' },
    { href: '/admin/products', label: nav.products || 'Products', icon: Sparkles, accent: '#1b52a4' },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Spinner className="h-8 w-8 border-sky/25 border-t-sky" />
        <p className="text-[12px] font-medium tracking-wide text-white/40">{t.live}…</p>
      </div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
      {/* Mission header */}
      <motion.section
        variants={fadeUp}
        className="relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#0a1220]/70 p-5 sm:p-6"
      >
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full blur-[90px]"
          style={{ background: 'rgba(0,162,229,0.22)' }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 left-10 h-48 w-48 rounded-full blur-[90px]"
          style={{ background: 'rgba(245,128,32,0.12)' }}
          aria-hidden
        />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inset-0 animate-ping rounded-full bg-emerald-300/70" />
                  <span className="relative rounded-full bg-emerald-300 h-1.5 w-1.5" />
                </span>
                {t.live}
              </span>
              <span
                className={cn(
                  'rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]',
                  needsAttention
                    ? 'border-orange/30 bg-orange/10 text-[#ffb16a]'
                    : 'border-white/10 bg-white/[0.04] text-white/50'
                )}
              >
                {needsAttention ? t.healthAttention : t.healthClear}
              </span>
              <span className="text-[11px] text-white/35">{timeLabel}</span>
            </div>
            <h1 className="mt-3 text-[1.65rem] font-bold leading-tight tracking-tight text-white sm:text-[2rem]">
              {firstName}
              <span className="text-white/35"> · </span>
              {t.title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-white/55">{t.subtitle}</p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 lg:self-auto">
            <Activity className="h-4 w-4 text-sky" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                {t.stats.activeUsers}
              </p>
              <p className="text-lg font-bold text-white">
                <AnimatedNumber value={activeUsers} />
                <span className="text-sm font-medium text-white/35"> / {totalUsers}</span>
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Bento cockpit */}
      <div className="grid gap-3 lg:grid-cols-12 lg:items-stretch">
        <motion.div
          variants={fadeUp}
          whileHover={reduceMotion ? undefined : { y: -3 }}
          className="relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-gradient-to-br from-[#1b52a4]/35 via-white/[0.04] to-transparent p-5 sm:p-6 lg:col-span-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky">{t.stats.totalRevenue}</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                <AnimatedNumber
                  value={stats?.totalRevenue || 0}
                  format={(n) => formatCurrency(n)}
                />
              </p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-sky">
              <IndianRupee className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                {t.stats.totalPayouts}
              </p>
              <p className="mt-1 text-lg font-bold text-white">
                <AnimatedNumber
                  value={stats?.totalPayouts || 0}
                  format={(n) => formatCurrency(n)}
                />
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                {t.stats.totalUsers}
              </p>
              <p className="mt-1 text-lg font-bold text-white">
                <AnimatedNumber value={totalUsers} />
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-5 lg:col-span-3"
        >
          <ActivationRing
            rate={activationRate}
            label={t.activationRate}
            hint={t.activationHint}
            reduceMotion={reduceMotion}
          />
        </motion.div>

        <motion.div variants={fadeUp} className="flex flex-col gap-3 lg:col-span-4">
          <Link
            href="/admin/rewards"
            className="group flex flex-1 items-center justify-between gap-3 overflow-hidden rounded-[1.35rem] border border-orange/25 bg-gradient-to-br from-orange/20 to-transparent p-5 transition hover:border-orange/45"
          >
            <div>
              <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#ffb16a]">
                <Gift className="h-3.5 w-3.5" />
                {t.stats.pendingRewards}
              </p>
              <p className="mt-2 text-3xl font-bold text-white">
                <AnimatedNumber value={pendingRewards} />
              </p>
              <p className="mt-1 text-[12px] text-white/45">{t.openQueue}</p>
            </div>
            <ArrowUpRight className="h-5 w-5 text-white/35 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
          </Link>

          <div className="grid flex-1 grid-cols-2 gap-3">
            <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4">
              <UserCheck className="h-4 w-4 text-[#5ddea8]" />
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                {t.stats.activeUsers}
              </p>
              <p className="mt-1 text-xl font-bold text-white">
                <AnimatedNumber value={activeUsers} />
              </p>
            </div>
            <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4">
              <Users className="h-4 w-4 text-sky" />
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                {t.stats.totalUsers}
              </p>
              <p className="mt-1 text-xl font-bold text-white">
                <AnimatedNumber value={totalUsers} />
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Attention + jump dock */}
      <div className="grid gap-3 lg:grid-cols-12">
        <motion.section
          variants={fadeUp}
          className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-5 lg:col-span-5"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky">{t.attentionTitle}</p>
          <p className="mt-1 text-sm text-white/50">{t.attentionSubtitle}</p>
          <div className="mt-4 space-y-2">
            <Link
              href="/admin/rewards"
              className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0a1220]/60 px-3.5 py-3 transition hover:border-sky/35"
            >
              <span className="text-[13px] font-semibold text-white/80">{nav.rewards}</span>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[11px] font-bold',
                  pendingRewards > 0 ? 'bg-orange/20 text-[#ffb16a]' : 'bg-white/10 text-white/45'
                )}
              >
                {pendingRewards}
              </span>
            </Link>
            <Link
              href="/admin/withdrawals"
              className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0a1220]/60 px-3.5 py-3 transition hover:border-sky/35"
            >
              <span className="text-[13px] font-semibold text-white/80">{nav.withdrawals}</span>
              <ArrowUpRight className="h-4 w-4 text-white/30" />
            </Link>
          </div>
        </motion.section>

        <motion.section variants={fadeUp} className="lg:col-span-7">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
            {t.jumpTitle}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {jumps.map(({ href, label, icon: Icon, accent }) => (
              <Link
                key={href}
                href={href}
                className="group relative min-w-[9.5rem] flex-1 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 transition hover:border-white/25"
              >
                <span
                  className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(circle at 30% 20%, ${accent}33, transparent 55%)`,
                  }}
                  aria-hidden
                />
                <span
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10"
                  style={{ color: accent, background: `${accent}22` }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <p className="relative mt-3 text-[13px] font-semibold text-white/80 group-hover:text-white">
                  {label}
                </p>
                <ArrowUpRight className="relative mt-2 h-3.5 w-3.5 text-white/25 transition group-hover:translate-x-0.5 group-hover:text-white/70" />
              </Link>
            ))}
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}
