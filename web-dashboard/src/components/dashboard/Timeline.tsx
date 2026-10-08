'use client';

import React from 'react';
import { RotateCcw, RotateCw, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineProps {
  currentTime: string;
  isPlaying: boolean;
  onTogglePlay: () => void;
  playbackSpeed: 1 | 2 | 5;
  onChangeSpeed: (speed: 1 | 2 | 5) => void;
  className?: string;
}

export function Timeline({
  currentTime,
  isPlaying,
  onTogglePlay,
  playbackSpeed,
  onChangeSpeed,
  className,
}: TimelineProps) {
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
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 32">
          <path
            d="M 0,26 Q 120,25 240,22 T 400,16 T 520,5 T 600,9 T 720,18 T 800,24"
            fill="none"
            stroke="#CBD5E1"
            strokeDasharray="3,2"
            strokeWidth="1.5"
          />
          <path
            d="M 320,19 Q 400,16 450,10 T 520,5 L 520,32 L 320,32 Z"
            fill="#FEE2E2"
            opacity="0.5"
          />
        </svg>

        {/* Base Progress Rail */}
        <div className="w-full h-1.5 bg-slate-200 rounded-full relative z-0 flex items-center">
          <div className="absolute left-0 right-[42%] h-full bg-slate-400/80 rounded-full" />
        </div>

        {/* Marker 1: NOW 14:26 */}
        <div className="absolute left-[54%] -top-1.5 flex flex-col items-center z-10 -translate-x-1/2">
          <span className="bg-teal-700 text-white px-1.5 py-0.2 rounded text-[10px] font-bold shadow-xs whitespace-nowrap">
            NOW 14:26
          </span>
          <div className="w-0.5 h-4 bg-teal-700 mt-0.5" />
        </div>

        {/* Marker 2: ONSET 14:30 (Critical Red Allowed) */}
        <div className="absolute left-[59%] -top-1.5 flex flex-col items-center z-10 -translate-x-1/2">
          <span className="bg-red-600 text-white px-1.5 py-0.2 rounded text-[10px] font-bold shadow-xs whitespace-nowrap">
            ONSET 14:30
          </span>
          <div className="w-0.5 h-4 bg-red-600 mt-0.5" />
        </div>

        {/* Marker 3: PEAK 15:10 */}
        <div className="absolute left-[73%] -top-1.5 flex flex-col items-center z-10 -translate-x-1/2">
          <span className="bg-slate-900 text-white px-1.5 py-0.2 rounded text-[10px] font-bold shadow-xs whitespace-nowrap">
            PEAK 15:10 (0.71 m)
          </span>
          <div className="w-0.5 h-4 bg-slate-900 mt-0.5" />
        </div>
      </div>

      {/* Control Strip & Hourly Ticks */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100 gap-2">
        {/* Playback Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900 transition-colors"
            title="Step back 15 mins"
            aria-label="Step back 15 minutes"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onTogglePlay}
            className="w-6 h-6 flex items-center justify-center rounded bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-900 shadow-2xs transition-colors"
            title={isPlaying ? 'Pause timeline (Space)' : 'Play simulation (Space)'}
            aria-label={isPlaying ? 'Pause simulation' : 'Play simulation'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 translate-x-0.5" />}
          </button>
          <button
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900 transition-colors"
            title="Step forward 15 mins"
            aria-label="Step forward 15 minutes"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Time Steps (Legible & Compact) */}
        <div className="flex items-center justify-between flex-1 max-w-lg px-2 text-slate-500 text-[10px] font-semibold tabular-nums overflow-hidden">
          <span>12:00</span>
          <span>12:30</span>
          <span>13:00</span>
          <span>13:30</span>
          <span>14:00</span>
          <span className="text-red-600 font-bold">14:30</span>
          <span>15:00</span>
          <span className="text-slate-900 font-bold">15:30</span>
          <span className="hidden sm:inline">16:00</span>
          <span className="hidden md:inline">16:30</span>
        </div>

        {/* Playback Speed Multipliers & Delta */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center bg-slate-100 rounded p-0.5 border border-slate-200/80">
            {([1, 2, 5] as const).map((spd) => (
              <button
                key={spd}
                onClick={() => onChangeSpeed(spd)}
                className={cn(
                  'px-1.5 py-0.5 rounded text-[10px] font-bold transition-all',
                  playbackSpeed === spd
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                )}
                aria-label={`${spd}x playback speed`}
              >
                {spd}x
              </button>
            ))}
          </div>
          <span className="text-xs font-bold tabular-nums text-slate-900 min-w-[36px] text-right">
            T+04m
          </span>
        </div>
      </div>
    </div>
  );
}
