'use client';

import React, { useState } from 'react';
import {
  Plus,
  Minus,
  Layers,
  LocateFixed,
  Hospital,
  Flame,
  Home,
  ShieldCheck,
  Zap,
  OctagonAlert,
  TriangleAlert,
  AlertCircle,
} from 'lucide-react';
import type { ZoneData, CriticalFacility } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface FloodMapProps {
  zones: ZoneData[];
  selectedZoneId: string;
  onSelectZone: (zoneId: string) => void;
  facilities: CriticalFacility[];
  className?: string;
}

export function FloodMap({
  zones,
  selectedZoneId,
  onSelectZone,
  facilities,
  className,
}: FloodMapProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showContours, setShowContours] = useState<boolean>(true);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  const [hoveredFacility, setHoveredFacility] = useState<CriticalFacility | null>(null);

  const selectedZone = zones.find((z) => z.id === selectedZoneId);

  return (
    <div
      className={cn(
        'relative w-full h-[380px] lg:h-[430px] xl:h-[480px] bg-slate-100 rounded-lg overflow-hidden flex flex-col justify-between shadow-xs select-none border border-slate-200/90',
        className
      )}
    >
      {/* SVG Map Canvas */}
      <svg
        className="absolute inset-0 w-full h-full object-cover"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 960 580"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Critical Diagonal Hatch Pattern ONLY for CRITICAL zones */}
          <pattern
            id="criticalHatchRefined"
            patternUnits="userSpaceOnUse"
            width="10"
            height="10"
            patternTransform="rotate(45 0 0)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="10"
              stroke="#DC2626"
              strokeWidth="2.5"
              opacity="0.35"
            />
          </pattern>

          {/* Subtle Coastal Grid */}
          <pattern
            id="coastalGridRefined"
            patternUnits="userSpaceOnUse"
            width="40"
            height="40"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="#CBD5E1"
              strokeWidth="0.5"
              opacity="0.5"
            />
          </pattern>

          {/* White halo filter for zone labels */}
          <filter id="whiteHalo" x="-20%" y="-20%" width="140%" height="140%">
            <feMorphology in="SourceAlpha" result="DILATED" operator="dilate" radius="2" />
            <feFlood floodColor="#FFFFFF" floodOpacity="1" result="WHITE" />
            <feComposite in="WHITE" in2="DILATED" operator="in" result="OUTLINE" />
            <feMerge>
              <feMergeNode in="OUTLINE" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Base Landmass & Grid */}
        <rect width="960" height="580" fill="#F8FAFC" />
        <rect width="960" height="580" fill="url(#coastalGridRefined)" />

        {/* 2. Water Bodies (Arabian Sea & Estuaries) */}
        <path
          d="M 0,0 L 260,0 C 255,90 270,160 250,240 C 235,300 240,360 215,440 C 190,520 180,580 180,580 L 0,580 Z"
          fill="#E0F2FE"
        />
        <path
          d="M 260,0 C 255,90 270,160 250,240 C 235,300 240,360 215,440 C 190,520 180,580 180,580"
          fill="none"
          stroke="#7DD3FC"
          strokeWidth="2"
        />

        {/* Gurupura River Estuary */}
        <path
          d="M 250,185 C 310,180 380,210 450,195 C 520,180 610,215 670,190 L 675,208 C 610,230 525,198 450,212 C 380,228 310,198 248,202 Z"
          fill="#E0F2FE"
          stroke="#7DD3FC"
          strokeWidth="1.2"
        />

        {/* Netravati River Estuary */}
        <path
          d="M 215,440 C 290,430 380,480 470,470 C 560,460 690,510 760,500 L 760,522 C 690,532 560,482 470,492 C 380,502 290,452 210,462 Z"
          fill="#E0F2FE"
          stroke="#7DD3FC"
          strokeWidth="1.2"
        />

        {/* 3. Road Network (White casing + Slate highway strokes with fill="none" to prevent black artifacts) */}
        <g stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M 275,0 L 285,170 L 360,250 L 375,420 L 320,580" />
          <path d="M 285,170 L 610,140 L 780,160" />
          <path d="M 360,250 L 590,280 L 880,310" />
          <path d="M 375,420 L 620,410 L 850,440" />
          <path d="M 255,80 L 410,95 L 480,180" />
          <path d="M 235,320 L 365,340" />
        </g>
        <g stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M 275,0 L 285,170 L 360,250 L 375,420 L 320,580" />
          <path d="M 285,170 L 610,140 L 780,160" />
          <path d="M 360,250 L 590,280 L 880,310" />
          <path d="M 375,420 L 620,410 L 850,440" />
          <path d="M 255,80 L 410,95 L 480,180" />
          <path d="M 235,320 L 365,340" />
        </g>

        {/* 4. Zone Polygons (Strictly ~30% fills, 1.5px outline, hatch only on CRITICAL) */}

        {/* LOW Risk Zones (Outline only, 1.5px dashed outline, NO dark fill) */}
        {/* Zone D */}
        <polygon
          points="460,50 630,40 650,135 480,150"
          fill="none"
          stroke="#64748B"
          strokeWidth="1.5"
          strokeDasharray="4,4"
          className="cursor-pointer hover:stroke-slate-900 transition-colors"
          onClick={() => onSelectZone('D')}
        />
        {/* Zone E */}
        <polygon
          points="640,40 820,30 840,140 660,135"
          fill="none"
          stroke="#64748B"
          strokeWidth="1.5"
          strokeDasharray="4,4"
          className="cursor-pointer hover:stroke-slate-900 transition-colors"
          onClick={() => onSelectZone('E')}
        />
        {/* Zone G */}
        <polygon
          points="490,225 650,215 670,330 495,310"
          fill="none"
          stroke="#64748B"
          strokeWidth="1.5"
          strokeDasharray="4,4"
          className="cursor-pointer hover:stroke-slate-900 transition-colors"
          onClick={() => onSelectZone('G')}
        />
        {/* Zone I */}
        <polygon
          points="680,210 880,220 890,340 680,330"
          fill="none"
          stroke="#64748B"
          strokeWidth="1.5"
          strokeDasharray="4,4"
          className="cursor-pointer hover:stroke-slate-900 transition-colors"
          onClick={() => onSelectZone('I')}
        />
        {/* Zone J */}
        <polygon
          points="500,340 700,335 690,450 490,440"
          fill="none"
          stroke="#64748B"
          strokeWidth="1.5"
          strokeDasharray="4,4"
          className="cursor-pointer hover:stroke-slate-900 transition-colors"
          onClick={() => onSelectZone('J')}
        />
        {/* Zone K */}
        <polygon
          points="710,345 890,350 880,480 700,460"
          fill="none"
          stroke="#64748B"
          strokeWidth="1.5"
          strokeDasharray="4,4"
          className="cursor-pointer hover:stroke-slate-900 transition-colors"
          onClick={() => onSelectZone('K')}
        />
        {/* Zone L */}
        <polygon
          points="480,510 680,500 670,570 470,570"
          fill="none"
          stroke="#64748B"
          strokeWidth="1.5"
          strokeDasharray="4,4"
          className="cursor-pointer hover:stroke-slate-900 transition-colors"
          onClick={() => onSelectZone('L')}
        />

        {/* ELEVATED Zones (Yellow tint ~25% opacity, 1.5px yellow border) */}
        {/* Zone A */}
        <polygon
          points="260,20 440,30 460,150 280,165"
          fill="rgba(234, 179, 8, 0.25)"
          stroke="#CA8A04"
          strokeWidth={selectedZoneId === 'A' ? 2.5 : 1.5}
          className="cursor-pointer hover:fill-yellow-400/35 transition-colors"
          onClick={() => onSelectZone('A')}
        />
        {/* Zone H */}
        <polygon
          points="370,250 480,230 480,350 365,360"
          fill="rgba(234, 179, 8, 0.25)"
          stroke="#CA8A04"
          strokeWidth={selectedZoneId === 'H' ? 2.5 : 1.5}
          className="cursor-pointer hover:fill-yellow-400/35 transition-colors"
          onClick={() => onSelectZone('H')}
        />

        {/* HIGH Risk Zones (Orange tint ~30% opacity, 1.5px orange border) */}
        {/* Zone C */}
        <polygon
          points="230,270 355,270 360,420 220,425"
          fill="rgba(249, 115, 22, 0.3)"
          stroke="#EA580C"
          strokeWidth={selectedZoneId === 'C' ? 2.5 : 1.5}
          className="cursor-pointer hover:fill-orange-500/40 transition-colors"
          onClick={() => onSelectZone('C')}
        />
        {/* Zone F */}
        <polygon
          points="280,185 450,195 440,245 285,240"
          fill="rgba(249, 115, 22, 0.3)"
          stroke="#EA580C"
          strokeWidth={selectedZoneId === 'F' ? 2.5 : 1.5}
          className="cursor-pointer hover:fill-orange-500/40 transition-colors"
          onClick={() => onSelectZone('F')}
        />

        {/* CRITICAL Zone B (Hatch pattern + ~30% red tint + distinct 2px red border) */}
        <polygon
          points="255,30 420,35 435,175 270,170"
          fill="url(#criticalHatchRefined)"
          className="pointer-events-none"
        />
        <polygon
          points="255,30 420,35 435,175 270,170"
          fill="rgba(220, 38, 38, 0.28)"
          stroke="#DC2626"
          strokeWidth={selectedZoneId === 'B' ? 3 : 2}
          className="cursor-pointer hover:fill-red-600/35 transition-colors"
          onClick={() => onSelectZone('B')}
        />

        {/* 5. Zone Labels (Dark navy #0F172A with white halo + small severity icon) */}
        {/* Zone B (CRITICAL) */}
        <g
          className="cursor-pointer select-none"
          onClick={() => onSelectZone('B')}
        >
          <circle cx="282" cy="50" r="4.5" fill="#DC2626" />
          <text
            x="292"
            y="54"
            fill="#0F172A"
            fontFamily="Inter, sans-serif"
            fontSize="12"
            fontWeight="700"
            filter="url(#whiteHalo)"
          >
            Zone B
          </text>
        </g>

        {/* Zone F (HIGH) */}
        <g
          className="cursor-pointer select-none"
          onClick={() => onSelectZone('F')}
        >
          <circle cx="332" cy="216" r="4" fill="#EA580C" />
          <text
            x="341"
            y="220"
            fill="#0F172A"
            fontFamily="Inter, sans-serif"
            fontSize="12"
            fontWeight="700"
            filter="url(#whiteHalo)"
          >
            Zone F
          </text>
        </g>

        {/* Zone C (HIGH) */}
        <g
          className="cursor-pointer select-none"
          onClick={() => onSelectZone('C')}
        >
          <circle cx="262" cy="346" r="4" fill="#EA580C" />
          <text
            x="271"
            y="350"
            fill="#0F172A"
            fontFamily="Inter, sans-serif"
            fontSize="12"
            fontWeight="700"
            filter="url(#whiteHalo)"
          >
            Zone C
          </text>
        </g>

        {/* Zone H (ELEVATED) */}
        <g
          className="cursor-pointer select-none"
          onClick={() => onSelectZone('H')}
        >
          <circle cx="395" cy="301" r="3.5" fill="#CA8A04" />
          <text
            x="404"
            y="305"
            fill="#0F172A"
            fontFamily="Inter, sans-serif"
            fontSize="12"
            fontWeight="700"
            filter="url(#whiteHalo)"
          >
            Zone H
          </text>
        </g>

        {/* Zone A (ELEVATED) */}
        <g
          className="cursor-pointer select-none"
          onClick={() => onSelectZone('A')}
        >
          <circle cx="340" cy="86" r="3.5" fill="#CA8A04" />
          <text
            x="349"
            y="90"
            fill="#0F172A"
            fontFamily="Inter, sans-serif"
            fontSize="12"
            fontWeight="700"
            filter="url(#whiteHalo)"
          >
            Zone A
          </text>
        </g>

        {/* LOW Zone Labels (No bracketed severity) */}
        <text x="540" y="95" fill="#475569" fontFamily="Inter, sans-serif" fontSize="11" fontWeight="600" filter="url(#whiteHalo)">
          Zone D
        </text>
        <text x="730" y="85" fill="#475569" fontFamily="Inter, sans-serif" fontSize="11" fontWeight="600" filter="url(#whiteHalo)">
          Zone E
        </text>
        <text x="560" y="275" fill="#475569" fontFamily="Inter, sans-serif" fontSize="11" fontWeight="600" filter="url(#whiteHalo)">
          Zone G
        </text>
        <text x="760" y="275" fill="#475569" fontFamily="Inter, sans-serif" fontSize="11" fontWeight="600" filter="url(#whiteHalo)">
          Zone I
        </text>
        <text x="580" y="390" fill="#475569" fontFamily="Inter, sans-serif" fontSize="11" fontWeight="600" filter="url(#whiteHalo)">
          Zone J
        </text>
        <text x="780" y="415" fill="#475569" fontFamily="Inter, sans-serif" fontSize="11" fontWeight="600" filter="url(#whiteHalo)">
          Zone K
        </text>
        <text x="560" y="545" fill="#475569" fontFamily="Inter, sans-serif" fontSize="11" fontWeight="600" filter="url(#whiteHalo)">
          Zone L
        </text>

        {/* 6. Facility Markers (Icon-only by default, NO overlapping text labels) */}
        {facilities.map((fac) => {
          const isSelectedZone = fac.zoneId === selectedZoneId;
          const isCritical = fac.severity === 'CRITICAL';

          return (
            <g
              key={fac.id}
              transform={`translate(${fac.x}, ${fac.y})`}
              className="cursor-pointer transition-transform hover:scale-110"
              onMouseEnter={() => setHoveredFacility(fac)}
              onMouseLeave={() => setHoveredFacility(null)}
              onClick={() => onSelectZone(fac.zoneId)}
            >
              {isCritical && (
                <circle
                  cx="0"
                  cy="0"
                  r="14"
                  fill="#FEE2E2"
                  className="animate-pulse"
                />
              )}
              <circle
                cx="0"
                cy="0"
                r="11"
                fill="#FFFFFF"
                stroke={isCritical ? '#DC2626' : '#0F172A'}
                strokeWidth={isCritical ? 2.5 : 1.5}
                className="shadow-sm"
              />
              {/* Category-specific icon rendering */}
              {fac.category === 'hospital' ? (
                <path
                  d="M 0,-5 L 0,5 M -5,0 L 5,0"
                  stroke={isCritical ? '#DC2626' : '#0F172A'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              ) : fac.category === 'fire' ? (
                <polygon
                  points="0,-5 4,4 -4,4"
                  fill={isCritical ? '#DC2626' : '#EA580C'}
                />
              ) : (
                <circle
                  cx="0"
                  cy="0"
                  r="4"
                  fill={isCritical ? '#DC2626' : '#475569'}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Hover Facility Tooltip (Renders cleanly without obscuring map roads) */}
      {hoveredFacility && (
        <div
          className="absolute z-30 pointer-events-none bg-slate-900/95 text-white px-2.5 py-1.5 rounded shadow-lg text-xs"
          style={{
            left: `${Math.min(Math.max((hoveredFacility.x / 960) * 100, 10), 85)}%`,
            top: `${Math.min((hoveredFacility.y / 580) * 100 + 4, 80)}%`,
          }}
        >
          <div className="font-bold flex items-center gap-1.5">
            <span>{hoveredFacility.name}</span>
            <span
              className={cn(
                'text-[9px] px-1 py-0.2 rounded font-bold uppercase',
                hoveredFacility.severity === 'CRITICAL'
                  ? 'bg-red-600 text-white'
                  : 'bg-orange-500 text-white'
              )}
            >
              {hoveredFacility.severity}
            </span>
          </div>
          <div className="text-[11px] text-slate-300 mt-0.5">
            Zone {hoveredFacility.zoneId} · {hoveredFacility.routeStatus}
          </div>
          {hoveredFacility.warningNote && (
            <div className="text-[10px] text-red-300 mt-0.5 font-medium">
              ⚠ {hoveredFacility.warningNote}
            </div>
          )}
        </div>
      )}

      {/* Floating Selected Zone Indicator (Clean & Minimal) */}
      {selectedZone && (
        <div className="relative m-3 flex items-center gap-2 pointer-events-none z-10">
          <div className="bg-slate-900/95 backdrop-blur-xs text-white px-3 py-1.5 rounded-md shadow-md flex items-center gap-2.5 pointer-events-auto border border-slate-800">
            <div
              className={cn(
                'w-2 h-2 rounded-full shrink-0',
                selectedZone.severity === 'CRITICAL'
                  ? 'bg-red-500 animate-pulse'
                  : selectedZone.severity === 'HIGH'
                  ? 'bg-orange-500'
                  : 'bg-yellow-400'
              )}
            />
            <div className="flex flex-col">
              <span className="text-xs font-bold leading-tight">
                {selectedZone.name} · {selectedZone.locality}
              </span>
              <span className="text-[11px] text-slate-300 leading-tight">
                Onset: {selectedZone.onset} · Depth: {selectedZone.depth}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Map Controls (Top-Right) */}
      <div className="absolute top-3 right-3 flex flex-col gap-1 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-md shadow-xs p-1 z-10">
        <button
          onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2))}
          className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 rounded text-slate-700 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900"
          title="Zoom In"
          aria-label="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
          className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 rounded text-slate-700 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900"
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
        <div className="h-px bg-slate-200 my-0.5" />
        <button
          onClick={() => setShowContours((prev) => !prev)}
          className={cn(
            'w-7 h-7 flex items-center justify-center rounded text-slate-700 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900 transition-colors',
            showContours ? 'bg-slate-100 font-bold' : 'hover:bg-slate-50'
          )}
          title="Toggle Depth Inundation Layers"
          aria-label="Toggle Inundation Layers"
        >
          <Layers className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setZoomLevel(1);
            onSelectZone('B');
          }}
          className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 rounded text-slate-700 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900"
          title="Reset to Critical Zone B"
          aria-label="Reset Map View"
        >
          <LocateFixed className="w-4 h-4" />
        </button>
      </div>

      {/* Map Legend (Bottom-Left) */}
      <div className="relative m-2.5 flex flex-wrap items-end justify-between pointer-events-none gap-2 z-10">
        <div className="bg-white/95 backdrop-blur-xs px-2.5 py-1.5 rounded-md border border-slate-200/90 shadow-2xs flex items-center gap-3 pointer-events-auto">
          {/* Critical */}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-red-600/25 border-1.5 border-red-600 rounded-2xs flex items-center justify-center">
              <span className="w-2 h-0.5 bg-red-600 rotate-45" />
            </span>
            <span className="text-[10px] font-bold text-slate-900 uppercase">Critical</span>
          </div>
          {/* High */}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-orange-500/30 border border-orange-600 rounded-2xs" />
            <span className="text-[10px] font-bold text-slate-700 uppercase">High</span>
          </div>
          {/* Elevated */}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-yellow-400/25 border border-yellow-500 rounded-2xs" />
            <span className="text-[10px] font-bold text-slate-700 uppercase">Elevated</span>
          </div>
          {/* Low */}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-transparent border border-dashed border-slate-400 rounded-2xs" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">Low</span>
          </div>
        </div>

        {/* Map Scale & Reference */}
        <div className="bg-white/95 backdrop-blur-xs px-2.5 py-1.5 rounded-md border border-slate-200/90 shadow-2xs flex items-center gap-2 text-slate-500 text-[10px] font-medium pointer-events-auto">
          <div className="flex items-center gap-1">
            <span className="w-5 h-1 bg-slate-900 inline-block" />
            <span className="font-bold text-slate-900">1 km</span>
          </div>
          <span>·</span>
          <span>12.914°N, 74.856°E</span>
          <span>·</span>
          <span className="text-slate-700 font-semibold">Live Raster</span>
        </div>
      </div>
    </div>
  );
}
