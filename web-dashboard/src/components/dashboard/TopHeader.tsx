'use client';

import React from 'react';
import {
  Shield,
  Droplets,
  Building2,
  Bell,
  User,
  Keyboard,
  Zap,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import type { DashboardMode } from '@/lib/api/types';

interface TopHeaderProps {
  onOpenShortcuts?: () => void;
  activeMode?: DashboardMode;
  onSwitchMode?: (mode: DashboardMode) => void;
  onOpenScenario?: () => void;
  eventName?: string;
  eventType?: string;
  currentTime?: string;
  clockTimes?: Record<string, string>;
  isSimulation?: boolean;
  isSimulationRunning?: boolean;
  onRunSimulation?: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function TopHeader({
  onOpenShortcuts,
  activeMode = 'LIVE_FORECAST',
  onSwitchMode,
  onOpenScenario,
  eventName = 'Mangaluru Coastal Plain — 0–6h Forecast',
  currentTime = 'NOW',
  clockTimes = {},
  isSimulationRunning = false,
  onRunSimulation,
  onRefresh,
  isLoading = false,
}: TopHeaderProps) {
  const displayClock = clockTimes[currentTime];
  const timeChipLabel =
    activeMode === 'LIVE_FORECAST'
      ? displayClock
        ? `${currentTime} (${displayClock} IST)`
        : `${currentTime}`
      : activeMode === 'SCENARIO'
      ? `${currentTime} · Stress Test`
      : `${currentTime} IST`;

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 z-40 flex items-center justify-between px-3 lg:px-5 whitespace-nowrap select-none shadow-xs">
      {/* Left: Brand & Event */}
      <div className="flex items-center gap-2.5 lg:gap-3.5 min-w-0 flex-shrink">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-sky-400 flex items-center justify-center shadow-xs">
            <Shield className="w-5 h-5 text-sky-400" aria-hidden="true" />
          </div>
          <span className="text-base font-extrabold text-slate-900 tracking-tight whitespace-nowrap hidden sm:inline">
            TideMesh
          </span>
        </div>

        <div className="h-4 w-px bg-slate-200 shrink-0 hidden md:block" />

        {/* Event name */}
        <div
          className="hidden md:flex items-center gap-1.5 min-w-0 text-slate-700 font-semibold text-xs cursor-default"
          title={eventName}
        >
          <Droplets className="w-3.5 h-3.5 text-blue-700 shrink-0" aria-hidden="true" />
          <span className="truncate max-w-[150px] lg:max-w-[220px] xl:max-w-xs">
            {eventName}
          </span>
        </div>
      </div>

      {/* Center: 3-Mode Operational Switcher */}
      <div className="flex items-center gap-2 lg:gap-2.5 shrink-0">
        {/* 3-Mode Segmented Pill Switcher */}
        {onSwitchMode && (
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shadow-2xs">
            {/* Mode 1: LIVE FORECAST */}
            <button
              type="button"
              onClick={() => onSwitchMode('LIVE_FORECAST')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] lg:text-xs font-bold transition-all cursor-pointer',
                activeMode === 'LIVE_FORECAST'
                  ? 'bg-white text-emerald-900 shadow-xs border border-emerald-300 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              )}
              title="Primary Mode: 0–6 hour forward hydrodynamic forecast driven by live conditions"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span
                  className={cn(
                    'absolute inline-flex h-full w-full rounded-full opacity-75',
                    activeMode === 'LIVE_FORECAST' ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'
                  )}
                />
                <span
                  className={cn(
                    'relative inline-flex rounded-full h-2 w-2',
                    activeMode === 'LIVE_FORECAST' ? 'bg-emerald-600' : 'bg-slate-400'
                  )}
                />
              </span>
              <span>LIVE FORECAST</span>
              <span
                className={cn(
                  'text-[9px] px-1 rounded font-bold uppercase',
                  activeMode === 'LIVE_FORECAST'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-600'
                )}
              >
                0–6h
              </span>
            </button>

            {/* Mode 2: HISTORICAL REPLAY */}
            <button
              type="button"
              onClick={() => onSwitchMode('HISTORICAL_REPLAY')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] lg:text-xs font-bold transition-all cursor-pointer',
                activeMode === 'HISTORICAL_REPLAY'
                  ? 'bg-white text-blue-900 shadow-xs border border-blue-300 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              )}
              title="Calibration Mode: Hindcast benchmark reproducing May 29, 2018 Cyclone Mekunu event"
            >
              <span
                className={cn(
                  'w-2 h-2 rounded-full shrink-0',
                  activeMode === 'HISTORICAL_REPLAY' ? 'bg-blue-600' : 'bg-slate-400'
                )}
              />
              <span>HISTORICAL REPLAY</span>
              <span
                className={cn(
                  'text-[9px] px-1 rounded font-bold uppercase',
                  activeMode === 'HISTORICAL_REPLAY'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-slate-200 text-slate-600'
                )}
              >
                2018
              </span>
            </button>

            {/* Mode 3: WHAT-IF SCENARIO */}
            <button
              type="button"
              onClick={() => {
                onSwitchMode('SCENARIO');
                onOpenScenario?.();
              }}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] lg:text-xs font-bold transition-all cursor-pointer',
                activeMode === 'SCENARIO'
                  ? 'bg-white text-amber-900 shadow-xs border border-amber-300 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              )}
              title="Contingency Mode: Stress-test hypothetical cloudburst & storm surge parameters"
            >
              <span
                className={cn(
                  'w-2 h-2 rounded-full shrink-0',
                  activeMode === 'SCENARIO' ? 'bg-amber-500' : 'bg-slate-400'
                )}
              />
              <span>WHAT-IF SCENARIO</span>
              <span
                className={cn(
                  'text-[9px] px-1 rounded font-bold uppercase',
                  activeMode === 'SCENARIO'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-200 text-slate-600'
                )}
              >
                Stress
              </span>
            </button>
          </div>
        )}

        {/* Current Time Indicator Chip */}
        <div
          className="flex items-center gap-1.5 bg-slate-100/90 border border-slate-200/80 px-2 py-1 rounded-md text-[11px] font-semibold text-slate-700 whitespace-nowrap"
          title={`Active timeline cursor: ${timeChipLabel}`}
        >
          <span className="font-bold tracking-wide text-slate-900 tabular-nums">
            {timeChipLabel}
          </span>
        </div>

        {/* On-Demand SFINCS Execution Button */}
        {onRunSimulation && (
          <button
            onClick={onRunSimulation}
            disabled={isSimulationRunning}
            className="flex items-center gap-1 px-2.5 py-1 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white rounded-md text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
            title="Execute on-demand SFINCS hydrodynamic simulation (<15s)"
          >
            {isSimulationRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Solving...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">Run Solver</span>
              </>
            )}
          </button>
        )}

        {/* Manual Telemetry & Simulation Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 text-slate-700 rounded-md text-[11px] font-semibold border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            title="Refresh live telemetry and forecast"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Right: Shortcuts, Notifications, Duty Officer */}
      <div className="flex items-center gap-2.5 lg:gap-3.5 shrink-0">
        {/* Keyboard Shortcuts Trigger Button */}
        {onOpenShortcuts && (
          <button
            onClick={onOpenShortcuts}
            className="hidden md:flex items-center gap-1 px-2 py-1 rounded border border-slate-200 hover:bg-slate-100 text-[11px] font-semibold text-slate-600 transition-colors focus-visible:ring-2 focus-visible:ring-slate-900"
            title="Keyboard shortcuts list (Press ?)"
            aria-label="View keyboard shortcuts"
          >
            <Keyboard className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[10px] text-slate-500">Shortcuts</span>
            <kbd className="px-1 py-0.2 bg-slate-200/80 rounded text-[9px] font-mono text-slate-700">
              ?
            </kbd>
          </button>
        )}

        {/* Notifications */}
        <div
          className="relative flex items-center justify-center w-8 h-8 text-slate-600 hover:text-slate-900 cursor-pointer rounded-md hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-slate-900"
          title="3 active unacknowledged flood alerts"
          role="button"
          tabIndex={0}
          aria-label="3 Active Alerts"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 text-white text-[9px] font-bold">
            3
          </span>
        </div>

        <div className="h-4 w-px bg-slate-200" />

        {/* Officer Profile */}
        <div className="flex items-center gap-2.5">
          <div className="hidden xl:flex flex-col text-right leading-tight">
            <span className="text-xs font-bold text-slate-900">R. Shetty</span>
            <span className="text-[10px] text-slate-500 font-medium">DK District Disaster Cell</span>
          </div>
          <div
            className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300/80 flex items-center justify-center text-slate-700 font-bold text-xs"
            title="Duty Officer: R. Shetty (DK District Disaster Cell)"
          >
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  );
}
