'use client';

import React, { useEffect, useRef, useState, useId } from 'react';
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
  MapPin,
  ExternalLink,
  Map as MapIcon,
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

// OpenStreetMap tile sources
const MAP_API_KEY = process.env.NEXT_PUBLIC_MAP_API_KEY || '';

const getBasemapTiles = () => {
  const authQuery = MAP_API_KEY ? `?api_key=${MAP_API_KEY}` : '';
  return {
    osm: {
      name: 'OSM Standard',
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 19,
    },
    hot: {
      name: 'OSM Relief',
      url: 'https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 19,
    },
    voyager: {
      name: 'OSM Voyager',
      url: `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png${authQuery}`,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors &copy; CARTO',
      maxZoom: 19,
    },
    positron: {
      name: 'OSM Light',
      url: `https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png${authQuery}`,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors &copy; CARTO',
      maxZoom: 19,
    },
  };
};

const BASEMAP_TILES = getBasemapTiles();
type BasemapKey = keyof typeof BASEMAP_TILES;

// Real-world GeoJSON coordinates for Mangaluru coastal zones
const ZONE_COORDINATES: Record<string, { center: [number, number]; coordinates: [number, number][] }> = {
  B: {
    center: [74.808, 12.945],
    coordinates: [
      [74.795, 12.965],
      [74.825, 12.965],
      [74.828, 12.928],
      [74.798, 12.928],
      [74.795, 12.965],
    ],
  },
  F: {
    center: [74.815, 12.905],
    coordinates: [
      [74.802, 12.928],
      [74.830, 12.928],
      [74.826, 12.880],
      [74.808, 12.880],
      [74.802, 12.928],
    ],
  },
  C: {
    center: [74.795, 13.000],
    coordinates: [
      [74.780, 13.025],
      [74.815, 13.025],
      [74.818, 12.975],
      [74.785, 12.975],
      [74.780, 13.025],
    ],
  },
  H: {
    center: [74.825, 12.860],
    coordinates: [
      [74.812, 12.880],
      [74.838, 12.880],
      [74.836, 12.840],
      [74.818, 12.840],
      [74.812, 12.880],
    ],
  },
  A: {
    center: [74.845, 12.825],
    coordinates: [
      [74.825, 12.840],
      [74.868, 12.840],
      [74.865, 12.805],
      [74.832, 12.805],
      [74.825, 12.840],
    ],
  },
  D: {
    center: [74.835, 12.915],
    coordinates: [
      [74.828, 12.930],
      [74.860, 12.930],
      [74.860, 12.900],
      [74.828, 12.900],
      [74.828, 12.930],
    ],
  },
  E: {
    center: [74.825, 12.975],
    coordinates: [
      [74.818, 12.990],
      [74.855, 12.990],
      [74.852, 12.965],
      [74.818, 12.965],
      [74.818, 12.990],
    ],
  },
  G: {
    center: [74.848, 12.880],
    coordinates: [
      [74.835, 12.895],
      [74.870, 12.895],
      [74.870, 12.865],
      [74.835, 12.865],
      [74.835, 12.895],
    ],
  },
  I: {
    center: [74.845, 12.855],
    coordinates: [
      [74.835, 12.865],
      [74.862, 12.865],
      [74.860, 12.842],
      [74.835, 12.842],
      [74.835, 12.865],
    ],
  },
  J: {
    center: [74.865, 12.890],
    coordinates: [
      [74.855, 12.910],
      [74.890, 12.910],
      [74.890, 12.870],
      [74.855, 12.870],
      [74.855, 12.910],
    ],
  },
  K: {
    center: [74.855, 12.935],
    coordinates: [
      [74.845, 12.955],
      [74.880, 12.955],
      [74.880, 12.920],
      [74.845, 12.920],
      [74.845, 12.955],
    ],
  },
};

// Real-world Mangaluru GPS coordinates for facilities
const FACILITY_GEO: Record<string, [number, number]> = {
  'district-hospital-h1': [74.808, 12.946],
  'city-hospital': [74.808, 12.946],
  'panambur-fire': [74.802, 12.952],
  'govt-school-shelter': [74.818, 12.941],
  'govt-school-4': [74.818, 12.941],
  'tannirbhavi-marine': [74.811, 12.895],
  'tannirbhavi-cg': [74.811, 12.895],
  'substation-f': [74.821, 12.905],
  'surathkal-health': [74.792, 13.005],
  'surathkal-substation': [74.792, 13.005],
  'bengre-spit-shelter': [74.828, 12.858],
  'bengre-chc': [74.828, 12.858],
  'st-aloysius-hall': [74.848, 12.875],
};

