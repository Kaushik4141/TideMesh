'use client';

import React from 'react';
import { Shield, Droplets, Building2, Bell, User, Keyboard } from 'lucide-react';

interface TopHeaderProps {
  onOpenShortcuts?: () => void;
}

export function TopHeader({ onOpenShortcuts }: TopHeaderProps) {
  const eventTitle = 'Coastal Flood Event — Mangaluru Coast';

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 z-40 flex items-center justify-between px-4 lg:px-6 whitespace-nowrap select-none shadow-xs">
      {/* Left: Brand & Event */}
      <div className="flex items-center gap-3 lg:gap-4 min-w-0 flex-shrink">
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-sky-400 flex items-center justify-center shadow-xs">
            <Shield className="w-5 h-5 text-sky-400" aria-hidden="true" />
          </div>
          <span className="text-base lg:text-lg font-bold text-slate-900 tracking-tight whitespace-nowrap">
            CoastShield AI
          </span>
        </div>

        <div className="h-4 w-px bg-slate-200 shrink-0 hidden sm:block" />

        {/* Event name with truncate + title tooltip */}
        <div
          className="hidden sm:flex items-center gap-1.5 min-w-0 text-slate-700 font-semibold text-xs lg:text-sm cursor-default"
          title={eventTitle}
        >
          <Droplets className="w-4 h-4 text-blue-700 shrink-0" aria-hidden="true" />
          <span className="truncate max-w-[200px] md:max-w-[280px] lg:max-w-md xl:max-w-lg">
            {eventTitle}
          </span>
        </div>
      </div>

      {/* Center: Status Chips */}
      <div className="flex items-center gap-2 lg:gap-3 shrink-0">
        {/* LIVE Chip */}
        <div
          className="flex items-center gap-1.5 bg-slate-100/90 border border-slate-200/80 px-2.5 py-1 rounded-md text-[11px] lg:text-xs font-semibold text-slate-700 whitespace-nowrap"
          title="Telemetry feed status and time"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
          </span>
          <span className="font-bold tracking-wide">LIVE · 14:26</span>
        </div>

        {/* EOC Chip */}
        <div
          className="flex items-center gap-1.5 bg-slate-100/90 border border-slate-200/80 px-2.5 py-1 rounded-md text-[11px] lg:text-xs font-semibold text-slate-700 whitespace-nowrap"
          title="Emergency Operations Center activation tier"
        >
          <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
          <span className="font-bold">EOC: Full Activation</span>
        </div>
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
            <kbd className="px-1 py-0.2 bg-slate-200/80 rounded text-[9px] font-mono text-slate-700">?</kbd>
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
            <span className="text-[10px] text-slate-500 font-medium">Duty Officer · Shift 1</span>
          </div>
          <div
            className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-xs select-none"
            title="R. Shetty (Duty Officer)"
          >
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  );
}
