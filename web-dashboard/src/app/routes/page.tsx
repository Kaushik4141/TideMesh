'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Route as RouteIcon,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Shield,
  Hospital,
  MapPin,
  ExternalLink,
  Info,
} from 'lucide-react';
import { TopHeader } from '@/components/dashboard/TopHeader';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DEMO_ROADS } from '@/data/demoFloodEvent';
import { cn } from '@/lib/utils';

interface EvacuationRoute {
  id: string;
  name: string;
  primaryZone: string;
  status: 'OPEN' | 'AT_RISK' | 'CLOSED_SUBMERGED';
  expectedInundationTime: string;
  maxPredictedDepth: string;
  clearanceWindow: string;
  destinationShelter: string;
  alternativeRoute: string;
  recommendation: string;
}

const EVACUATION_ROUTES: EvacuationRoute[] = [
  {
    id: 'route-b-north',
    name: 'Panambur Coastal Corridor → NH 66 Northbound',
    primaryZone: 'Zone B (Panambur Coast)',
    status: 'AT_RISK',
    expectedInundationTime: '14:30',
    maxPredictedDepth: '0.62 m',
    clearanceWindow: '14 min remaining',
    destinationShelter: 'Govt. Higher Primary School (Shelter #4)',
    alternativeRoute: 'Kulur Ferry Road Bypass via Surathkal Junction',
    recommendation: 'Divert heavy civilian traffic immediately; dispatch police to barricade low road culvert.',
  },
  {
    id: 'route-h1-access',
    name: 'District Hospital H1 Emergency Spur Road',
    primaryZone: 'Zone B',
    status: 'CLOSED_SUBMERGED',
    expectedInundationTime: '14:26 (NOW)',
    maxPredictedDepth: '0.71 m',
    clearanceWindow: 'Submerged',
    destinationShelter: 'District Hospital H1 Critical Access',
    alternativeRoute: 'Elevated Western Approach Ramp (Clear)',
    recommendation: 'Emergency vehicles must use elevated ramp. Low spur is impassable for standard ambulances.',
  },
  {
    id: 'route-f-spit',
    name: 'Bengre Peninsula South Shore Road',
    primaryZone: 'Zone F (Tannirbhavi)',
    status: 'AT_RISK',
    expectedInundationTime: '14:45',
    maxPredictedDepth: '0.51 m',
    clearanceWindow: '19 min remaining',
    destinationShelter: 'Bengre Fishermen Community Shelter',
    alternativeRoute: 'Gurupura River Ferry Linkage (Elevated Quay)',
    recommendation: 'High wave runup expected. Advise residents to proceed inland before 14:45.',
  },
  {
    id: 'route-c-arterial',
    name: 'Surathkal Beach Road to Outer Ring Bypass',
    primaryZone: 'Zone C (Surathkal Beach)',
    status: 'OPEN',
    expectedInundationTime: '15:20',
    maxPredictedDepth: '0.18 m',
    clearanceWindow: '54 min remaining',
    destinationShelter: 'Surathkal Community Health Centre',
    alternativeRoute: 'Direct NH 66 link (Clear)',
    recommendation: 'Normal vehicular passage maintained. Portable pump deployed at culvert outfall.',
  },
];

export default function EvacuationRoutesPage() {
  const [filter, setFilter] = useState<'all' | 'open' | 'at_risk' | 'closed'>('all');

  const filteredRoutes = EVACUATION_ROUTES.filter((r) => {
    if (filter === 'open' && r.status !== 'OPEN') return false;
    if (filter === 'at_risk' && r.status !== 'AT_RISK') return false;
    if (filter === 'closed' && r.status !== 'CLOSED_SUBMERGED') return false;
    return true;
  });

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-100 flex flex-col font-sans antialiased text-slate-900 select-none">
      <TopHeader />

      <div className="flex flex-1 pt-14 overflow-hidden">
        <Sidebar />

        <main className="flex-1 ml-[220px] lg:ml-[232px] p-4 lg:p-6 overflow-y-auto space-y-5 bg-slate-50">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-sky-100 text-sky-800 rounded-lg">
                  <RouteIcon className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Evacuation Routes & Safe Corridors
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Real-time inundation modeling for arterial access corridors, hospital spurs, and designated shelter routes.
              </p>
            </div>

            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors self-start md:self-auto"
            >
              <span>Back to Overview</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Quick Route Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs border-l-4 border-l-red-600">
              <span className="text-xs font-medium text-slate-500">Submerged / Impassable</span>
              <div className="text-2xl font-bold text-red-600 mt-1 tabular-nums">1 Corridor</div>
              <span className="text-[11px] text-slate-500">Hospital H1 Low Spur Road</span>
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs border-l-4 border-l-amber-500">
              <span className="text-xs font-medium text-slate-500">Imminent Risk (&lt; 20 min)</span>
              <div className="text-2xl font-bold text-amber-700 mt-1 tabular-nums">2 Corridors</div>
              <span className="text-[11px] text-slate-500">Zone B Road R12 · Bengre Spit</span>
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs border-l-4 border-l-emerald-600">
              <span className="text-xs font-medium text-slate-500">Clear Evacuation Routes</span>
              <div className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">4 Corridors</div>
              <span className="text-[11px] text-slate-500">NH 66 Elevated Bypass Active</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-2 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 mr-2">Filter Status:</span>
            {(['all', 'open', 'at_risk', 'closed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-semibold transition-colors capitalize',
                  filter === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {st === 'at_risk' ? 'At Risk' : st === 'closed' ? 'Submerged' : st}
              </button>
            ))}
          </div>

          {/* Corridors Grid */}
          <div className="space-y-3">
            {filteredRoutes.map((route) => {
              const isClosed = route.status === 'CLOSED_SUBMERGED';
              const isAtRisk = route.status === 'AT_RISK';

              return (
                <div
                  key={route.id}
                  className={cn(
                    'bg-white p-4 rounded-xl border transition-all space-y-3 shadow-2xs',
                    isClosed
                      ? 'border-red-300 bg-red-50/20'
                      : isAtRisk
                      ? 'border-amber-300 bg-amber-50/20'
                      : 'border-slate-200'
                  )}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'w-2.5 h-2.5 rounded-full shrink-0',
                          isClosed
                            ? 'bg-red-600 animate-pulse'
                            : isAtRisk
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        )}
                      />
                      <h3 className="text-sm font-bold text-slate-900">{route.name}</h3>
                      <span className="text-xs text-slate-500 font-medium">({route.primaryZone})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-xs font-bold border',
                          isClosed
                            ? 'bg-red-100 text-red-800 border-red-200'
                            : isAtRisk
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        )}
                      >
                        {isClosed ? 'SUBMERGED' : isAtRisk ? 'AT RISK' : 'OPEN'}
                      </span>

                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {route.clearanceWindow}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                        Expected Inundation & Depth
                      </span>
                      <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                        Onset: {route.expectedInundationTime} · Depth: {route.maxPredictedDepth}
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                        Destination Shelter
                      </span>
                      <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                        {route.destinationShelter}
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                        Recommended Bypass Corridor
                      </span>
                      <span className="font-bold text-blue-700 text-xs mt-0.5 block">
                        {route.alternativeRoute}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Info className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{route.recommendation}</span>
                    </div>

                    <Link
                      href="/?zone=B"
                      className="text-xs font-bold text-slate-900 hover:underline flex items-center gap-1 shrink-0 ml-3"
                    >
                      <span>Inspect Route</span>
                      <span>&rarr;</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
