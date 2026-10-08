'use client';

import React from 'react';
import { RotateCcw, RotateCw, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
export { TimelineSkeleton } from './DashboardSkeletons';

interface TimelineProps {
  currentTime: string;
  availableTimestamps?: string[];
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
  '14:00',
  '14:15',
  '14:26',
  '14:30',
  '14:45',
  '15:00',
  '15:15',
  '15:30',
  '15:45',
  '16:00',
];

export function Timeline({
  currentTime,
  availableTimestamps = DEFAULT_TIMESTAMPS,
  onSelectTime,
  isPlaying,
  onTogglePlay,
  playbackSpeed,
  onChangeSpeed,
  onStepForward,
  onStepBackward,
  currentFloodDepth = '0.31–0.71 m',
  statusLabel,
  className,
}: TimelineProps) {
  const currentIndex = availableTimestamps.indexOf(currentTime);
  const activeIdx = currentIndex === -1 ? 0 : currentIndex;
  const progressPct =
    availableTimestamps.length > 1
      ? (activeIdx / (availableTimestamps.length - 1)) * 100
      : 0;

  return (
    <div
      className={cn(
        'bg-white border border-slate-200/90 rounded-lg p-2.5 shadow-2xs flex flex-col justify-between gap-1.5 select-none shrink-0',
        className
      )}
    >
      {/* Visual Timeline Hydrograph Track */}
      <div className="relative w-full h-10 flex items-center px-1 overflow-visible">
        {/* Hydrograph Background Curve */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 40">
          <path
            d="M 0,32 Q 120,30 240,26 T 400,20 T 520,6 T 600,10 T 720,22 T 800,28"
            fill="none"
            stroke="#CBD5E1"
            strokeDasharray="3,2"
            strokeWidth="1.5"
          />
          <path
            d="M 200,26 Q 400,20 480,12 T 560,6 L 560,40 L 200,40 Z"
            fill="#FEE2E2"
            opacity="0.5"
          />
        </svg>

        {/* Base Progress Rail */}
        <div className="w-full h-1.5 bg-slate-200 rounded-full relative z-0 flex items-center overflow-hidden">
          <div
            className="h-full bg-slate-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Dynamic NOW Marker tracking playback (Top-positioned) */}
        <div
          className="absolute -top-2 flex flex-col items-center z-30 -translate-x-1/2 transition-all duration-300 pointer-events-none"
          style={{ left: `${progressPct}%` }}
        >
          <span className="bg-teal-700 text-white px-1.5 py-0.5 rounded text-[10px] font-bold shadow-xs whitespace-nowrap">
            NOW <span className="font-display font-bold tabular-nums text-xs tracking-wide">{currentTime}</span>
          </span>
          <div className="w-0.5 h-4 bg-teal-700 mt-0.5" />
        </div>

        {/* Marker 2: ONSET 14:30 (Fixed Reference at 25%, bottom-offset to prevent overlap with NOW) */}
        <div className="absolute left-[25%] -bottom-1 flex flex-col items-center z-20 -translate-x-1/2 pointer-events-none">
          <div className="w-0.5 h-3 bg-red-600 mb-0.5" />
          <span className="bg-red-600 text-white px-1.5 py-0.2 rounded text-[9px] font-bold shadow-xs whitespace-nowrap">
            ONSET <span className="font-display font-bold tabular-nums text-[11px] tracking-wide">14:30</span>
          </span>
        </div>

        {/* Marker 3: PEAK 15:10 (Fixed Reference at 58.3%) */}
        <div className="absolute left-[58%] -top-2 flex flex-col items-center z-10 -translate-x-1/2 pointer-events-none">
          <span className="bg-slate-900 text-white px-1.5 py-0.5 rounded text-[9px] font-bold shadow-xs whitespace-nowrap">
            PEAK <span className="font-display font-bold tabular-nums text-[11px] tracking-wide">15:10</span> (0.71 m)
          </span>
          <div className="w-0.5 h-4 bg-slate-900 mt-0.5" />
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
            className="w-6 h-6 flex items-center justify-center rounded bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-900 shadow-2xs transition-colors cursor-pointer"
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

        {/* Clickable Timestep Scrub Buttons */}
        <div className="flex items-center justify-between flex-1 max-w-xl px-2 overflow-x-auto gap-1">
          {availableTimestamps.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onSelectTime?.(t)}
              className={cn(
                'px-1.5 py-0.5 rounded text-[11px] font-semibold tabular-nums transition-colors cursor-pointer',
                t === currentTime
                  ? 'bg-slate-900 text-white font-bold'
                  : t === '14:30'
                  ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                  : 'text-slate-500 hover:bg-slate-100'
              )}
            >
              {t}
              {t === '14:30' && <span className="ml-0.5 text-[8px] font-bold text-red-600">!</span>}
            </button>
          ))}
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
