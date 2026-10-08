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
} from 'lucide-react';
import type { ZoneData, CriticalFacility } from '@/types/dashboard';
import { cn } from '@/lib/utils';
import {
  MANGALURU_WATERWAYS,
  FLOW_DIRECTION_VECTORS,
  RIVER_LANDMARKS,
  getDynamicSwollenWaterways,
  TIMESTEP_EXPANSION_FACTORS,
} from '@/data/waterways';

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
  const [showWaterways, setShowWaterways] = useState<boolean>(true);
  const [showFlowVectors, setShowFlowVectors] = useState<boolean>(true);
  const [showInundation, setShowInundation] = useState<boolean>(true);
  const [showZones, setShowZones] = useState<boolean>(true);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [hoveredFacility, setHoveredFacility] = useState<CriticalFacility | null>(null);
  const [hoveredWaterway, setHoveredWaterway] = useState<{
    name: string;
    description: string;
    depthM?: number;
  } | null>(null);

  const currentFactor = TIMESTEP_EXPANSION_FACTORS[currentTime] ?? 0.65;
  const currentSwellMeters = Math.round(currentFactor * 480);

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
          center: [74.825, 12.895], // Mangaluru estuarine & river centroid
          zoom: 12.0,
          pitch: 0,
          attributionControl: false,
        });

        map.on('load', () => {
          if (!isMounted) return;
          mapRef.current = map;
          setMapLoaded(true);

          renderWaterways(map, currentFactor);
          renderFlowVectors(map);
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

  // 1. Render Mangaluru Waterways & River Channels with dynamic width swelling
  function renderWaterways(map: any, factor: number = currentFactor) {
    if (!map || !map.isStyleLoaded()) return;

    const dynamicData = getDynamicSwollenWaterways(factor);

    if (map.getSource('waterways-source')) {
      map.getSource('waterways-source').setData(dynamicData);
      return;
    }

    map.addSource('waterways-source', {
      type: 'geojson',
      data: dynamicData,
    });

    // River Waterbody Fill
    map.addLayer({
      id: 'waterways-fill',
      type: 'fill',
      source: 'waterways-source',
      layout: {
        visibility: showWaterways ? 'visible' : 'none',
      },
      paint: {
        'fill-color': ['get', 'color'],
        'fill-opacity': 0.55,
      },
    });

    // River Channel Bank Outline
    map.addLayer({
      id: 'waterways-outline',
      type: 'line',
      source: 'waterways-source',
      layout: {
        visibility: showWaterways ? 'visible' : 'none',
      },
      paint: {
        'line-color': '#0369A1',
        'line-width': 2.2,
      },
    });

    // Interactive tooltip on waterways
    map.on('mouseenter', 'waterways-fill', (e: any) => {
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

    map.on('mouseleave', 'waterways-fill', () => {
      map.getCanvas().style.cursor = '';
      setHoveredWaterway(null);
    });
  }

  // 2. Render Hydrodynamic Flow Direction Vectors
  function renderFlowVectors(map: any) {
    if (!map || !map.isStyleLoaded()) return;

    if (map.getSource('flow-vectors-source')) {
      map.getSource('flow-vectors-source').setData(FLOW_DIRECTION_VECTORS);
      return;
    }

    map.addSource('flow-vectors-source', {
      type: 'geojson',
      data: FLOW_DIRECTION_VECTORS,
    });

    // Dashed Flow Path Lines
    map.addLayer({
      id: 'flow-vectors-line',
      type: 'line',
      source: 'flow-vectors-source',
      layout: {
        visibility: showFlowVectors ? 'visible' : 'none',
      },
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 3.2,
        'line-dasharray': [3, 2],
      },
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

    // Inundation Surface Fill
    map.addLayer({
      id: 'sfincs-inundation-fill',
      type: 'fill',
      source: 'sfincs-inundation-source',
      layout: {
        visibility: showInundation ? 'visible' : 'none',
      },
      paint: {
        'fill-color': '#0284C7',
        'fill-opacity': 0.42,
      },
    });

    // Inundation Boundary Wave Line
    map.addLayer({
      id: 'sfincs-inundation-outline',
      type: 'line',
      source: 'sfincs-inundation-source',
      layout: {
        visibility: showInundation ? 'visible' : 'none',
      },
      paint: {
        'line-color': '#38BDF8',
        'line-width': 2.5,
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
          0.40,
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

  // 5. Render HTML Markers (River Landmarks, Facilities, Zone Centroids)
  function renderMarkers(map: any, maplibregl: any) {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // River & Hydrological Waypoints
    RIVER_LANDMARKS.forEach((lm) => {
      const el = document.createElement('div');
      el.className = 'cursor-pointer select-none transition-transform hover:scale-105';
      el.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          gap: 5px;
          background: rgba(15, 23, 42, 0.92);
          backdrop-filter: blur(4px);
          padding: 2px 7px;
          border-radius: 4px;
          border: 1px solid #0284C7;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          font-family: Inter, sans-serif;
          color: #E0F2FE;
        ">
          <span style="font-size: 11px;">🌊</span>
          <div style="display: flex; flex-direction: column;">
            <span style="font-size: 10px; font-weight: 700; line-height: 1.1; color: #38BDF8;">${lm.name}</span>
            <span style="font-size: 9px; color: #94A3B8; line-height: 1;">${lm.subtitle}</span>
          </div>
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        setHoveredWaterway({
          name: lm.name,
          description: lm.subtitle,
        });
      });

      const marker = new maplibregl.Marker({
        element: el,
        anchor: 'center',
      })
        .setLngLat(lm.position)
        .addTo(map);

      markersRef.current.push(marker);
    });

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

  // Update dynamic layers when props change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    // Dynamically update swollen river channels based on simulation progression (currentTime)
    if (map.getSource('waterways-source')) {
      map.getSource('waterways-source').setData(getDynamicSwollenWaterways(currentFactor));
    }

    // Waterways visibility
    if (map.getLayer('waterways-fill')) {
      map.setLayoutProperty('waterways-fill', 'visibility', showWaterways ? 'visible' : 'none');
      map.setLayoutProperty('waterways-outline', 'visibility', showWaterways ? 'visible' : 'none');
    }

    // Flow vectors visibility
    if (map.getLayer('flow-vectors-line')) {
      map.setLayoutProperty('flow-vectors-line', 'visibility', showFlowVectors ? 'visible' : 'none');
    }

    // Inundation extent visibility & data sync
    if (map.getSource('sfincs-inundation-source')) {
      renderInundation(map, floodExtentGeoJson);
    }
    if (map.getLayer('sfincs-inundation-fill')) {
      map.setLayoutProperty('sfincs-inundation-fill', 'visibility', showInundation ? 'visible' : 'none');
      map.setLayoutProperty('sfincs-inundation-outline', 'visibility', showInundation ? 'visible' : 'none');
    }

    // Zone outlines visibility & data sync
    if (map.getSource('flood-zones-source')) {
      renderRiskLayers(map);
    }
    if (map.getLayer('flood-zones-fill')) {
      map.setLayoutProperty('flood-zones-fill', 'visibility', showZones ? 'visible' : 'none');
      map.setLayoutProperty('flood-zones-outline', 'visibility', showZones ? 'visible' : 'none');
    }

    // Smoothly fly to selected zone
    const geo = ZONE_COORDINATES[selectedZoneId];
    if (geo && map) {
      map.flyTo({
        center: geo.center,
        zoom: Math.max(map.getZoom(), 12.2),
        essential: true,
        speed: 1.2,
      });
    }
  }, [selectedZoneId, showWaterways, showFlowVectors, showInundation, showZones, floodExtentGeoJson, currentTime, currentFactor, mapLoaded]);

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

      {/* Dynamic Waterbody Swell Indicator */}
      <div className="absolute top-16 left-3 flex items-center gap-2 pointer-events-none z-20">
        <div className="bg-sky-950/95 backdrop-blur-xs text-sky-200 border border-sky-600/70 px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 shadow-md pointer-events-auto">
          <Waves className="w-3.5 h-3.5 text-sky-400 animate-pulse shrink-0" />
          <span>
            River Swell: <strong className="text-white font-bold">+{currentSwellMeters}m</strong> overtopping · {currentTime} IST
          </span>
        </div>
      </div>

      {/* Hover Waterway Tooltip */}
      {hoveredWaterway && (
        <div
          className="absolute z-40 pointer-events-none select-none bg-slate-900/95 text-white px-3 py-2 rounded-md shadow-lg text-xs transition-opacity duration-100 border border-sky-600/70 max-w-[280px]"
          style={{
            left: '50%',
            top: '20px',
            transform: 'translateX(-50%)',
          }}
        >
          <div className="font-bold flex items-center gap-1.5 text-sky-300">
            <Waves className="w-3.5 h-3.5 text-sky-400" />
            <span>{hoveredWaterway.name}</span>
          </div>
          <div className="text-[11px] text-slate-300 mt-0.5 leading-snug">
            {hoveredWaterway.description}
          </div>
          {hoveredWaterway.depthM != null && (
            <div className="text-[10px] text-sky-300 mt-1 font-mono font-semibold">
              Bed Level: {hoveredWaterway.depthM} m MSL
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
          onClick={() => setShowWaterways((prev) => !prev)}
          className={cn(
            'w-7 h-7 flex items-center justify-center rounded transition-colors cursor-pointer',
            showWaterways ? 'bg-sky-100 font-bold text-sky-800' : 'text-slate-700 hover:bg-slate-100'
          )}
          title="Toggle River Channels & Water Bodies"
          aria-label="Toggle Waterways Layer"
        >
          <Waves className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowFlowVectors((prev) => !prev)}
          className={cn(
            'w-7 h-7 flex items-center justify-center rounded transition-colors cursor-pointer',
            showFlowVectors ? 'bg-cyan-100 font-bold text-cyan-800' : 'text-slate-700 hover:bg-slate-100'
          )}
          title="Toggle Hydrodynamic Flow Direction Vectors"
          aria-label="Toggle Flow Vectors"
        >
          <Navigation className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setShowInundation((prev) => !prev)}
          className={cn(
            'w-7 h-7 flex items-center justify-center rounded transition-colors cursor-pointer',
            showInundation ? 'bg-blue-100 font-bold text-blue-800' : 'text-slate-700 hover:bg-slate-100'
          )}
          title="Toggle SFINCS Flood Inundation Extent"
          aria-label="Toggle Inundation Layer"
        >
          <Droplets className="w-4 h-4" />
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
          {/* River Channel */}
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-2 bg-sky-500 rounded-2xs border border-sky-700" />
            <span className="text-[10px] font-bold text-sky-900 uppercase">River Channel</span>
          </div>

          {/* Flow Direction */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-cyan-600 font-bold">➔</span>
            <span className="text-[10px] font-bold text-cyan-900 uppercase">Seaward Flow</span>
          </div>

          {/* Surge Penetration */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-rose-600 font-bold">➔</span>
            <span className="text-[10px] font-bold text-rose-900 uppercase">Surge Inflow</span>
          </div>

          {/* Inundation */}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-blue-500/40 border border-blue-400 border-dashed rounded-2xs" />
            <span className="text-[10px] font-bold text-blue-900 uppercase">Flood Extent</span>
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

        {/* Map Scale & OpenStreetMap Attribution */}
        <div className="bg-white/95 backdrop-blur-xs px-2.5 py-1.5 rounded-md border border-slate-200/90 shadow-2xs flex items-center gap-2 text-slate-500 text-[10px] font-medium pointer-events-auto">
          <div className="flex items-center gap-1">
            <span className="w-5 h-1 bg-slate-900 inline-block" />
            <span className="font-bold text-slate-900">1 km</span>
          </div>
          <span>·</span>
          <span>12.895°N, 74.825°E</span>
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
