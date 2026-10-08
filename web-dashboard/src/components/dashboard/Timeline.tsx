'use client';

import React from 'react';
import { RotateCcw, RotateCw, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineProps {
  currentTime: string;
  availableTimestamps?: string[];
  onSelectTime?: (time: string) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStepForward?: () => void;
  onStepBackward?: () => void;
  playbackSpeed: 1 | 2 | 5;
  onChangeSpeed: (speed: 1 | 2 | 5) => void;
  className?: string;
}

export function Timeline({
  currentTime,
  availableTimestamps = ['14:00', '14:15', '14:30', '14:45', '15:00', '15:15', '15:30', '15:45', '16:00'],
  onSelectTime,
  isPlaying,
  onTogglePlay,
  onStepForward,
  onStepBackward,
  playbackSpeed,
  onChangeSpeed,
  className,
}: TimelineProps) {
  const currentIndex = availableTimestamps.indexOf(currentTime);
  const progressPct =
    currentIndex >= 0 && availableTimestamps.length > 1
      ? (currentIndex / (availableTimestamps.length - 1)) * 100
      : 50;

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
            d="M 240,22 Q 400,16 520,5 L 520,32 L 240,32 Z"
            fill="#FEE2E2"
            opacity="0.45"
          />
        </svg>

        {/* Base Progress Rail with Click-to-Seek */}
        <div
          className="w-full h-2 bg-slate-200 rounded-full relative z-0 flex items-center cursor-pointer group"
          onClick={(e) => {
            if (!onSelectTime || availableTimestamps.length <= 1) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const ratio = Math.max(0, Math.min(1, clickX / rect.width));
            const targetIdx = Math.round(ratio * (availableTimestamps.length - 1));
            onSelectTime(availableTimestamps[targetIdx]);
          }}
          title="Click to seek timeline"
        >
          <div
            className="h-full bg-slate-600 rounded-full transition-all duration-200 group-hover:bg-teal-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Interactive Scrub Dots */}
        <div className="absolute inset-x-1 flex justify-between items-center pointer-events-none">
          {availableTimestamps.map((t) => {
            const isCurrent = t === currentTime;
            const isOnset = t === '14:30';
            const isPeak = t === '15:15' || t === '15:00';

            return (
              <button
                key={t}
                type="button"
                onClick={() => onSelectTime && onSelectTime(t)}
                className={cn(
                  'pointer-events-auto w-3 h-3 rounded-full border-2 transition-all cursor-pointer -translate-y-0.5',
                  isCurrent
                    ? 'w-4 h-4 bg-teal-700 border-white shadow-md ring-2 ring-teal-700 -translate-y-1'
                    : isOnset
                    ? 'bg-red-500 border-white'
                    : isPeak
                    ? 'bg-slate-800 border-white'
                    : 'bg-slate-300 border-white hover:bg-slate-500'
                )}
                title={`Jump to ${t}`}
                aria-label={`Time ${t}`}
              />
            );
          })}
        </div>

        {/* Marker 1: Current Time Badge */}
        <div
          className="absolute -top-1.5 flex flex-col items-center z-20 -translate-x-1/2 pointer-events-none transition-all duration-300"
          style={{ left: `${Math.max(8, Math.min(progressPct, 92))}%` }}
        >
          <span className="bg-teal-700 text-white px-1.5 py-0.2 rounded text-[10px] font-bold shadow-xs whitespace-nowrap">
            NOW {currentTime}
          </span>
          <div className="w-0.5 h-4 bg-teal-700 mt-0.5" />
        </div>
      </div>

      {/* Control Strip & Timestep Pills */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100 gap-2">
        {/* Playback Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onStepBackward}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900 transition-colors cursor-pointer"
            title="Step back 15 mins (Left Arrow)"
            aria-label="Step back 15 minutes"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onTogglePlay}
            className={cn(
              "w-6 h-6 flex items-center justify-center rounded focus-visible:ring-2 focus-visible:ring-slate-900 shadow-2xs transition-all cursor-pointer",
              isPlaying
                ? "bg-teal-700 text-white ring-2 ring-teal-500/60 shadow-teal-700/20"
                : "bg-slate-900 text-white hover:bg-slate-800"
            )}
            title={isPlaying ? 'Pause timeline (Space)' : 'Play simulation (Space)'}
            aria-label={isPlaying ? 'Pause simulation' : 'Play simulation'}
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 translate-x-0.5 fill-current" />
            )}
          </button>
          <button
            type="button"
            onClick={onStepForward}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900 transition-colors cursor-pointer"
            title="Step forward 15 mins (Right Arrow)"
            aria-label="Step forward 15 minutes"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Timestep Clickable Buttons */}
        <div className="hidden sm:flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {availableTimestamps.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onSelectTime && onSelectTime(t)}
              className={cn(
                'px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer',
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

        {/* Speed Controls */}
        <div className="flex items-center gap-0.5 shrink-0 bg-slate-100 rounded p-0.5">
          {([1, 2, 5] as const).map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => onChangeSpeed(spd)}
              className={cn(
                'px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer',
                playbackSpeed === spd
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-900'
              )}
              title={`${spd}x Speed`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
