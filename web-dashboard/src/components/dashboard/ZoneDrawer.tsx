'use client';

import React from 'react';
import Link from 'next/link';
import {
  X,
  CheckCircle,
  Building2,
  Users,
  Compass,
  Maximize2,
  Timer,
  AlertTriangle,
  Hospital,
  Flame,
  Home,
  ShieldCheck,
  Send,
  ExternalLink,
} from 'lucide-react';
import type { ZoneData } from '@/types/dashboard';
import { RiskBadge } from '@/components/ui/risk-badge';
import { WhyPanel } from '@/components/dashboard/WhyPanel';
import { cn } from '@/lib/utils';
import type { AcknowledgmentState } from '@/hooks/useFloodDashboard';

interface ZoneDrawerProps {
  zone: ZoneData;
  allZones: ZoneData[];
  onSelectZone: (zoneId: string) => void;
  onClose: () => void;
  countdownMinutes: number | null;
  acknowledgment: AcknowledgmentState;
  onAcknowledge: () => void;
  onAssignAction: (actionId: string, team?: string) => void;
  actionsState: Record<string, { status: string; team?: string; timestamp?: string }>;
  className?: string;
}

export function ZoneDrawer({
  zone,
  allZones,
  onSelectZone,
  onClose,
  countdownMinutes,
  acknowledgment,
  onAcknowledge,
  onAssignAction,
  actionsState,
  className,
}: ZoneDrawerProps) {
  // Top 3 priority zones for the switcher strip
  const topPriorityZones = allZones.filter((z) => z.rank <= 3);

  return (
    <aside
      className={cn(
        'w-full xl:w-[420px] 2xl:w-[440px] shrink-0 bg-white border border-slate-200/90 rounded-lg shadow-xs flex flex-col max-h-[calc(100vh-140px)] select-none overflow-hidden transition-all',
        className
      )}
      aria-label="Zone Detail Drawer"
    >
      {/* 1. HEADER (Fixed at top of drawer) */}
      <div className="p-3.5 pb-2.5 border-b border-slate-200 bg-white flex flex-col gap-1.5 shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base lg:text-lg font-bold text-slate-900 tracking-tight truncate">
                {zone.name} · {zone.locality}
              </h2>
              <RiskBadge level={zone.severity} size="sm" />
            </div>
            <span className="text-xs text-slate-500 font-normal mt-0.5">
              {zone.ward}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900 transition-colors"
            title="Close Drawer (Esc)"
            aria-label="Close Zone Details Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. COUNTDOWN LINE (Computed dynamically from timeline) */}
        <div className="flex items-center gap-2 pt-0.5">
          <Timer className="w-4 h-4 text-red-600 animate-pulse shrink-0" aria-hidden="true" />
          <span className="text-xs font-bold text-red-600">
            {countdownMinutes !== null
              ? countdownMinutes === 0
                ? 'Onset imminent (NOW)'
                : `Onset in ${countdownMinutes} min`
              : 'Onset time pending'}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            · Predicted peak at {zone.peak} ({zone.peakDepth})
          </span>
        </div>

        {/* 3. RANKED SWITCHER STRIP */}
        <div className="flex items-center gap-1 border-t border-slate-100 pt-2 mt-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mr-1">
            Priority:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {topPriorityZones.map((pz) => {
              const isSelected = pz.id === zone.id;
              return (
                <button
                  key={pz.id}
                  onClick={() => onSelectZone(pz.id)}
                  className={cn(
                    'px-2 py-0.5 rounded text-xs font-medium transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-slate-900',
                    isSelected
                      ? 'bg-slate-900 text-white font-bold shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  )}
                  aria-pressed={isSelected}
                >
                  #{pz.rank} {pz.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. PINNED STICKY ACTION BAR (Always visible without scrolling drawer!) */}
      <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 shrink-0 space-y-1.5 shadow-2xs z-10">
        <div className="flex items-center gap-2">
          {/* Primary Action: Acknowledge */}
          {acknowledgment.acknowledged ? (
            <div className="flex-1 flex items-center justify-center gap-1.5 h-8 px-3 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>
                Acknowledged by {acknowledgment.dutyOfficer} · {acknowledgment.time}
              </span>
            </div>
          ) : (
            <button
              onClick={onAcknowledge}
              className="flex-1 flex items-center justify-center gap-1.5 h-8 px-3 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-slate-900"
              title="Acknowledge alert status for this zone (Press A)"
            >
              <CheckCircle className="w-3.5 h-3.5 text-sky-400" />
              <span>Acknowledge (A)</span>
            </button>
          )}

          {/* Secondary Action: Assign Team */}
          <button
            onClick={() => onAssignAction('act-1', 'Team 1')}
            className="flex items-center justify-center gap-1.5 h-8 px-3 rounded-md bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold transition-colors focus-visible:ring-2 focus-visible:ring-slate-900"
            title="Assign emergency response team"
          >
            <Send className="w-3.5 h-3.5 text-slate-500" />
            <span>Assign Team</span>
          </button>

          {/* Tertiary Action: Open Full Zone View */}
          <Link
            href="/zones"
            className="flex items-center justify-center w-8 h-8 rounded-md bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors focus-visible:ring-2 focus-visible:ring-slate-900 shrink-0"
            title="Open Full Zone Directory"
            aria-label="Open Full Zone Directory"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* SCROLLABLE DRAWER BODY */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
        {/* 5. PREDICTION CARD (All values in navy #0F172A) */}
        <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-200/90 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] text-slate-500 font-medium">
                {zone.probability !== null ? 'Flood probability' : 'Model solver'}
              </span>
              <span className="text-base font-bold text-slate-900 mt-0.5">
                {zone.probability !== null ? `${zone.probability}%` : 'SFINCS Physics'}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="flex flex-col">
              <span className="text-[11px] text-slate-500 font-medium">
                Expected depth
              </span>
              <span className="text-xl font-bold tabular-nums text-slate-900 mt-0.5">
                {zone.depth}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-medium">Onset:</span>
              <span className="font-bold tabular-nums text-slate-900">{zone.onset}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-medium">Peak:</span>
              <span className="font-bold tabular-nums text-slate-900">{zone.peak}</span>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
            <span>SFINCS v2.4.2 (Hydrodynamic)</span>
            <span>Deterministic Physical Forecast</span>
          </div>
        </div>

        {/* 6. WHY IS THIS CRITICAL? SECTION */}
        <WhyPanel
          factors={zone.factors}
          explanation={zone.summaryExplanation}
        />

        {/* 7. IMPACT CARDS (labeled estimated/exposed) */}
        <div className="space-y-1.5 pt-1 border-t border-slate-200">
          <div className="text-xs text-slate-900 font-bold uppercase tracking-wider">
            Estimated Impact
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-50 p-2 rounded-md border border-slate-200/70 flex flex-col">
              <span className="text-[11px] text-slate-500 font-medium">Buildings exposed</span>
              <span className="text-base font-bold tabular-nums text-slate-900 mt-0.5">
                {zone.buildingsExposed.toLocaleString()}
              </span>
            </div>
            <div className="bg-slate-50 p-2 rounded-md border border-slate-200/70 flex flex-col">
              <span className="text-[11px] text-slate-500 font-medium">Roads affected</span>
              <span className="text-base font-bold tabular-nums text-slate-900 mt-0.5">
                {zone.roadsAffectedKm} km
              </span>
            </div>
            <div className="bg-slate-50 p-2 rounded-md border border-slate-200/70 flex flex-col">
              <span className="text-[11px] text-slate-500 font-medium">Facilities at risk</span>
              <span className="text-base font-bold tabular-nums text-slate-900 mt-0.5">
                {zone.facilitiesCount}
              </span>
            </div>
            <div className="bg-slate-50 p-2 rounded-md border border-slate-200/70 flex flex-col">
              <span className="text-[11px] text-slate-500 font-medium">Population exposed</span>
              <span className="text-base font-bold tabular-nums text-slate-900 mt-0.5">
                {zone.population.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* 8. CRITICAL FACILITIES LIST FOR THIS ZONE */}
        {zone.facilities.length > 0 && (
          <div className="space-y-2 pt-1 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-900 font-bold uppercase tracking-wider">
                Facilities in {zone.name} ({zone.facilities.length})
              </span>
              <span className="text-[10px] font-bold text-slate-500">Triage Active</span>
            </div>
            <div className="space-y-1.5">
              {zone.facilities.map((fac) => {
                const isCritical = fac.severity === 'CRITICAL';
                return (
                  <div
                    key={fac.id}
                    className={cn(
                      'p-2.5 rounded-md border flex flex-col gap-1 transition-colors',
                      isCritical
                        ? 'bg-red-500/5 border-red-500/30'
                        : 'bg-slate-50 border-slate-200'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        {fac.category === 'hospital' ? (
                          <Hospital className={cn('w-3.5 h-3.5', isCritical ? 'text-red-600' : 'text-slate-500')} />
                        ) : fac.category === 'fire' ? (
                          <Flame className="w-3.5 h-3.5 text-orange-600" />
                        ) : (
                          <Home className="w-3.5 h-3.5 text-slate-500" />
                        )}
                        {fac.name}
                      </span>
                      <RiskBadge level={fac.severity} size="sm" />
                    </div>
                    <div className="text-[11px] text-slate-600 flex items-center justify-between">
                      <span>
                        Depth: <strong className="text-slate-900 font-bold">{fac.depth}</strong>
                      </span>
                      <span>
                        Onset: <strong className="text-slate-900 font-bold">{fac.onset}</strong>
                      </span>
                    </div>
                    {fac.warningNote && (
                      <div className="text-[11px] text-red-700 font-medium flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="w-3 h-3 shrink-0 text-red-600" />
                        <span>{fac.warningNote}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 9. SUGGESTED RESPONDER ACTIONS WITH ASSIGN BUTTONS */}
        <div className="space-y-2 pt-1 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-900 font-bold uppercase tracking-wider">
              Suggested Responder Actions
            </span>
            <span className="text-[10px] text-slate-500 font-medium">1 of 3 Done</span>
          </div>

          <div className="space-y-1.5 text-xs">
            {zone.actions.map((action) => {
              const liveState = actionsState[action.id] || { status: action.status };
              const isDone = liveState.status === 'dispatched' || liveState.status === 'done';

              return (
                <div
                  key={action.id}
                  className="p-2 bg-slate-50 border border-slate-200/80 rounded-md flex items-start gap-2"
                >
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => onAssignAction(action.id, 'Team 1')}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 shrink-0"
                    aria-label={`Mark action done: ${action.title}`}
                  />
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={cn(
                          'text-xs font-semibold leading-tight',
                          isDone ? 'line-through text-slate-400' : 'text-slate-900'
                        )}
                      >
                        {action.title}
                      </span>
                      {!isDone && (
                        <button
                          onClick={() => onAssignAction(action.id, 'Team 1')}
                          className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-semibold shrink-0 transition-colors"
                        >
                          Assign
                        </button>
                      )}
                    </div>
                    <span className="text-slate-500 text-[10px] font-medium mt-0.5">
                      {isDone
                        ? `Assigned to ${liveState.team || action.team || 'Team'} · In progress`
                        : `Priority: ${action.priority || 'Normal'} · Unassigned`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
