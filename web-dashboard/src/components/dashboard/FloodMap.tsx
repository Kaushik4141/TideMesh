'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Plus,
  Minus,
  Layers,
  LocateFixed,
  Waves,
  Navigation,
  Droplets,
  Map as MapIcon,
  Globe2,
  ChevronDown,
} from 'lucide-react';
import type { ZoneData, CriticalFacility } from '@/types/dashboard';
import { cn } from '@/lib/utils';
import {
  WATERWAY_ROUTE_PATHS,
  getDynamicSwollenWaterways,
  TIMESTEP_EXPANSION_FACTORS,
} from '@/data/waterways';
import { INDIA_COASTAL_REGIONS, type CoastalRegion } from '@/data/coastalRegions';

interface FloodMapProps {
  zones: ZoneData[];
  selectedZoneId: string;
  onSelectZone: (zoneId: string) => void;
  facilities: CriticalFacility[];
  floodExtentGeoJson?: Record<string, unknown> | null;
  currentTime?: string;
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
  floodExtentGeoJson,
  currentTime = '14:30',
  className,
}: FloodMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [basemap, setBasemap] = useState<BasemapKey>('osm');
  const [showRoutes, setShowRoutes] = useState<boolean>(true);
  const [showInundationSwath, setShowInundationSwath] = useState<boolean>(true);
  const [showZones, setShowZones] = useState<boolean>(true);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [selectedRegionId, setSelectedRegionId] = useState<string>('mangaluru');
  const [regionMenuOpen, setRegionMenuOpen] = useState<boolean>(false);

  const [hoveredFacility, setHoveredFacility] = useState<CriticalFacility | null>(null);
  const [hoveredWaterway, setHoveredWaterway] = useState<{
    name: string;
    description: string;
    depthM?: number;
  } | null>(null);

  const currentFactor = TIMESTEP_EXPANSION_FACTORS[currentTime] ?? 0.65;
  const currentSwellMeters = Math.round(currentFactor * 520);
  const selectedZone = zones.find((z) => z.id === selectedZoneId) || zones[0];
  const activeRegion = INDIA_COASTAL_REGIONS.find((r) => r.id === selectedRegionId) || INDIA_COASTAL_REGIONS[0];

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
          center: activeRegion.center,
          zoom: activeRegion.zoom,
          pitch: 0,
          attributionControl: false,
        });

        map.on('load', () => {
          if (!isMounted) return;
          mapRef.current = map;
          setMapLoaded(true);

          renderSwollenCorridors(map, currentFactor);
          renderWaterwayRoutes(map, currentFactor);
          renderInundation(map, floodExtentGeoJson);
          renderRiskLayers(map);
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

  // 1. Render Dynamically Expanding River Flood Corridor (Water Patch that swells with simulation)
  function renderSwollenCorridors(map: any, factor: number) {
    if (!map || !map.isStyleLoaded()) return;

    const dynamicCorridors = getDynamicSwollenWaterways(factor);

    if (map.getSource('swollen-corridors-source')) {
      map.getSource('swollen-corridors-source').setData(dynamicCorridors);
      return;
    }

    map.addSource('swollen-corridors-source', {
      type: 'geojson',
      data: dynamicCorridors,
    });

    // Swollen Flood Swath Fill (Grows wider and deeper blue as flood peaks)
    map.addLayer({
      id: 'swollen-corridors-fill',
      type: 'fill',
      source: 'swollen-corridors-source',
      layout: {
        visibility: showInundationSwath ? 'visible' : 'none',
      },
      paint: {
        'fill-color': ['get', 'color'],
        'fill-opacity': 0.48 + factor * 0.22, // 0.50 to 0.70 opacity
      },
    });

    // Swollen Flood Boundary Edge
    map.addLayer({
      id: 'swollen-corridors-outline',
      type: 'line',
      source: 'swollen-corridors-source',
      layout: {
        visibility: showInundationSwath ? 'visible' : 'none',
      },
      paint: {
        'line-color': ['get', 'glowColor'],
        'line-width': 2.2,
        'line-dasharray': [4, 2],
      },
    });

    // Interactive tooltip
    map.on('mouseenter', 'swollen-corridors-fill', (e: any) => {
      map.getCanvas().style.cursor = 'pointer';
      if (e.features && e.features[0]) {
        const props = e.features[0].properties;
        setHoveredWaterway({
          name: props.name,
          description: props.description,
          depthM: props.depthM,
        });
      }
    });

    map.on('mouseleave', 'swollen-corridors-fill', () => {
      map.getCanvas().style.cursor = '';
      setHoveredWaterway(null);
    });
  }

  // 2. Render Google Maps / Destination-Style Glowing Route Highway along the River Paths
  function renderWaterwayRoutes(map: any, factor: number) {
    if (!map || !map.isStyleLoaded()) return;

    if (map.getSource('waterway-routes-source')) {
      map.getSource('waterway-routes-source').setData(WATERWAY_ROUTE_PATHS);
      return;
    }

    map.addSource('waterway-routes-source', {
      type: 'geojson',
      data: WATERWAY_ROUTE_PATHS,
    });

    // A. Ambient Glowing Route Halo
    map.addLayer({
      id: 'waterway-routes-glow',
      type: 'line',
      source: 'waterway-routes-source',
      layout: {
        visibility: showRoutes ? 'visible' : 'none',
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': ['get', 'glowColor'],
        'line-width': 18 + factor * 14, // 20px to 32px glowing highway halo
        'line-opacity': 0.38,
      },
    });

    // B. River Bed Casing Outline (Sharp contrast against basemap)
    map.addLayer({
      id: 'waterway-routes-casing',
      type: 'line',
      source: 'waterway-routes-source',
      layout: {
        visibility: showRoutes ? 'visible' : 'none',
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': ['get', 'casingColor'],
        'line-width': 10 + factor * 6, // 11px to 16px outer casing
        'line-opacity': 0.95,
      },
    });

    // C. Core Neon Destination Route Polyline (High visibility GPS route highway)
    map.addLayer({
      id: 'waterway-routes-core',
      type: 'line',
      source: 'waterway-routes-source',
      layout: {
        visibility: showRoutes ? 'visible' : 'none',
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 6.5,
        'line-opacity': 1.0,
      },
    });

    // D. Animated Directional Flow Chevrons / Dashes (Moving stream toward sea)
    map.addLayer({
      id: 'waterway-routes-stream',
      type: 'line',
      source: 'waterway-routes-source',
      layout: {
        visibility: showRoutes ? 'visible' : 'none',
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': '#FFFFFF',
        'line-width': 2.5,
        'line-dasharray': [2, 3],
        'line-opacity': 0.9,
      },
    });

    // Interactive tooltip on route polyline
    map.on('mouseenter', 'waterway-routes-core', (e: any) => {
      map.getCanvas().style.cursor = 'pointer';
      if (e.features && e.features[0]) {
        const props = e.features[0].properties;
        setHoveredWaterway({
          name: props.name,
          description: props.description,
          depthM: props.depthM,
        });
      }
    });

    map.on('mouseleave', 'waterway-routes-core', () => {
      map.getCanvas().style.cursor = '';
      setHoveredWaterway(null);
    });
  }

  // 3. Render SFINCS Inundation Polygon Extent
  function renderInundation(map: any, geojson: Record<string, unknown> | null | undefined) {
    if (!map || !map.isStyleLoaded()) return;

    const fallbackInundation = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { depth: '1.2m' },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [74.810, 12.955],
                [74.835, 12.955],
                [74.845, 12.915],
                [74.835, 12.875],
                [74.825, 12.845],
                [74.815, 12.845],
                [74.810, 12.890],
                [74.805, 12.930],
                [74.810, 12.955],
              ],
            ],
          },
        },
      ],
    };

    const targetData = geojson || fallbackInundation;

    if (map.getSource('sfincs-inundation-source')) {
      map.getSource('sfincs-inundation-source').setData(targetData);
      return;
    }

    map.addSource('sfincs-inundation-source', {
      type: 'geojson',
      data: targetData,
    });

    map.addLayer({
      id: 'sfincs-inundation-fill',
      type: 'fill',
      source: 'sfincs-inundation-source',
      layout: {
        visibility: showInundationSwath ? 'visible' : 'none',
      },
      paint: {
        'fill-color': '#0284C7',
        'fill-opacity': 0.35,
      },
    });

    map.addLayer({
      id: 'sfincs-inundation-outline',
      type: 'line',
      source: 'sfincs-inundation-source',
      layout: {
        visibility: showInundationSwath ? 'visible' : 'none',
      },
      paint: {
        'line-color': '#38BDF8',
        'line-width': 2.0,
        'line-dasharray': [4, 2],
      },
    });
  }

  // 4. Render Operational Zone Risk Layers
  function renderRiskLayers(map: any) {
    if (!map || !map.isStyleLoaded()) return;

    const features = zones.map((z) => {
      const geo = ZONE_COORDINATES[z.id];
      if (!geo) return null;

      let fillColor = '#64748B';
      let fillOpacity = 0.05;
      let strokeColor = '#64748B';
      let strokeWidth = 1.2;

      if (z.severity === 'CRITICAL') {
        fillColor = '#DC2626';
        fillOpacity = 0.28;
        strokeColor = '#DC2626';
        strokeWidth = 2.5;
      } else if (z.severity === 'HIGH') {
        fillColor = '#EA580C';
        fillOpacity = 0.24;
        strokeColor = '#EA580C';
        strokeWidth = 2.0;
      } else if (z.severity === 'ELEVATED') {
        fillColor = '#CA8A04';
        fillOpacity = 0.18;
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

    if (map.getSource('flood-zones-source')) {
      map.getSource('flood-zones-source').setData(geojsonData);
      return;
    }

    map.addSource('flood-zones-source', {
      type: 'geojson',
      data: geojsonData,
    });

    map.addLayer({
      id: 'flood-zones-fill',
      type: 'fill',
      source: 'flood-zones-source',
      layout: {
        visibility: showZones ? 'visible' : 'none',
      },
      paint: {
        'fill-color': ['get', 'fillColor'],
        'fill-opacity': [
          'case',
          ['boolean', ['get', 'isSelected'], false],
          0.38,
          ['get', 'fillOpacity'],
        ],
      },
    });

    map.addLayer({
      id: 'flood-zones-outline',
      type: 'line',
      source: 'flood-zones-source',
      layout: {
        visibility: showZones ? 'visible' : 'none',
      },
      paint: {
        'line-color': ['get', 'strokeColor'],
        'line-width': [
          'case',
          ['boolean', ['get', 'isSelected'], false],
          3.0,
          ['get', 'strokeWidth'],
        ],
      },
    });

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

  // 5. Render HTML Markers (Facilities and Zone Centroids)
  function renderMarkers(map: any, maplibregl: any) {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Zone Centroid Labels
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

    // Critical Facilities Markers
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

  // Update dynamic layers and swollen corridor width when simulation time changes
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    // A. Dynamically update swollen river channels based on simulation progression (currentTime)
    if (map.getSource('swollen-corridors-source')) {
      map.getSource('swollen-corridors-source').setData(getDynamicSwollenWaterways(currentFactor));
    }
    if (map.getLayer('swollen-corridors-fill')) {
      map.setLayoutProperty('swollen-corridors-fill', 'visibility', showInundationSwath ? 'visible' : 'none');
      map.setPaintProperty('swollen-corridors-fill', 'fill-opacity', 0.45 + currentFactor * 0.25);
      map.setLayoutProperty('swollen-corridors-outline', 'visibility', showInundationSwath ? 'visible' : 'none');
    }

    // B. Dynamically scale the highlighted route highway casing with simulation swell
    if (map.getLayer('waterway-routes-glow')) {
      map.setLayoutProperty('waterway-routes-glow', 'visibility', showRoutes ? 'visible' : 'none');
      map.setPaintProperty('waterway-routes-glow', 'line-width', 18 + currentFactor * 14);
    }
    if (map.getLayer('waterway-routes-casing')) {
      map.setLayoutProperty('waterway-routes-casing', 'visibility', showRoutes ? 'visible' : 'none');
      map.setPaintProperty('waterway-routes-casing', 'line-width', 10 + currentFactor * 6);
    }
    if (map.getLayer('waterway-routes-core')) {
      map.setLayoutProperty('waterway-routes-core', 'visibility', showRoutes ? 'visible' : 'none');
    }
    if (map.getLayer('waterway-routes-stream')) {
      map.setLayoutProperty('waterway-routes-stream', 'visibility', showRoutes ? 'visible' : 'none');
    }

    // C. Inundation extent visibility & data sync
    if (map.getSource('sfincs-inundation-source')) {
      renderInundation(map, floodExtentGeoJson);
    }
    if (map.getLayer('sfincs-inundation-fill')) {
      map.setLayoutProperty('sfincs-inundation-fill', 'visibility', showInundationSwath ? 'visible' : 'none');
      map.setLayoutProperty('sfincs-inundation-outline', 'visibility', showInundationSwath ? 'visible' : 'none');
    }

    // D. Zone outlines visibility & data sync
    if (map.getSource('flood-zones-source')) {
      renderRiskLayers(map);
    }
    if (map.getLayer('flood-zones-fill')) {
      map.setLayoutProperty('flood-zones-fill', 'visibility', showZones ? 'visible' : 'none');
      map.setLayoutProperty('flood-zones-outline', 'visibility', showZones ? 'visible' : 'none');
    }

    // Smoothly fly to selected zone if it changed
    const geo = ZONE_COORDINATES[selectedZoneId];
    if (geo && map && selectedRegionId === 'mangaluru') {
      map.flyTo({
        center: geo.center,
        zoom: Math.max(map.getZoom(), 12.2),
        essential: true,
        speed: 1.2,
      });
    }
  }, [selectedZoneId, showRoutes, showInundationSwath, showZones, floodExtentGeoJson, currentTime, currentFactor, mapLoaded]);

  // Handle India Region Selection
  const handleSelectRegion = (region: CoastalRegion) => {
    setSelectedRegionId(region.id);
    setRegionMenuOpen(false);
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: region.center,
        zoom: region.zoom,
        essential: true,
        speed: 1.4,
      });
    }
  };

  // Controls
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

      {/* Floating Header: India Coastal Sector Selector (Top-Left) */}
      <div className="absolute top-3 left-3 flex flex-col sm:flex-row items-start sm:items-center gap-2 z-20">
        {/* Region Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setRegionMenuOpen((prev) => !prev)}
            className="h-8 px-3 rounded-md bg-slate-900/95 backdrop-blur-xs text-white border border-slate-700 hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
          >
            <Globe2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>{activeRegion.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {regionMenuOpen && (
            <div className="absolute top-9 left-0 w-72 bg-slate-900/98 backdrop-blur-md border border-slate-700 rounded-lg shadow-xl p-1 z-30 animate-in fade-in-50 duration-100">
              <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex justify-between items-center">
                <span>Select Coastal Domain (India)</span>
                <span className="text-cyan-400 font-mono">5 Sectors</span>
              </div>
              <div className="py-1 space-y-0.5">
                {INDIA_COASTAL_REGIONS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelectRegion(r)}
                    className={cn(
                      'w-full text-left px-2.5 py-1.5 rounded text-xs flex flex-col transition-colors cursor-pointer',
                      selectedRegionId === r.id
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold border-l-2 border-cyan-400'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{r.name}</span>
                      <span className={cn(
                        'text-[9px] px-1 py-0.2 rounded font-bold uppercase',
                        r.status === 'active_simulation'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-700 text-slate-300'
                      )}>
                        {r.state}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                      {r.primaryRivers.join(' · ')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Selected Zone Pill (When in Mangaluru) */}
        {selectedZone && selectedRegionId === 'mangaluru' && (
          <div className="bg-slate-900/95 backdrop-blur-xs text-white px-2.5 py-1.5 rounded-md shadow-md flex items-center gap-2 border border-slate-800 text-xs">
            <span
              className={cn(
                'w-2 h-2 rounded-full shrink-0',
                selectedZone.severity === 'CRITICAL'
                  ? 'bg-red-500 animate-pulse'
                  : selectedZone.severity === 'HIGH'
                  ? 'bg-orange-500'
                  : 'bg-yellow-400'
              )}
            />
            <span className="font-bold">{selectedZone.name}</span>
            <span className="text-slate-400 text-[11px]">·</span>
            <span className="text-slate-300 text-[11px] truncate max-w-[130px]">{selectedZone.locality}</span>
          </div>
        )}
      </div>

      {/* Floating Dynamic Swell Badge (Bottom-Right of Top Area) */}
      <div className="absolute top-14 left-3 flex items-center gap-2 pointer-events-none z-20">
        <div className="bg-sky-950/95 backdrop-blur-xs text-sky-200 border border-sky-600/70 px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 shadow-md pointer-events-auto">
          <Waves className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
          <span>
            Highlighted River Corridor: <strong className="text-cyan-300 font-bold">+{currentSwellMeters}m Swell</strong> · {currentTime} IST
          </span>
        </div>
      </div>

      {/* Hover Waterway Tooltip */}
      {hoveredWaterway && (
        <div
          className="absolute z-40 pointer-events-none select-none bg-slate-900/95 text-white px-3 py-2 rounded-md shadow-lg text-xs transition-opacity duration-100 border border-cyan-500/70 max-w-[300px]"
          style={{
            left: '50%',
            top: '20px',
            transform: 'translateX(-50%)',
          }}
        >
          <div className="font-bold flex items-center gap-1.5 text-cyan-300">
            <Waves className="w-3.5 h-3.5 text-cyan-400" />
            <span>{hoveredWaterway.name}</span>
          </div>
          <div className="text-[11px] text-slate-300 mt-0.5 leading-snug">
            {hoveredWaterway.description}
          </div>
          {hoveredWaterway.depthM != null && (
            <div className="text-[10px] text-cyan-300 mt-1 font-mono font-semibold">
              Water Depth / Bed Level: {hoveredWaterway.depthM} m MSL
            </div>
          )}
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
          onClick={() => setShowRoutes((prev) => !prev)}
          className={cn(
            'w-7 h-7 flex items-center justify-center rounded transition-colors cursor-pointer',
            showRoutes ? 'bg-cyan-100 font-bold text-cyan-800' : 'text-slate-700 hover:bg-slate-100'
          )}
          title="Toggle Highlighted River Waterway Highway (Destination Route)"
          aria-label="Toggle River Highlight Highway"
        >
          <Navigation className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setShowInundationSwath((prev) => !prev)}
          className={cn(
            'w-7 h-7 flex items-center justify-center rounded transition-colors cursor-pointer',
            showInundationSwath ? 'bg-sky-100 font-bold text-sky-800' : 'text-slate-700 hover:bg-slate-100'
          )}
          title="Toggle Dynamic Swollen Flood Corridor (Swelling Water Patch)"
          aria-label="Toggle Dynamic Swelling Corridor"
        >
          <Waves className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowZones((prev) => !prev)}
          className={cn(
            'w-7 h-7 flex items-center justify-center rounded transition-colors cursor-pointer',
            showZones ? 'bg-slate-200 font-bold text-slate-900' : 'text-slate-700 hover:bg-slate-100'
          )}
          title="Toggle Operational Zone Outlines"
          aria-label="Toggle Zones Layer"
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
        <div className="bg-white/95 backdrop-blur-xs px-2.5 py-1.5 rounded-md border border-slate-200/90 shadow-2xs flex flex-wrap items-center gap-3 pointer-events-auto">
          {/* Highlighted Destination River Route */}
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-2 bg-cyan-400 rounded-full border border-sky-800 shadow-xs" />
            <span className="text-[10px] font-bold text-cyan-900 uppercase">River Route Highway</span>
          </div>

          {/* Swelling Flood Swath */}
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-2.5 bg-blue-600/40 border border-blue-500 rounded-2xs" />
            <span className="text-[10px] font-bold text-blue-900 uppercase">Swollen Inundation Swath</span>
          </div>

          {/* Surge Inflow Vector */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-rose-600 font-bold">➔</span>
            <span className="text-[10px] font-bold text-rose-900 uppercase">Surge Inflow</span>
          </div>

          <div className="h-3 w-px bg-slate-300 hidden sm:block" />

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
        </div>

        {/* Region & OpenStreetMap Attribution */}
        <div className="bg-white/95 backdrop-blur-xs px-2.5 py-1.5 rounded-md border border-slate-200/90 shadow-2xs flex items-center gap-2 text-slate-500 text-[10px] font-medium pointer-events-auto">
          <span className="font-bold text-slate-900">{activeRegion.name}</span>
          <span>·</span>
          <span className="text-slate-800 font-semibold flex items-center gap-1">
            <MapIcon className="w-3 h-3 text-emerald-600" />
            <span>OSM Live</span>
          </span>
        </div>
      </div>
    </div>
  );
}
