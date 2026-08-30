import { ArrowRight, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

type MissionProgressCardProps = {
  coachLabel: string;
  missionTitle: string;
  missionSuffix: string;
  currentCount: number;
  targetCount: number;
  metricLabel: string;
  progressPct: number;
  remainingMessage: string;
  cashReward: number;
  cashRewardLabel: string;
  materialReward?: string | null;
  daysRemaining?: number | null;
  daysRemainingLabel?: string;
  showProgress?: boolean;
};

export function MissionProgressCard({
  coachLabel,
  missionTitle,
  missionSuffix,
  currentCount,
  targetCount,
  metricLabel,
  progressPct,
  remainingMessage,
  cashReward,
  cashRewardLabel,
  materialReward,
  daysRemaining,
  daysRemainingLabel,
  showProgress = true,
}: MissionProgressCardProps) {
  return (
    <div className="flex w-full min-w-0 flex-col rounded-2xl bg-[#3f2495] p-4 text-white shadow-none sm:p-6 lg:min-h-[320px] lg:p-7">
      <p className="text-xs font-normal leading-snug text-white/95 sm:text-[13px]">
        {coachLabel} ({missionTitle} {missionSuffix})
      </p>

      <div className="mt-4 sm:mt-5">
        <p className="font-display text-[2.125rem] font-bold leading-none tracking-tight text-white sm:text-[2.75rem] lg:text-[3rem]">
          {currentCount} / {targetCount}
        </p>
        <p className="mt-2 text-sm font-normal text-white sm:mt-2.5 sm:text-base">{metricLabel}</p>
      </div>

      {showProgress ? (
        <div className="mt-5 sm:mt-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#2a1866]/70 sm:h-3">
              <div
                className="h-full rounded-full bg-[#c4b5fd] transition-all duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="shrink-0 text-xs font-medium tabular-nums text-white sm:text-sm">{progressPct}%</span>
          </div>
          <p className="mt-2.5 text-xs leading-relaxed text-white/90 sm:mt-3 sm:text-sm">{remainingMessage}</p>
        </div>
      ) : null}

      <div className="mt-5 space-y-2 sm:mt-7 sm:space-y-2.5">
        <p className="text-sm font-medium text-white sm:text-[15px]">
          {formatCurrency(cashReward)} {cashRewardLabel}
        </p>
        {materialReward ? (
          <p className="flex items-center gap-2 text-sm font-medium text-white sm:text-[15px]">
            <ArrowRight className="h-3.5 w-3.5 shrink-0 stroke-[2.5] sm:h-[15px] sm:w-[15px]" aria-hidden />
            <span>{materialReward}</span>
          </p>
        ) : null}
      </div>

      {daysRemaining != null ? (
        <p className="mt-5 flex items-center gap-2 pt-2 text-xs text-white/85 sm:mt-auto sm:pt-7 sm:text-sm">
          <Clock className="h-3.5 w-3.5 shrink-0 stroke-[2] sm:h-4 sm:w-4" aria-hidden />
          <span>{daysRemainingLabel}</span>
        </p>
      ) : null}
    </div>
  );
}
