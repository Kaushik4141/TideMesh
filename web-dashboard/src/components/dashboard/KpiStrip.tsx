'use client';

import React from 'react';
import { AlertTriangle, OctagonAlert, Users, Building2, Timer } from 'lucide-react';
import type { KpiSummary } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: string | number;
  secondaryText?: string;
  icon: React.ReactNode;
  isCritical?: boolean;
  valueIcon?: React.ReactNode;
  className?: string;
}

export function KpiCard({
  label,
  value,
  secondaryText,
  icon,
  isCritical = false,
  valueIcon,
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        'relative bg-white border border-slate-200/90 rounded-lg p-2.5 lg:p-3 shadow-2xs flex flex-col justify-between overflow-hidden transition-all',
        isCritical ? 'border-l-4 border-l-red-600' : 'border-l-4 border-l-slate-300',
        className
      )}
    >
      {/* Top: Label and Icon */}
      <div className="flex items-center justify-between gap-1.5 pb-1">
        <span className="text-xs font-medium text-slate-600 leading-tight">
          {label}
        </span>
        <span className={cn('shrink-0', isCritical ? 'text-red-600' : 'text-slate-400')}>
          {icon}
        </span>
      </div>

      {/* Middle: Prominent Value */}
      <div className="flex items-baseline gap-1.5 my-0.5">
        {valueIcon}
        <span
          className={cn(
            'text-2xl font-bold tracking-tight tabular-nums',
            isCritical ? 'text-red-600' : 'text-slate-900'
          )}
        >
          {value}
        </span>
      </div>

      {/* Bottom: Secondary line (wraps up to 2 lines max, never truncated with ugly ellipsis) */}
      {secondaryText && (
        <div
          className={cn(
            'text-[11px] leading-tight line-clamp-2 mt-0.5 font-normal',
            isCritical ? 'text-red-700 font-semibold' : 'text-slate-500'
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
        icon={<AlertTriangle className="w-4 h-4 text-orange-500" />}
      />

      {/* 2. Critical zones (Red accent reserved here) */}
      <KpiCard
        label="Critical zones"
        value={kpi.criticalZones}
        secondaryText="Zone B active watch"
        icon={<OctagonAlert className="w-4 h-4 text-red-600" />}
        isCritical={true}
      />

      {/* 3. Exposed (est.) */}
      <KpiCard
        label="Exposed (est.)"
        value={kpi.exposedPopulation.toLocaleString()}
        secondaryText="Across 5 prioritized zones"
        icon={<Users className="w-4 h-4" />}
      />

      {/* 4. Facilities affected */}
      <KpiCard
        label="Facilities affected"
        value={kpi.facilitiesAffected}
        secondaryText="3 in B · 2 in F · 1 in C · 1 in H"
        icon={<Building2 className="w-4 h-4" />}
      />

      {/* 5. Next onset */}
      <KpiCard
        label="Next onset"
        value={kpi.nextOnset}
        secondaryText={`In ${kpi.nextOnsetTimeRemainingMin} min · ${kpi.nextOnsetZone}`}
        icon={<Timer className="w-4 h-4 text-red-600" />}
        valueIcon={
          <span className="w-2 h-2 rounded-full bg-red-600 inline-block mb-1" title="Immediate onset countdown" />
        }
      />
    </div>
  );
}