export function FloodMap({
  zones,
  selectedZoneId,
  onSelectZone,
  facilities,
  className,
}: FloodMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [basemap, setBasemap] = useState<BasemapKey>('osm');
  const [showInundation, setShowInundation] = useState<boolean>(true);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [hoveredFacility, setHoveredFacility] = useState<CriticalFacility | null>(null);

  const selectedZone = zones.find((z) => z.id === selectedZoneId) || zones[0];

  // Initialize MapLibre GL with OpenStreetMap tiles
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current) return;

      try {
        const maplibregl: any = await import('maplibre-gl');

        if (!isMounted || !mapContainerRef.current) return;

        // Clean up previous instance if any
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }

        const tileConfig = BASEMAP_TILES[basemap];

        const map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: {
            version: 8,
            sources: {
              'osm-tiles': {
                type: 'raster',
                tiles: [tileConfig.url],
                tileSize: 256,
                attribution: tileConfig.attribution,
              },
            },
            layers: [
              {
                id: 'osm-tiles-layer',
                type: 'raster',
                source: 'osm-tiles',
                minzoom: 0,
                maxzoom: tileConfig.maxZoom,
              },
            ],
          },
          center: [74.815, 12.925], // Mangaluru coastal centroid
          zoom: 11.8,
          pitch: 0,
          attributionControl: false,
        });

        map.on('load', () => {
          if (!isMounted) return;
          mapRef.current = map;
          setMapLoaded(true);
          renderRiskLayers(map, maplibregl);
          renderMarkers(map, maplibregl);
        });
      } catch (err) {
        console.warn('MapLibre GL initialization error, falling back:', err);
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [basemap]);

  // Update polygon risk layers
  function renderRiskLayers(map: any, maplibregl: any) {
    if (!map || !map.isStyleLoaded()) return;

    // Build GeoJSON features for all configured zones
    const features = zones.map((z) => {
      const geo = ZONE_COORDINATES[z.id];
      if (!geo) return null;

      let fillColor = '#64748B';
      let fillOpacity = 0.05;
      let strokeColor = '#64748B';
      let strokeWidth = 1.2;

      if (z.severity === 'CRITICAL') {
        fillColor = '#DC2626';
        fillOpacity = 0.32;
        strokeColor = '#DC2626';
        strokeWidth = 2.5;
      } else if (z.severity === 'HIGH') {
        fillColor = '#EA580C';
        fillOpacity = 0.28;
        strokeColor = '#EA580C';
        strokeWidth = 2.0;
      } else if (z.severity === 'ELEVATED') {
        fillColor = '#CA8A04';
        fillOpacity = 0.22;
        strokeColor = '#CA8A04';
        strokeWidth = 1.5;
      }

      return {
        type: 'Feature',
        id: z.id,
        properties: {
          id: z.id,
          name: z.name,
          locality: z.locality,
          severity: z.severity,
          probability: z.probability,
          fillColor,
          fillOpacity,
          strokeColor,
          strokeWidth,
          isSelected: z.id === selectedZoneId,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [geo.coordinates],
        },
      };
    }).filter(Boolean);

    const geojsonData: any = {
      type: 'FeatureCollection',
      features,
    };

    // Remove existing zone source if present
    if (map.getSource('flood-zones-source')) {
      map.getSource('flood-zones-source').setData(geojsonData);
      return;
    }

    map.addSource('flood-zones-source', {
      type: 'geojson',
      data: geojsonData,
    });

    // 1. Zone Fills
    map.addLayer({
      id: 'flood-zones-fill',
      type: 'fill',
      source: 'flood-zones-source',
      layout: {
        visibility: showInundation ? 'visible' : 'none',
      },
      paint: {
        'fill-color': ['get', 'fillColor'],
        'fill-opacity': [
          'case',
          ['boolean', ['get', 'isSelected'], false],
          0.45,
          ['get', 'fillOpacity'],
        ],
      },
    });

    // 2. Zone Boundaries
    map.addLayer({
      id: 'flood-zones-outline',
      type: 'line',
      source: 'flood-zones-source',
      paint: {
        'line-color': ['get', 'strokeColor'],
        'line-width': [
          'case',
          ['boolean', ['get', 'isSelected'], false],
          3.5,
          ['get', 'strokeWidth'],
        ],
      },
    });

    // Interactive zone clicks on polygons
    map.on('click', 'flood-zones-fill', (e: any) => {
      if (e.features && e.features.length > 0) {
        const zoneId = e.features[0].properties.id;
        if (zoneId) onSelectZone(zoneId);
      }
    });

    map.on('mouseenter', 'flood-zones-fill', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'flood-zones-fill', () => {
      map.getCanvas().style.cursor = '';
    });
  }

  // Render HTML Markers for Facilities and Zone Labels
  function renderMarkers(map: any, maplibregl: any) {
    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // 1. Zone Centroid Labels
    zones.forEach((z) => {
      const geo = ZONE_COORDINATES[z.id];
      if (!geo) return;

      const isCritical = z.severity === 'CRITICAL';
      const isHigh = z.severity === 'HIGH';
      const isElevated = z.severity === 'ELEVATED';

      const labelEl = document.createElement('div');
      labelEl.className = 'cursor-pointer select-none transition-transform hover:scale-105';
      labelEl.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(255, 255, 255, 0.95);
          padding: 2px 6px;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.25);
          border: 1px solid ${isCritical ? '#DC2626' : isHigh ? '#EA580C' : isElevated ? '#CA8A04' : '#94A3B8'};
          font-family: Inter, sans-serif;
          font-size: 11px;
          font-weight: 700;
          color: #0F172A;
        ">
          <span style="
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: ${isCritical ? '#DC2626' : isHigh ? '#EA580C' : isElevated ? '#CA8A04' : '#94A3B8'};
            display: inline-block;
          "></span>
          <span>${z.name}</span>
        </div>
      `;

      labelEl.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectZone(z.id);
      });

      const marker = new maplibregl.Marker({
        element: labelEl,
        anchor: 'center',
      })
        .setLngLat(geo.center)
        .addTo(map);

      markersRef.current.push(marker);
    });

    // 2. Critical Facilities Markers
    facilities.forEach((fac) => {
      const coords = FACILITY_GEO[fac.id] || (ZONE_COORDINATES[fac.zoneId]?.center ?? [74.815, 12.925]);
      const isCritical = fac.severity === 'CRITICAL';

      const facEl = document.createElement('div');
      facEl.className = 'cursor-pointer select-none group';
      facEl.style.width = '28px';
      facEl.style.height = '28px';
      facEl.style.position = 'relative';

      let iconSvg = `+`;
      if (fac.category === 'fire') iconSvg = `▲`;
      if (fac.category === 'shelter') iconSvg = `⌂`;
      if (fac.category === 'security') iconSvg = `🛡`;
      if (fac.category === 'utility') iconSvg = `⚡`;

      facEl.innerHTML = `
        <div style="
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: ${isCritical ? 'rgba(220, 38, 38, 0.25)' : 'transparent'};
          ${isCritical ? 'animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;' : ''}
        "></div>
        <div style="
          width: 24px;
          height: 24px;
          margin: 2px;
          border-radius: 50%;
          background: ${isCritical ? '#DC2626' : '#0F172A'};
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: bold;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          transition: transform 0.15s ease;
        ">
          ${iconSvg}
        </div>
      `;

      facEl.addEventListener('mouseenter', () => setHoveredFacility(fac));
      facEl.addEventListener('mouseleave', () => setHoveredFacility(null));
      facEl.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectZone(fac.zoneId);
      });

      const facMarker = new maplibregl.Marker({
        element: facEl,
        anchor: 'center',
      })
        .setLngLat(coords)
        .addTo(map);

      markersRef.current.push(facMarker);
    });
  }

  // Sync selected zone & visibility when props change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    if (map.getSource('flood-zones-source')) {
      import('maplibre-gl').then((mod: any) => {
        const maplibregl = mod.default || mod;
        renderRiskLayers(map, maplibregl);
      });
    }

    if (map.getLayer('flood-zones-fill')) {
      map.setLayoutProperty('flood-zones-fill', 'visibility', showInundation ? 'visible' : 'none');
    }

    // Smoothly fly to selected zone if it changes
    const geo = ZONE_COORDINATES[selectedZoneId];
    if (geo && map) {
      map.flyTo({
        center: geo.center,
        zoom: Math.max(map.getZoom(), 12.2),
        essential: true,
        speed: 1.2,
      });
    }
  }, [selectedZoneId, showInundation, mapLoaded]);

  // Controls: Zoom in/out, Fly to Zone B
  const handleZoomIn = () => {
    if (mapRef.current) mapRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapRef.current) mapRef.current.zoomOut();
  };

  const handleResetToZoneB = () => {
    onSelectZone('B');
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: ZONE_COORDINATES['B'].center,
        zoom: 12.8,
        essential: true,
        speed: 1.5,
      });
    }
  };

  return (
    <div
      className={cn(
        'relative w-full h-[380px] lg:h-[430px] xl:h-[480px] bg-slate-100 rounded-lg overflow-hidden flex flex-col justify-between shadow-xs select-none border border-slate-200/90',
        className
      )}
    >
      {/* MapLibre GL OpenStreetMap Container */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

      {/* Floating Selected Zone Indicator (Top-Left) */}
      {selectedZone && (
        <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none z-20">
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

      {/* Hover Facility Tooltip */}
      {hoveredFacility && (
        <div
          className="absolute z-40 pointer-events-none select-none bg-slate-900/95 text-white px-2.5 py-1.5 rounded shadow-lg text-xs transition-opacity duration-100 border border-slate-700"
          style={{
            left: '50%',
            top: '20px',
            transform: 'translateX(-50%)',
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

      {/* Map Controls Toolbar (Top-Right) */}
      <div className="absolute top-3 right-3 flex flex-col gap-1 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-md shadow-xs p-1 z-20">
        <button
          onClick={handleZoomIn}
          className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 rounded text-slate-700 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900 cursor-pointer"
          title="Zoom In"
          aria-label="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 rounded text-slate-700 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900 cursor-pointer"
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
        <div className="h-px bg-slate-200 my-0.5" />
        <button
          onClick={() => setShowInundation((prev) => !prev)}
          className={cn(
            'w-7 h-7 flex items-center justify-center rounded text-slate-700 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900 transition-colors cursor-pointer',
            showInundation ? 'bg-slate-100 font-bold text-blue-700' : 'hover:bg-slate-50'
          )}
          title="Toggle Flood Inundation Layer"
          aria-label="Toggle Inundation Layer"
        >
          <Layers className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetToZoneB}
          className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 rounded text-slate-700 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900 cursor-pointer"
          title="Focus Critical Zone B"
          aria-label="Reset Map View"
        >
          <LocateFixed className="w-4 h-4 text-red-600" />
        </button>
      </div>

      {/* Basemap Switcher Chips (Center-Top) */}
      <div className="absolute top-3 right-16 flex items-center gap-1 bg-white/95 backdrop-blur-xs px-1.5 py-1 rounded-md border border-slate-200 shadow-2xs z-20">
        <span className="text-[10px] font-bold text-slate-500 uppercase px-1">Basemap:</span>
        {(['osm', 'hot', 'voyager', 'positron'] as const).map((key) => (
          <button
            key={key}
            onClick={() => setBasemap(key)}
            className={cn(
              'px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer',
              basemap === key
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            )}
          >
            {BASEMAP_TILES[key].name}
          </button>
        ))}
      </div>

      {/* Map Legend (Bottom-Left) */}
      <div className="relative m-2.5 flex flex-wrap items-end justify-between pointer-events-none gap-2 z-20">
        <div className="bg-white/95 backdrop-blur-xs px-2.5 py-1.5 rounded-md border border-slate-200/90 shadow-2xs flex items-center gap-3 pointer-events-auto">
          {/* Critical */}
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => onSelectZone('B')}>
            <span className="w-3 h-3 bg-red-600/30 border-2 border-red-600 rounded-2xs flex items-center justify-center">
              <span className="w-2 h-0.5 bg-red-600 rotate-45" />
            </span>
            <span className="text-[10px] font-bold text-red-700 uppercase">Critical</span>
          </div>
          {/* High */}
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => onSelectZone('F')}>
            <span className="w-3 h-3 bg-orange-500/30 border-1.5 border-orange-600 rounded-2xs" />
            <span className="text-[10px] font-bold text-orange-700 uppercase">High</span>
          </div>
          {/* Elevated */}
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => onSelectZone('A')}>
            <span className="w-3 h-3 bg-yellow-400/25 border border-yellow-600 rounded-2xs" />
            <span className="text-[10px] font-bold text-yellow-800 uppercase">Elevated</span>
          </div>
          {/* Low */}
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => onSelectZone('D')}>
            <span className="w-3 h-3 bg-transparent border border-dashed border-slate-400 rounded-2xs" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">Low</span>
          </div>
        </div>

        {/* Map Scale & OpenStreetMap Attribution */}
        <div className="bg-white/95 backdrop-blur-xs px-2.5 py-1.5 rounded-md border border-slate-200/90 shadow-2xs flex items-center gap-2 text-slate-500 text-[10px] font-medium pointer-events-auto">
          <div className="flex items-center gap-1">
            <span className="w-5 h-1 bg-slate-900 inline-block" />
            <span className="font-bold text-slate-900">1 km</span>
          </div>
          <span>·</span>
          <span>12.914°N, 74.856°E</span>
          <span>·</span>
          <span className="text-slate-800 font-semibold flex items-center gap-1">
            <MapIcon className="w-3 h-3 text-emerald-600" />
            <span>OpenStreetMap Live</span>
          </span>
        </div>
      </div>
    </div>
  );
}
