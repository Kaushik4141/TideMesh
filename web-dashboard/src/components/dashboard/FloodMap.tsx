'use client';

import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  Hospital,
  Flame,
  Home,
  Shield,
  Zap,
  Radio,
  TriangleAlert,
  AlertCircle,
} from 'lucide-react';
import type { ZoneData, CriticalFacility, SeverityLevel } from '@/types/dashboard';
import { cn } from '@/lib/utils';

const ZONE_DEFINITIONS: Array<{
  id: string;
  name: string;
  points: string;
  labelPos: { cx?: number; cy?: number; x: number; y: number };
}> = [
  { id: 'B', name: 'Zone B', points: '255,30 420,35 435,175 270,170', labelPos: { cx: 282, cy: 50, x: 292, y: 54 } },
  { id: 'F', name: 'Zone F', points: '280,185 450,195 440,245 285,240', labelPos: { cx: 332, cy: 216, x: 341, y: 220 } },
  { id: 'C', name: 'Zone C', points: '230,270 355,270 360,420 220,425', labelPos: { cx: 262, cy: 346, x: 271, y: 350 } },
  { id: 'H', name: 'Zone H', points: '370,250 480,230 480,350 365,360', labelPos: { cx: 395, cy: 301, x: 404, y: 305 } },
  { id: 'A', name: 'Zone A', points: '200,470 370,460 380,570 190,570', labelPos: { cx: 285, cy: 515, x: 295, y: 519 } },
  { id: 'D', name: 'Zone D', points: '460,50 630,40 650,135 480,150', labelPos: { x: 540, y: 95 } },
  { id: 'E', name: 'Zone E', points: '640,40 820,30 840,140 660,135', labelPos: { x: 730, y: 85 } },
  { id: 'G', name: 'Zone G', points: '490,225 650,215 670,330 495,310', labelPos: { x: 560, y: 275 } },
  { id: 'I', name: 'Zone I', points: '680,210 880,220 890,340 680,330', labelPos: { x: 760, y: 275 } },
  { id: 'J', name: 'Zone J', points: '500,340 700,335 690,450 490,440', labelPos: { x: 580, y: 390 } },
  { id: 'K', name: 'Zone K', points: '710,345 890,350 880,480 700,460', labelPos: { x: 780, y: 415 } },
  { id: 'L', name: 'Zone L', points: '480,510 680,500 670,570 470,570', labelPos: { x: 560, y: 545 } },
];

function getZoneStyle(severity: SeverityLevel = 'LOW', isSelected: boolean = false) {
  switch (severity) {
    case 'CRITICAL':
      return {
        fill: 'rgba(220, 38, 38, 0.28)',
        stroke: '#DC2626',
        strokeWidth: isSelected ? 3 : 2,
        strokeDasharray: undefined,
        hasHatch: true,
        dotColor: '#DC2626',
      };
    case 'HIGH':
      return {
        fill: 'rgba(249, 115, 22, 0.3)',
        stroke: '#EA580C',
        strokeWidth: isSelected ? 2.5 : 1.5,
        strokeDasharray: undefined,
        hasHatch: false,
        dotColor: '#EA580C',
      };
    case 'ELEVATED':
      return {
        fill: 'rgba(234, 179, 8, 0.25)',
        stroke: '#CA8A04',
        strokeWidth: isSelected ? 2.5 : 1.5,
        strokeDasharray: undefined,
        hasHatch: false,
        dotColor: '#CA8A04',
      };
    case 'LOW':
    default:
      return {
        fill: 'none',
        stroke: '#64748B',
        strokeWidth: isSelected ? 2 : 1.5,
        strokeDasharray: '4,4',
        hasHatch: false,
        dotColor: undefined,
      };
  }
}

interface FloodMapProps {
  zones: ZoneData[];
  selectedZoneId: string;
  onSelectZone: (zoneId: string) => void;
  facilities: CriticalFacility[];
  floodExtentGeoJson?: Record<string, unknown> | null;
  className?: string;
}

