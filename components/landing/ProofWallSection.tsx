'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, IndianRupee, Shield } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import type { ProofWall } from '@/types';

export function ProofWallSection({
  copy,
}: {
  copy: {
    eyebrow: string;
    title: string;
    titleHighlight?: string;
    subtitle: string;
    payouts: string;
    rewards: string;
    empty: string;
    payoutLabel: string;
    rewardLabel: string;
  };
}) {
  const [data, setData] = useState<ProofWall | null>(null);

  useEffect(() => {
    api.getProofWall(12).then(setData).catch(() => setData(null));
  }, []);

  const events = data?.events || [];

  return (
    <section id="proof" className="relative overflow-hidden bg-[#101a2c] py-10 text-white sm:py-12">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-40 w-[36rem] -translate-x-1/2 rounded-full blur-[100px]"
        style={{ background: 'rgba(9,136,85,0.18)' }}
        aria-hidden
      />
      <div className="page-container relative space-y-6">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky">
              <Shield className="h-3.5 w-3.5" />
              {copy.eyebrow}
            </p>
            <h2 className="mt-1.5 text-xl font-bold tracking-tight sm:text-2xl">{copy.title}</h2>
            <p className="mt-2 text-sm text-white/60">{copy.subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] text-white/70">
              {copy.payouts}: {formatCurrency((data?.totalPayoutsPaise || 0) / 100)} · {data?.payoutCount || 0}
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] text-white/70">
              {copy.rewards}: {data?.rewardCount || 0}
            </div>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-5 py-10 text-center text-sm text-white/50">
            {copy.empty}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((ev, i) => (
              <motion.article
                key={ev.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/55">
                    {ev.kind === 'payout' ? (
                      <>
                        <IndianRupee className="h-3 w-3 text-sky" />
                        {copy.payoutLabel}
                      </>
                    ) : (
                      <>
                        <Gift className="h-3 w-3 text-orange" />
                        {copy.rewardLabel}
                      </>
                    )}
                  </span>
                  <span className="text-[11px] text-white/35">{formatDate(ev.occurredAt)}</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-white">{ev.title}</p>
                <p className="mt-1 text-[12px] text-white/50">{ev.memberLabel}</p>
                <p className="mt-3 text-lg font-bold text-white">
                  {ev.amountPaise > 0 ? formatCurrency(ev.amountPaise / 100) : ev.materialReward || '—'}
                  {ev.amountPaise > 0 && ev.materialReward ? (
                    <span className="ml-2 text-xs font-medium text-white/45">+ {ev.materialReward}</span>
                  ) : null}
                </p>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
