'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { mockMemberGrowthSeries } from '@/lib/mock';

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
      <p className="mt-0.5 font-semibold text-ink">{payload[0].value.toLocaleString('en-IN')} members</p>
    </div>
  );
}

export function MemberGrowthChart({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-card p-3.5 shadow-none transition hover:shadow-none sm:p-4">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <div className="mt-3 h-[180px] w-full sm:h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mockMemberGrowthSeries} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="memberGrowthFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_BLUE} stopOpacity={0.35} />
                <stop offset="100%" stopColor={CHART_BLUE} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              dy={6}
            />
            <YAxis
              tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={42}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: CHART_BLUE, strokeOpacity: 0.2 }} />
            <Area
              type="monotone"
              dataKey="members"
              stroke={CHART_BLUE}
              strokeWidth={2}
              fill="url(#memberGrowthFill)"
              dot={false}
              activeDot={{ r: 4, fill: CHART_BLUE, stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
