'use client';

import React from 'react';
import { RotateCcw, RotateCw, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

import type { DashboardMode } from '@/lib/api/types';

interface TimelineProps {
  currentTime: string;
  availableTimestamps?: string[];
  clockTimes?: Record<string, string>;
  activeMode?: DashboardMode;
  onSelectTime?: (time: string) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  playbackSpeed: 1 | 2 | 5;
  onChangeSpeed: (speed: 1 | 2 | 5) => void;
  onStepForward?: () => void;
  onStepBackward?: () => void;
  onReset?: () => void;
  currentFloodDepth?: string;
  statusLabel?: string;
  className?: string;
}

const DEFAULT_TIMESTAMPS = [
  'NOW',
  '+15m',
  '+30m',
  '+45m',
  '+1h',
  '+1h 30m',
  '+2h',
  '+3h',
  '+4h',
  '+6h',
];

export function Timeline({
  currentTime,
  availableTimestamps = DEFAULT_TIMESTAMPS,
  clockTimes = {},
  activeMode = 'LIVE_FORECAST',
  onSelectTime,
  isPlaying,
  onTogglePlay,
  playbackSpeed,
  onChangeSpeed,
  onStepForward,
  onStepBackward,
  onReset,
  currentFloodDepth = '0.31–0.71 m',
  statusLabel,
  className,
}: TimelineProps) {
  const currentIndex = availableTimestamps.indexOf(currentTime);
  const activeIdx = currentIndex === -1 ? 0 : currentIndex;
  const totalSteps = availableTimestamps.length;
  const progressPct =
    totalSteps > 1 ? (activeIdx / (totalSteps - 1)) * 100 : 0;

  // Milestone Calculations
  const onsetKey =
    activeMode === 'LIVE_FORECAST'
      ? '+45m'
      : activeMode === 'SCENARIO'
      ? 'T+30'
      : '14:30';

  const peakKey =
    activeMode === 'LIVE_FORECAST'
      ? '+2h'
      : activeMode === 'SCENARIO'
      ? 'T+2h'
      : '15:15';

  const onsetIdx = availableTimestamps.indexOf(onsetKey);
  const peakIdx = availableTimestamps.indexOf(peakKey);

  const onsetPct =
    onsetIdx !== -1 && totalSteps > 1
      ? (onsetIdx / (totalSteps - 1)) * 100
      : 33;

  const peakPct =
    peakIdx !== -1 && totalSteps > 1
      ? (peakIdx / (totalSteps - 1)) * 100
      : 66;

  const onsetLabel =
    activeMode === 'LIVE_FORECAST'
      ? 'ONSET +45m'
      : activeMode === 'SCENARIO'
      ? 'ONSET T+30'
      : 'ONSET 14:30';

  const peakLabel =
    activeMode === 'LIVE_FORECAST'
      ? 'PEAK +2h (1.00 m)'
      : activeMode === 'SCENARIO'
      ? 'PEAK T+2h (1.50 m)'
      : 'PEAK 15:15 (0.71 m)';

  const cursorLabel =
    activeMode === 'LIVE_FORECAST'
      ? clockTimes[currentTime]
        ? `${currentTime} (${clockTimes[currentTime]})`
        : `NOW ${currentTime}`
      : activeMode === 'SCENARIO'
      ? `${currentTime} Stress`
      : `${currentTime} IST`;

  return (
    <div
      className={cn(
        'bg-white border border-slate-200/90 rounded-lg p-2.5 shadow-2xs flex flex-col justify-between gap-1.5 select-none shrink-0',
        className
      )}
    >
      {/* Visual Timeline Hydrograph Track */}
      <div className="relative w-full h-8 flex items-center px-1">
        {/* Hydrograph Background Curve */}
        <svg
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
          viewBox="0 0 800 32"
        >
          <path
            d="M 0,26 Q 120,25 240,22 T 400,16 T 520,5 T 600,9 T 720,18 T 800,24"
            fill="none"
            stroke="#CBD5E1"
            strokeDasharray="3,2"
            strokeWidth="1.5"
          />
          <path
            d="M 200,22 Q 400,16 480,10 T 560,5 L 560,32 L 200,32 Z"
            fill="#FEE2E2"
            opacity="0.5"
          />
        </svg>

        {/* Base Progress Rail */}
        <div className="w-full h-1.5 bg-slate-200 rounded-full relative z-0 flex items-center overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              activeMode === 'LIVE_FORECAST'
                ? 'bg-emerald-600'
                : activeMode === 'SCENARIO'
                ? 'bg-amber-600'
                : 'bg-slate-600'
            )}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Dynamic Current Cursor Indicator */}
        <div
          className="absolute -top-1 flex flex-col items-center z-20 -translate-x-1/2 transition-all duration-300"
          style={{ left: `${progressPct}%` }}
        >
          <span
            className={cn(
              'text-white px-1.5 py-0.2 rounded text-[10px] font-bold shadow-xs whitespace-nowrap',
              activeMode === 'LIVE_FORECAST'
                ? 'bg-emerald-700'
                : activeMode === 'SCENARIO'
                ? 'bg-amber-700'
                : 'bg-slate-900'
            )}
          >
            {cursorLabel}
          </span>
          <div
            className={cn(
              'w-0.5 h-4 mt-0.5',
              activeMode === 'LIVE_FORECAST'
                ? 'bg-emerald-700'
                : activeMode === 'SCENARIO'
                ? 'bg-amber-700'
                : 'bg-slate-900'
            )}
          />
        </div>

        {/* Dynamic Milestone: ONSET */}
        <div
          className="absolute -top-1.5 flex flex-col items-center z-10 -translate-x-1/2 pointer-events-none"
          style={{ left: `${onsetPct}%` }}
        >
          <span className="bg-red-600 text-white px-1.5 py-0.2 rounded text-[9px] font-bold shadow-xs whitespace-nowrap">
            {onsetLabel}
          </span>
          <div className="w-0.5 h-3 bg-red-600 mt-0.5" />
        </div>

        {/* Dynamic Milestone: PEAK */}
        <div
          className="absolute -top-1.5 flex flex-col items-center z-10 -translate-x-1/2 pointer-events-none"
          style={{ left: `${peakPct}%` }}
        >
          <span className="bg-slate-900 text-white px-1.5 py-0.2 rounded text-[9px] font-bold shadow-xs whitespace-nowrap">
            {peakLabel}
          </span>
          <div className="w-0.5 h-3 bg-slate-900 mt-0.5" />
        </div>
      </div>

      {/* Playback Controls & Timesteps */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
        {/* Playback Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onStepBackward}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900 transition-colors cursor-pointer"
            title="Step backward in simulation (Left Arrow)"
            aria-label="Step backward in simulation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onTogglePlay}
            className={cn(
              'w-6 h-6 flex items-center justify-center rounded text-white focus-visible:ring-2 focus-visible:ring-slate-900 shadow-2xs transition-colors cursor-pointer',
              activeMode === 'LIVE_FORECAST'
                ? 'bg-emerald-700 hover:bg-emerald-800'
                : activeMode === 'SCENARIO'
                ? 'bg-amber-700 hover:bg-amber-800'
                : 'bg-slate-900 hover:bg-slate-800'
            )}
            title={isPlaying ? 'Pause simulation (Space)' : 'Play simulation (Space)'}
            aria-label={isPlaying ? 'Pause simulation' : 'Play simulation'}
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
            )}
          </button>
          <button
            type="button"
            onClick={onStepForward}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900 transition-colors cursor-pointer"
            title="Step forward in simulation (Right Arrow)"
            aria-label="Step forward in simulation"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Clickable Timestep Scrub Buttons with clock time sublabels */}
        <div className="flex items-center justify-between flex-1 max-w-xl px-2 overflow-x-auto gap-1">
          {availableTimestamps.map((t) => {
            const isSelected = t === currentTime;
            const clock = clockTimes[t];
            const isOnset = t === onsetKey;

            return (
              <button
                key={t}
                type="button"
                onClick={() => onSelectTime?.(t)}
                className={cn(
                  'px-1.5 py-0.5 rounded text-[11px] font-semibold tabular-nums transition-colors cursor-pointer flex flex-col items-center leading-tight',
                  isSelected
                    ? activeMode === 'LIVE_FORECAST'
                      ? 'bg-emerald-700 text-white font-bold shadow-xs'
                      : activeMode === 'SCENARIO'
                      ? 'bg-amber-700 text-white font-bold shadow-xs'
                      : 'bg-slate-900 text-white font-bold shadow-xs'
                    : isOnset
                    ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                    : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                <div className="flex items-center gap-0.5">
                  <span>{t}</span>
                  {isOnset && <span className="text-[8px] font-bold text-red-600">!</span>}
                </div>
                {clock && activeMode === 'LIVE_FORECAST' && (
                  <span
                    className={cn(
                      'text-[8px] font-normal leading-none',
                      isSelected ? 'text-emerald-100' : 'text-slate-400'
                    )}
                  >
                    {clock}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Playback Speed Multipliers & Delta */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center bg-slate-100 rounded p-0.5 border border-slate-200/80">
            {([1, 2, 5] as const).map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => onChangeSpeed(spd)}
                className={cn(
                  'px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer',
                  playbackSpeed === spd
                    ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-900'
                )}
                aria-label={`${spd}x playback speed`}
              >
                {spd}x
              </button>
            ))}
          </div>
          <span
            className="text-xs font-bold tabular-nums text-slate-900 min-w-[50px] text-right truncate"
            title={statusLabel || `Depth: ${currentFloodDepth}`}
          >
            {statusLabel ? statusLabel.split(' ')[0] : currentFloodDepth}
          </span>
        </div>
      </div>
    </div>
  );
}
