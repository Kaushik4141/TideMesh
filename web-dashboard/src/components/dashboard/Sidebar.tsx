'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Bell,
  Grid,
  Hospital,
  Sliders,
  ChevronDown,
  ChevronRight,
  Siren,
  Route,
  Radio,
  FileText,
  PhoneCall,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import type {
  EventEnvironmentResponse,
  DashboardMode,
  CurrentConditions,
  ScenarioParameters,
} from '@/lib/api/types';

interface SidebarProps {
  environmentalData?: EventEnvironmentResponse['eventEnvironment'] | null;
  activeMode?: DashboardMode;
  currentConditions?: CurrentConditions;
  scenarioParams?: ScenarioParameters;
  onOpenScenario?: () => void;
}

export function Sidebar({
  environmentalData,
  activeMode = 'LIVE_FORECAST',
  currentConditions,
  scenarioParams,
  onOpenScenario,
}: SidebarProps = {}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [engineOpen, setEngineOpen] = useState(false);

  const primaryNav = [
    { name: 'Overview', href: '/', icon: LayoutDashboard },
    { name: 'Alerts', href: '/#alerts', icon: Bell, badge: '3', badgeColor: 'bg-red-500/10 text-red-700 border-red-500/20' },
    { name: 'Zones', href: '/zones', icon: Grid },
    { name: 'Critical Facilities', href: '/critical-facilities', icon: Hospital },
    { name: 'Scenarios', href: '#scenarios', icon: Sliders, onClick: onOpenScenario },
  ];

  const moreNav = [
    { name: 'Response & Actions', href: '#actions', icon: Siren, badge: '3 Pending', badgeColor: 'bg-red-500/10 text-red-700 border-red-500/20' },
    { name: 'Evacuation Routes', href: '#routes', icon: Route },
    { name: 'Sensor Telemetry', href: '#telemetry', icon: Radio },
    { name: 'Reports & Briefings', href: '#reports', icon: FileText },
    { name: 'Degraded Mode (SOP Drill)', href: '/degraded-state', icon: Activity },
  ];

  return (
    <aside className="fixed left-0 top-14 bottom-0 w-[220px] lg:w-[232px] bg-white border-r border-slate-200 z-30 flex flex-col justify-between select-none shadow-xs">
      {/* Navigation Scroll Area */}
      <div className="flex flex-col pt-3 overflow-y-auto px-2 space-y-4">
        {/* Primary Navigation Group */}
        <div className="space-y-0.5">
          <div className="px-3 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Operational
          </div>
          {primaryNav.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            const content = (
              <>
                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={cn(
                      'w-4 h-4 shrink-0 transition-colors',
                      isActive ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-900'
                    )}
                  />
                  <span className="truncate">{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      'px-1.5 py-0.2 rounded text-[10px] font-bold border shrink-0',
                      item.badgeColor
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </>
            );

            if (item.onClick) {
              return (
                <button
                  key={item.name}
                  onClick={item.onClick}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors text-xs font-semibold group text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-l-4 border-transparent text-left"
                >
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-md transition-colors text-xs font-semibold group',
                  isActive
                    ? 'bg-slate-100 text-slate-900 border-l-4 border-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-l-4 border-transparent'
                )}
              >
                {content}
              </Link>
            );
          })}
        </div>

        {/* Collapsible 'More' Group */}
        <div className="space-y-0.5 pt-1 border-t border-slate-100">
          <button
            onClick={() => setMoreOpen((prev) => !prev)}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-md text-[11px] font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-50 uppercase tracking-wider transition-colors"
            aria-expanded={moreOpen}
          >
            <span>Additional Tools</span>
            {moreOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {moreOpen && (
            <div className="space-y-0.5 pl-1 pt-1 animate-in fade-in-50 duration-150">
              {moreNav.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 rounded-md transition-colors text-xs font-medium group',
                      isActive
                        ? 'bg-slate-100 text-slate-900 font-bold border-l-2 border-slate-900'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-slate-700" />
                      <span className="truncate">{item.name}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={cn(
                          'px-1.5 py-0.2 rounded text-[10px] font-bold border shrink-0',
                          item.badgeColor
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer Area: Data Engine & Hotline */}
      <div className="p-2 border-t border-slate-200 bg-slate-50/70 space-y-2">
        {/* Compact DATA ENGINE (Collapsed by default with ONLINE status dot) */}
        <div className="rounded-md border border-slate-200 bg-white p-2 text-xs shadow-2xs">
          <button
            onClick={() => setEngineOpen((prev) => !prev)}
            className="w-full flex items-center justify-between text-left focus:outline-none"
            aria-expanded={engineOpen}
          >
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
              </span>
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Telemetry
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
              <span>ONLINE</span>
              {engineOpen ? (
                <ChevronDown className="w-3 h-3 text-slate-400" />
              ) : (
                <ChevronRight className="w-3 h-3 text-slate-400" />
              )}
            </div>
          </button>

          {engineOpen && (
            <div className="mt-2 pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-600 animate-in fade-in-50">
              {activeMode === 'LIVE_FORECAST' ? (
                <>
                  <div className="flex justify-between">
                    <span>Source:</span>
                    <span className="font-bold text-slate-900 truncate max-w-[110px]" title="Open-Meteo High-Resolution Forecast">
                      Open-Meteo Live
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Live Rain:</span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {currentConditions?.rainfallMmHr != null
                        ? `${currentConditions.rainfallMmHr} mm/hr`
                        : '4.2 mm/hr'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Surge / Tide:</span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      +{currentConditions?.tideSurgeM != null
                        ? `${currentConditions.tideSurgeM} m`
                        : '0.82 m'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wind Speed:</span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {currentConditions?.windSpeedKmh != null
                        ? `${currentConditions.windSpeedKmh} km/h`
                        : '18.5 km/h'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hydro Model:</span>
                    <span className="font-bold text-emerald-700">SFINCS 0–6h</span>
                  </div>
                </>
              ) : activeMode === 'HISTORICAL_REPLAY' ? (
                <>
                  <div className="flex justify-between">
                    <span>Benchmark:</span>
                    <span className="font-bold text-blue-900">May 2018 Mekunu</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Peak Rainfall:</span>
                    <span className="font-bold text-slate-900 tabular-nums">75.0 mm/hr</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Peak Surge:</span>
                    <span className="font-bold text-slate-900 tabular-nums">0.85 m MSL</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hydro Model:</span>
                    <span className="font-bold text-blue-700">SFINCS Hindcast</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span>Stress Mode:</span>
                    <span className="font-bold text-amber-900">Hypothetical</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cloudburst:</span>
                    <span className="font-bold text-amber-800 tabular-nums">
                      {scenarioParams?.rainfallRateMmHr ?? 110} mm/hr
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Peak Surge:</span>
                    <span className="font-bold text-teal-800 tabular-nums">
                      +{scenarioParams?.surgeLevelM?.toFixed(2) ?? '2.80'} m
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hydro Model:</span>
                    <span className="font-bold text-amber-700">SFINCS Contingency</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* EOC Hotline button styled as tel:1077 link */}
        <a
          href="tel:1077"
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-slate-900"
          title="Call District Disaster Management Control Room (1077)"
        >
          <PhoneCall className="w-3.5 h-3.5 text-sky-400" />
          <span>EOC Hotline: 1077</span>
        </a>
      </div>
    </aside>
  );
}