export function FloodMap({
  zones,
  selectedZoneId,
  onSelectZone,
  facilities,
  floodExtentGeoJson,
  className,
}: FloodMapProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showContours, setShowContours] = useState<boolean>(true);
  const [hoveredFacility, setHoveredFacility] = useState<CriticalFacility | null>(null);

  const sfincsPolygonPoints = React.useMemo(() => {
    if (!floodExtentGeoJson || typeof floodExtentGeoJson !== 'object') return null;
    try {
      const fc = floodExtentGeoJson as {
        features?: Array<{
          geometry: {
            type: string;
            coordinates: number[][][];
          };
        }>;
      };
      if (!fc.features || fc.features.length === 0) return null;
      const geom = fc.features[0].geometry;
      if (geom.type === 'Polygon' && geom.coordinates?.[0]) {
        return geom.coordinates[0]
          .map(([lon, lat]: number[]) => {
            const x = 240 + ((lon - 74.84) / 0.08) * 400;
            const y = 50 + ((12.92 - lat) / 0.08) * 360;
            return `${Math.round(x)},${Math.round(y)}`;
          })
          .join(' ');
      }
    } catch {
      return null;
    }
    return null;
  }, [floodExtentGeoJson]);

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

        {/* 3. Road Network */}
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

        {/* 4. Dynamic Zone Polygons */}
        {ZONE_DEFINITIONS.map((def) => {
          const zoneData = zones.find((z) => z.id === def.id);
          const severity = zoneData?.severity || 'LOW';
          const isSelected = selectedZoneId === def.id;
          const style = getZoneStyle(severity, isSelected);

          return (
            <React.Fragment key={`poly-${def.id}`}>
              {style.hasHatch && (
                <polygon
                  points={def.points}
                  fill="url(#criticalHatchRefined)"
                  className="pointer-events-none"
                />
              )}
              <polygon
                points={def.points}
                fill={style.fill}
                stroke={style.stroke}
                strokeWidth={style.strokeWidth}
                strokeDasharray={style.strokeDasharray}
                className="cursor-pointer transition-colors"
                onClick={() => onSelectZone(def.id)}
              />
            </React.Fragment>
          );
        })}

        {/* 4.1 Real SFINCS Hydrodynamic Flood Inundation Extent (from Backend NetCDF/GeoJSON) */}
        {showContours && sfincsPolygonPoints && (
          <polygon
            points={sfincsPolygonPoints}
            fill="rgba(14, 165, 233, 0.45)"
            stroke="#0284C7"
            strokeWidth="2.5"
            strokeDasharray="4,2"
            className="pointer-events-none filter drop-shadow-sm transition-all duration-300"
          />
        )}

        {/* 5. Dynamic Zone Labels */}
        {ZONE_DEFINITIONS.map((def) => {
          const zoneData = zones.find((z) => z.id === def.id);
          const severity = zoneData?.severity || 'LOW';
          const isSelected = selectedZoneId === def.id;
          const style = getZoneStyle(severity, isSelected);

          if (style.dotColor && def.labelPos.cx && def.labelPos.cy) {
            return (
              <g
                key={`label-${def.id}`}
                className="cursor-pointer select-none"
                onClick={() => onSelectZone(def.id)}
              >
                <circle
                  cx={def.labelPos.cx}
                  cy={def.labelPos.cy}
                  r={severity === 'CRITICAL' ? 4.5 : 4}
                  fill={style.dotColor}
                />
                <text
                  x={def.labelPos.x}
                  y={def.labelPos.y}
                  fill="#0F172A"
                  fontFamily="Inter, sans-serif"
                  fontSize="12"
                  fontWeight="700"
                  filter="url(#whiteHalo)"
                >
                  {def.name}
                </text>
              </g>
            );
          }

          return (
            <text
              key={`label-${def.id}`}
              x={def.labelPos.x}
              y={def.labelPos.y}
              fill="#475569"
              fontFamily="Inter, sans-serif"
              fontSize="11"
              fontWeight="600"
              filter="url(#whiteHalo)"
              className="cursor-pointer select-none"
              onClick={() => onSelectZone(def.id)}
            >
              {def.name}
            </text>
          );
        })}

        {/* 6. Facility Markers */}
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
              <circle
                r={isSelectedZone ? 9 : 7.5}
                className={cn(
                  'transition-all stroke-1.5',
                  isCritical
                    ? 'fill-red-600 stroke-white'
                    : fac.severity === 'HIGH'
                    ? 'fill-orange-600 stroke-white'
                    : 'fill-slate-800 stroke-white'
                )}
              />
              <g transform="translate(-4, -4) scale(0.65)" className="text-white pointer-events-none">
                {fac.category === 'hospital' ? (
                  <Hospital className="w-3 h-3 text-white" />
                ) : fac.category === 'fire' ? (
                  <Flame className="w-3 h-3 text-white" />
                ) : fac.category === 'power' || fac.category === 'utility' ? (
                  <Zap className="w-3 h-3 text-white" />
                ) : fac.category === 'shelter' ? (
                  <Home className="w-3 h-3 text-white" />
                ) : fac.category === 'police' || fac.category === 'security' ? (
                  <Shield className="w-3 h-3 text-white" />
                ) : (
                  <Radio className="w-3 h-3 text-white" />
                )}
              </g>
            </g>
          );
        })}
      </svg>

      {/* Facility Hover Tooltip */}
      {hoveredFacility && (
        <div
          className="absolute z-30 pointer-events-none bg-slate-900/95 backdrop-blur-xs text-white p-2 rounded shadow-lg border border-slate-700 text-xs flex flex-col gap-0.5"
          style={{
            left: `${Math.min(hoveredFacility.x + 12, 700)}px`,
            top: `${Math.min(hoveredFacility.y - 30, 300)}px`,
          }}
        >
          <div className="font-bold flex items-center gap-1.5">
            <span>{hoveredFacility.name}</span>
            <span
              className={cn(
                'text-[10px] px-1 py-0.2 rounded font-bold uppercase',
                hoveredFacility.severity === 'CRITICAL'
                  ? 'bg-red-600 text-white'
                  : 'bg-orange-500 text-white'
              )}
            >
              {hoveredFacility.severity}
            </span>
          </div>
          <div className="text-[11px] text-slate-300">
            Water Depth: <strong className="text-white">{hoveredFacility.depth}</strong> · Onset: {hoveredFacility.onset}
          </div>
          <div className="text-[10px] text-amber-300 font-medium">
            Route: {hoveredFacility.routeStatus}
          </div>
        </div>
      )}

      {/* Map Controls (Top-Right) */}
      <div className="absolute top-3 right-3 flex flex-col gap-1 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-md shadow-xs p-1 z-10">
        <button
          onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2.5))}
          className="w-7 h-7 flex items-center justify-center rounded text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900 transition-colors"
          title="Zoom in (+)"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
          className="w-7 h-7 flex items-center justify-center rounded text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900 transition-colors"
          title="Zoom out (-)"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <div className="h-px bg-slate-200 my-0.5" />
        <button
          onClick={() => setShowContours((c) => !c)}
          className={cn(
            'w-7 h-7 flex items-center justify-center rounded transition-colors focus-visible:ring-2 focus-visible:ring-slate-900',
            showContours
              ? 'bg-sky-50 text-sky-700 font-bold border border-sky-200'
              : 'text-slate-500 hover:bg-slate-100'
          )}
          title="Toggle SFINCS Inundation Extent Polygon"
          aria-label="Toggle SFINCS Inundation Extent Polygon"
        >
          <Layers className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoomLevel(1)}
          className="w-7 h-7 flex items-center justify-center rounded text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900 transition-colors"
          title="Reset map view (R)"
          aria-label="Reset map view"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Map Legend (Bottom-Left) */}
      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-md p-2 shadow-xs z-10 flex items-center gap-3 text-[11px] text-slate-700 font-medium">
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
          Legend
        </span>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-xs bg-red-600/30 border border-red-600" />
          <span>Critical (&gt;0.5m)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-xs bg-orange-500/30 border border-orange-500" />
          <span>High Risk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-xs bg-yellow-400/25 border border-yellow-500" />
          <span>Elevated</span>
        </div>
        {showContours && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-xs bg-sky-500/40 border border-sky-500 border-dashed" />
            <span className="font-bold text-sky-900">SFINCS Polygon</span>
          </div>
        )}
      </div>
    </div>
  );
}
