'use client';

import React from 'react';
import type { KpiSummary } from '@/types/dashboard';
import { cn } from '@/lib/utils';
export { KpiCardSkeleton, KpiStripSkeleton } from './DashboardSkeletons';

interface KpiCardProps {
  label: string;
  value: string | number;
  secondaryText?: string;
  isCritical?: boolean;
  className?: string;
}

export function KpiCard({
  label,
  value,
  secondaryText,
  isCritical = false,
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        'bg-white border border-[#CBD5E1] rounded-[4px] p-4 shadow-none flex flex-col justify-between overflow-hidden',
        className
      )}
    >
      {/* Top: Label */}
      <div className="pb-1">
        <span className="text-xs font-normal text-[#475569] leading-tight">
          {label}
        </span>
      </div>

      {/* Middle: Prominent Value */}
      <div className="my-0.5">
        <span
          className={cn(
            'font-display font-bold text-[32px] leading-tight tracking-tight tabular-nums',
            isCritical ? 'text-[#DC2626]' : 'text-[#0F172A]'
          )}
        >
          {value}
        </span>
      </div>

      {/* Bottom: Secondary line */}
      {secondaryText && (
        <div
          className={cn(
            'text-[11px] leading-tight line-clamp-2 mt-0.5',
            isCritical ? 'text-[#DC2626] font-medium' : 'text-[#475569] font-normal'
          )}
        >
          {secondaryText}
        </div>
      )}
    </div>
  );
}

interface KpiStripProps {
  kpi: KpiSummary;
}

export function KpiStrip({ kpi }: KpiStripProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2 lg:gap-2.5 w-full">
      {/* 1. High-risk zones */}
      <KpiCard
        label="High-risk zones"
        value={kpi.highRiskZones}
        secondaryText="+1 in past hour"
      />

      {/* 2. Critical zones (Red emphasis on value and subtext only) */}
      <KpiCard
        label="Critical zones"
        value={kpi.criticalZones}
        secondaryText="Zone B"
        isCritical={true}
      />

      {/* 3. Exposed (est.) */}
      <KpiCard
        label="Exposed (est.)"
        value={kpi.exposedPopulation.toLocaleString()}
        secondaryText="Across 5 prioritized zones"
      />

      {/* 4. Facilities affected */}
      <KpiCard
        label="Facilities affected"
        value={kpi.facilitiesAffected}
        secondaryText="3 in B · 2 in F · 1 in C · 1 in H"
      />

      {/* 5. Next onset */}
      <KpiCard
        label="Next onset"
        value={kpi.nextOnset}
        secondaryText={`In ${kpi.nextOnsetTimeRemainingMin} min · ${kpi.nextOnsetZone}`}
      />
    </div>
  );
}
