'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { mockRevenueSeries } from '@/lib/mock';
import { formatCurrency } from '@/lib/format';

const CHART_BLUE = '#3b82f6';

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-surface-card px-3 py-2 text-xs shadow-none">
      <p className="font-medium text-ink-muted">{label}</p>
      <p className="mt-0.5 font-semibold text-ink">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

export function RevenueOverviewChart({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-card p-3.5 shadow-none transition hover:shadow-none sm:p-4">
      <div>
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        <p className="mt-0.5 text-[11px] text-ink-muted">{subtitle}</p>
      </div>
      <div className="mt-3 h-[180px] w-full sm:h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mockRevenueSeries} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              dy={6}
            />
            <YAxis
              tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={48}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : String(v))}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }} />
            <Bar dataKey="value" fill={CHART_BLUE} radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
