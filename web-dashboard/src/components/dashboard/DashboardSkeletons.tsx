'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * KpiCardSkeleton: Matches plain KPI card shell exactly.
 * Label bar ~96×14, value block ~64×36, secondary line ~110×12.
 */
export function KpiCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-white border border-[#CBD5E1] rounded-[4px] p-4 shadow-none flex flex-col justify-between overflow-hidden',
        className
      )}
    >
      {/* Label bar ~96×14 */}
      <div className="pb-1">
        <Skeleton className="w-[96px] h-[14px]" />
      </div>

      {/* Value block ~64×36 */}
      <div className="my-0.5">
        <Skeleton className="w-[64px] h-[36px]" />
      </div>

      {/* Secondary line */}
      <div className="mt-0.5">
        <Skeleton className="w-[110px] h-[12px]" />
      </div>
    </div>
  );
}

/**
 * KpiStripSkeleton: Renders 5 identical plain KPI card skeletons.
 */
export function KpiStripSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2 lg:gap-2.5 w-full',
        className
      )}
      aria-busy="true"
    >
      <span className="sr-only" role="status">
        Loading zone data
      </span>
      {Array.from({ length: 5 }).map((_, i) => (
        <KpiCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * PriorityTabsSkeleton: 3 pills matching the priority switcher strip.
 */
export function PriorityTabsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-1.5 py-0.5', className)}>
      <Skeleton className="w-[58px] h-[22px] rounded-md" />
      <Skeleton className="w-[58px] h-[22px] rounded-md" />
      <Skeleton className="w-[58px] h-[22px] rounded-md" />
    </div>
  );
}

/**
 * ZoneDrawerSkeleton: Matches ZoneDrawer dimensions and sections.
 * Title + badge, countdown, 3 tab pills, 2 button blocks, 2 large number blocks, 3 text lines.
 */
export function ZoneDrawerSkeleton({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        'w-full xl:w-[420px] 2xl:w-[440px] shrink-0 bg-white border border-slate-200/90 rounded-lg shadow-xs flex flex-col h-full min-h-0 select-none overflow-hidden',
        className
      )}
      aria-busy="true"
      aria-label="Loading zone details"
    >
      <span className="sr-only" role="status">
        Loading zone details
      </span>

      {/* 1. Header with title + badge, ward */}
      <div className="p-3.5 pb-2.5 border-b border-slate-200 bg-white flex flex-col gap-1.5 shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              {/* Title block */}
              <Skeleton className="w-40 h-6" />
              {/* Badge block */}
              <Skeleton className="w-16 h-5 rounded-md" />
            </div>
            {/* Ward line */}
            <Skeleton className="w-24 h-3.5" />
          </div>
          <Skeleton className="w-6 h-6 rounded" />
        </div>

        {/* 2. Countdown line */}
        <div className="flex items-center gap-2 pt-0.5">
          <Skeleton className="w-4 h-4 rounded-full" />
          <Skeleton className="w-24 h-4" />
          <Skeleton className="w-36 h-3" />
        </div>

        {/* 3. 3 tab pills */}
        <div className="flex items-center gap-1 border-t border-slate-100 pt-2 mt-1">
          <Skeleton className="w-12 h-3.5 mr-1" />
          <PriorityTabsSkeleton />
        </div>
      </div>

      {/* 4. Action bar: 2 button blocks */}
      <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 shrink-0 space-y-1.5 shadow-2xs z-10">
        <div className="flex items-center gap-2">
          {/* Acknowledge button block */}
          <Skeleton className="flex-1 h-8 rounded-md" />
          {/* Assign Team button block */}
          <Skeleton className="w-28 h-8 rounded-md" />
          <Skeleton className="w-8 h-8 rounded-md" />
        </div>
      </div>

      {/* 5. Scrollable body with 2 large number blocks and 3 text lines */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
        {/* Prediction card with 2 large number blocks */}
        <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-200/90 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1.5">
              <Skeleton className="w-20 h-3" />
              {/* Large number block 1 */}
              <Skeleton className="w-16 h-7" />
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="w-20 h-3" />
              {/* Large number block 2 */}
              <Skeleton className="w-20 h-7" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
            <Skeleton className="w-20 h-3.5" />
            <Skeleton className="w-20 h-3.5" />
          </div>
        </div>

        {/* Why is this critical? section with 3 text lines */}
        <div className="space-y-2 pt-1 border-t border-slate-200">
          <Skeleton className="w-36 h-4" />
          <div className="space-y-1.5 pt-1">
            <Skeleton className="w-full h-3" />
            <Skeleton className="w-5/6 h-3" />
            <Skeleton className="w-4/6 h-3" />
          </div>
        </div>

        {/* Estimated impact blocks */}
        <div className="space-y-2 pt-1 border-t border-slate-200">
          <Skeleton className="w-28 h-4" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-12 rounded-md" />
            <Skeleton className="h-12 rounded-md" />
            <Skeleton className="h-12 rounded-md" />
            <Skeleton className="h-12 rounded-md" />
          </div>
        </div>
      </div>
    </aside>
  );
}

/**
 * TimelineSkeleton: Matches Timeline height and layout with thin bar.
 */
export function TimelineSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-white border border-slate-200/90 rounded-lg p-2.5 shadow-2xs flex flex-col justify-between gap-1.5 select-none shrink-0 h-[74px]',
        className
      )}
      aria-busy="true"
    >
      <span className="sr-only" role="status">
        Loading timeline data
      </span>
      {/* Thin bar */}
      <div className="relative w-full h-6 flex items-center px-1">
        <Skeleton className="w-full h-1.5 rounded-full" />
      </div>

      {/* Control Strip */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100 gap-2">
        <div className="flex items-center gap-1 shrink-0">
          <Skeleton className="w-6 h-6 rounded" />
          <Skeleton className="w-6 h-6 rounded" />
          <Skeleton className="w-6 h-6 rounded" />
        </div>
        <Skeleton className="flex-1 max-w-xs h-3.5 mx-2" />
        <Skeleton className="w-16 h-6 rounded" />
      </div>
    </div>
  );
}

/**
 * MapSkeleton: Flat #F1F5F9 block with the exact same dimensions while tiles initialize.
 * No skeleton inside the map itself.
 */
export function MapSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'w-full h-full bg-[#F1F5F9] rounded-lg border border-slate-200/90 shadow-2xs relative overflow-hidden',
        className
      )}
      aria-busy="true"
    >
      <span className="sr-only" role="status">
        Loading map tiles
      </span>
    </div>
  );
}

/**
 * DataErrorPanel: Replaces the loading skeleton if data has not loaded within 3 seconds.
 * Shows "Can't load live data" + Retry button (minimum 44px touch target).
 */
export function DataErrorPanel({
  onRetry,
  className,
}: {
  onRetry: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex-1 flex flex-col items-center justify-center p-8 bg-white border border-slate-200/90 rounded-lg shadow-2xs text-center gap-4',
        className
      )}
      role="alert"
    >
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-bold text-slate-900">Can&apos;t load live data</h3>
        <p className="text-xs text-slate-500 max-w-sm">
          Live flood telemetry stream timed out or is unavailable. Please retry to reconnect.
        </p>
      </div>
      <button
        onClick={onRetry}
        className="min-h-[44px] min-w-[120px] px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 cursor-pointer"
        aria-label="Retry loading live data"
      >
        Retry
      </button>
    </div>
  );
}
