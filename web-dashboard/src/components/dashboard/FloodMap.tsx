'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Minus, Layers, LocateFixed, Waves, Globe2 } from 'lucide-react';
import type { GeoJSONSource, Map as LibreMap, Marker } from 'maplibre-gl';
import type { CriticalFacility, ZoneData } from '@/types/dashboard';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';
import { emptyCollection, polygonBounds, polygonCollection, riverCollection, type RiverDisplayConfig } from '@/lib/river-map';

export interface FloodMapProps {
  zones: ZoneData[];
  selectedZoneId: string;
  onSelectZone: (zoneId: string) => void;
  facilities: CriticalFacility[];
  /** Validated frame geometry; no fallback flood extent is created. */
  floodExtentGeoJson?: Record<string, unknown> | null;
  /** Backend-owned illustrative river geometry for demo mode only. */
  demoRiverGeoJson?: Record<string, unknown> | null;
  nationalForecastExtentGeoJson?: Record<string, unknown> | null;
  /** Polygon features with properties.zoneId or properties.id for zone selection. */
  jurisdictionGeoJson?: Record<string, unknown> | null;
  forecastStatus?: string;
  mode?: 'official' | 'scenario' | 'replay' | 'demo';
  initialView?: 'india' | 'mangaluru';
  currentTime?: string;
  className?: string;
}

const INDIA_BOUNDS: [[number, number], [number, number]] = [[68, 6], [98, 38]];
const MANGALURU: [number, number] = [74.84, 12.91];
const BASEMAPS = {
  osm: { name: 'OSM', url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '© OpenStreetMap contributors' },
  light: { name: 'Light', url: 'https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png', attribution: '© OpenStreetMap contributors © CARTO' },
};
type Basemap = keyof typeof BASEMAPS;

export function FloodMap({
  zones, selectedZoneId, onSelectZone, facilities, floodExtentGeoJson,
  demoRiverGeoJson,
  nationalForecastExtentGeoJson, jurisdictionGeoJson, forecastStatus,
  mode = 'official', initialView = 'india', currentTime, className,
}: FloodMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const initialViewRef = useRef(initialView);
  const selectionRef = useRef(onSelectZone);
  const [loaded, setLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [config, setConfig] = useState<RiverDisplayConfig | null>(null);
  const [riverNotice, setRiverNotice] = useState('Loading river source configuration…');
  const [retry, setRetry] = useState(0);
  const [basemap, setBasemap] = useState<Basemap>('osm');
  const [showRivers, setShowRivers] = useState(true);
  const [showFlood, setShowFlood] = useState(true);
  const [showJurisdictions, setShowJurisdictions] = useState(true);
  const [hoveredRiver, setHoveredRiver] = useState<string | null>(null);
  const [facilityNotice, setFacilityNotice] = useState<string | null>(null);
  const extent = useMemo(() => polygonCollection(floodExtentGeoJson ?? nationalForecastExtentGeoJson), [floodExtentGeoJson, nationalForecastExtentGeoJson]);
  const jurisdictions = useMemo(() => polygonCollection(jurisdictionGeoJson), [jurisdictionGeoJson]);
  const selectedZone = zones.find((zone) => zone.id === selectedZoneId);

  useEffect(() => { selectionRef.current = onSelectZone; }, [onSelectZone]);

  useEffect(() => {
    let disposed = false;
    let instance: LibreMap | null = null;
    let observer: ResizeObserver | null = null;
    async function initialize() {
      try {
        const lib = await import('maplibre-gl');
        if (disposed || !containerRef.current) return;
        lib.setWorkerUrl('/maplibre-gl-worker.mjs');
        instance = new lib.Map({
          container: containerRef.current,
          style: {
            version: 8,
            sources: { basemap: { type: 'raster', tiles: [BASEMAPS.osm.url], tileSize: 256, attribution: BASEMAPS.osm.attribution } },
            layers: [{ id: 'basemap', type: 'raster', source: 'basemap' }],
          },
          center: initialViewRef.current === 'mangaluru' ? MANGALURU : [82, 22],
          zoom: initialViewRef.current === 'mangaluru' ? 11.5 : 3.3,
          attributionControl: { compact: true },
        });
        mapRef.current = instance;
        const map = instance;
        observer = new ResizeObserver(() => map.resize());
        observer.observe(containerRef.current);
        map.on('load', () => {
          if (disposed) return;
          for (const id of ['rivers-viewport', 'flood-extent', 'jurisdictions']) map.addSource(id, { type: 'geojson', data: emptyCollection(), ...(id === 'rivers-viewport' ? { attribution: '© OpenStreetMap contributors (ODbL)' } : {}) });
          map.addLayer({ id: 'rivers-local-halo', type: 'line', source: 'rivers-viewport', paint: { 'line-color': '#e0f2fe', 'line-width': 6, 'line-opacity': 0.8 } });
          map.addLayer({ id: 'rivers-local', type: 'line', source: 'rivers-viewport', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#0284c7', 'line-width': 2.5 } });
          map.addLayer({ id: 'flood-fill', type: 'fill', source: 'flood-extent', paint: { 'fill-color': '#dc2626', 'fill-opacity': 0.42 } });
          map.addLayer({ id: 'flood-outline', type: 'line', source: 'flood-extent', paint: { 'line-color': '#b91c1c', 'line-width': 1.5 } });
          // Neutral outlines are administrative coverage, not inundation or synthetic risk rectangles.
          map.addLayer({ id: 'jurisdiction-hit', type: 'fill', source: 'jurisdictions', paint: { 'fill-color': '#64748b', 'fill-opacity': 0.025 } });
          map.addLayer({ id: 'jurisdiction-outline', type: 'line', source: 'jurisdictions', paint: { 'line-color': '#475569', 'line-width': 1.4, 'line-dasharray': [3, 2] } });
          map.on('click', 'jurisdiction-hit', (event) => {
            const props = event.features?.[0]?.properties;
            const id = props?.zoneId ?? props?.id;
            if (typeof id === 'string') selectionRef.current(id);
          });
          map.on('mouseenter', 'rivers-local', (event) => setHoveredRiver(String(event.features?.[0]?.properties?.name || 'Unnamed mapped waterway')));
          map.on('mouseleave', 'rivers-local', () => setHoveredRiver(null));
          if (initialViewRef.current === 'india') map.fitBounds(INDIA_BOUNDS, { padding: 45, duration: 0 });
          setLoaded(true);
        });
        map.on('error', (event) => {
           if (disposed) return;
           if ('sourceId' in event && event.sourceId === 'rivers-vector') setRiverNotice('Configured river tiles unavailable. Check dataset URL, source layer, CORS, and coverage.');
           else if ('sourceId' in event && event.sourceId === 'basemap') setMapError('Basemap tiles unavailable; river and flood layers remain separate.');
           else setMapError('Map layer failed to load. Try the Mangalore button or switch basemap.');
        });
      } catch { if (!disposed) setMapError('Map could not be initialized. Check WebGL support and network access.'); }
    }
    void initialize();
    return () => {
      disposed = true;
      observer?.disconnect();
      markersRef.current.forEach((marker) => marker.remove());
      instance?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function loadConfig() {
      try {
        const response = await fetch(`${apiClient.getBaseUrl()}/api/v1/rivers/config`, { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error('River configuration unavailable');
        const data = await response.json() as RiverDisplayConfig;
        if (!data.viewport || !Number.isFinite(data.viewport.minZoom)) throw new Error('Invalid river configuration');
        if (!controller.signal.aborted) { setConfig(data); setRiverNotice(data.configurationWarning || data.notice); }
      } catch { if (!controller.signal.aborted) setRiverNotice('River source configuration unavailable. Retry to load real river data.'); }
    }
    void loadConfig();
    return () => controller.abort();
  }, [retry]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded || !config) return;
    let disposed = false;
    let controller: AbortController | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let generation = 0;
    const clearViewport = () => (map.getSource('rivers-viewport') as GeoJSONSource | undefined)?.setData(emptyCollection());
    const cancel = () => { generation++; controller?.abort(); if (timer) clearTimeout(timer); clearViewport(); };

    if (demoRiverGeoJson) {
      const demoRivers = riverCollection(demoRiverGeoJson);
      (map.getSource('rivers-viewport') as GeoJSONSource).setData(demoRivers);
      setRiverNotice('Backend demo waterways · synthetic preview, not operational data.');
      return;
    }
    if (config.vector) {
      if (!map.getSource('rivers-vector')) {
        map.addSource('rivers-vector', { type: 'vector', tiles: config.vector.tiles, attribution: config.vector.attribution });
        map.addLayer({ id: 'rivers-national', type: 'line', source: 'rivers-vector', 'source-layer': config.vector.sourceLayer, filter: ['==', ['geometry-type'], 'LineString'], layout: { visibility: showRivers ? 'visible' : 'none', 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#0284c7', 'line-width': ['interpolate', ['linear'], ['zoom'], 3, 1, 12, 3] } }, 'flood-fill');
      }
      clearViewport();
      return;
    }
    if (map.getLayer('rivers-national')) map.removeLayer('rivers-national');
    if (map.getSource('rivers-vector')) map.removeSource('rivers-vector');
    async function loadViewport() {
      cancel();
      const requestGeneration = generation;
      const bounds = map!.getBounds();
      const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
      const spanX = bbox[2] - bbox[0], spanY = bbox[3] - bbox[1];
      if (!showRivers) { setRiverNotice('River highlighting hidden.'); return; }
      if (bbox[2] < 68 || bbox[0] > 98 || bbox[3] < 6 || bbox[1] > 38) { setRiverNotice('Viewport river service covers the India display domain.'); return; }
      if (map!.getZoom() < config!.viewport.minZoom || spanX > config!.viewport.maxSpanDegrees || spanY > config!.viewport.maxSpanDegrees || spanX * spanY > config!.viewport.maxAreaDegrees) {
        setRiverNotice('National river highlighting unavailable without vector tiles. Zoom in to load real OSM waterways.');
        return;
      }
      controller = new AbortController();
      const signal = controller.signal;
      setRiverNotice('Loading mapped OSM waterways for this viewport…');
      try {
        const response = await fetch(`${apiClient.getBaseUrl()}/api/v1/rivers?bbox=${encodeURIComponent(bbox.map((value) => value.toFixed(5)).join(','))}`, { signal, cache: 'no-store' });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'OSM waterways unavailable');
        const geometry = riverCollection(data.geojson);
        if (disposed || signal.aborted || requestGeneration !== generation) return;
        (map!.getSource('rivers-viewport') as GeoJSONSource).setData(geometry);
        setRiverNotice(data.coverage?.status === 'limited' ? 'OSM results limited; zoom in for more complete mapped coverage.' : geometry.features.length ? `${geometry.features.length} mapped waterways · OSM viewport coverage (not flood extent)` : 'No OSM river, stream, or canal geometry returned for this viewport.');
      } catch (error) {
        if (!disposed && !signal.aborted && requestGeneration === generation) setRiverNotice(error instanceof Error ? error.message : 'OSM waterways unavailable. Retry or zoom in.');
      }
    }
    const schedule = () => { cancel(); timer = setTimeout(() => { void loadViewport(); }, 350); };
    map.on('movestart', cancel);
    map.on('moveend', schedule);
    schedule();
    return () => { disposed = true; cancel(); map.off('movestart', cancel); map.off('moveend', schedule); };
  }, [loaded, config, demoRiverGeoJson, showRivers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    (map.getSource('flood-extent') as GeoJSONSource).setData(extent);
    (map.getSource('jurisdictions') as GeoJSONSource).setData(jurisdictions);
    for (const id of ['rivers-local', 'rivers-local-halo', 'rivers-national']) if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', showRivers ? 'visible' : 'none');
    for (const id of ['flood-fill', 'flood-outline']) map.setLayoutProperty(id, 'visibility', showFlood ? 'visible' : 'none');
    for (const id of ['jurisdiction-hit', 'jurisdiction-outline']) map.setLayoutProperty(id, 'visibility', showJurisdictions ? 'visible' : 'none');
  }, [loaded, extent, jurisdictions, showRivers, showFlood, showJurisdictions]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    const tiles = BASEMAPS[basemap];
    // Keep the original source/layer alive. Removing a raster source during a
    // style-load transition can leave MapLibre with a blank canvas on some
    // browsers. RasterTileSource.setTiles swaps the URL without tearing down
    // the loaded style.
    const source = map.getSource('basemap') as (GeoJSONSource & { setTiles?: (urls: string[]) => void }) | undefined;
    if (source && typeof source.setTiles === 'function') source.setTiles([tiles.url]);
  }, [basemap, loaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    let disposed = false;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    // Legacy x/y are screen pixels, not GPS. Render only supplied WGS84 facilities.
    void import('maplibre-gl').then((lib) => {
      if (disposed) return;
      for (const facility of facilities) {
        const location = facility as CriticalFacility & { longitude?: number; latitude?: number };
        if (typeof location.longitude !== 'number' || typeof location.latitude !== 'number' || !Number.isFinite(location.longitude) || !Number.isFinite(location.latitude) || Math.abs(location.longitude) > 180 || Math.abs(location.latitude) > 90) continue;
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = '✚';
        button.title = facility.name;
        button.setAttribute('aria-label', facility.name);
        button.className = 'rounded-full bg-slate-900 text-white border-2 border-white w-6 h-6 shadow';
        button.addEventListener('click', () => { selectionRef.current(facility.zoneId); setFacilityNotice(facility.name); });
        const marker = new lib.Marker({ element: button }).setLngLat([location.longitude, location.latitude]).addTo(map);
        markersRef.current.push(marker);
      }
    });
    return () => { disposed = true; markersRef.current.forEach((marker) => marker.remove()); markersRef.current = []; };
  }, [facilities, loaded]);

  function focusJurisdiction() {
    const feature = jurisdictions.features.find((item) => String(item.properties?.zoneId ?? item.properties?.id ?? item.id) === selectedZoneId);
    const bounds = polygonBounds(feature ?? jurisdictionGeoJson);
    if (bounds) mapRef.current?.fitBounds(bounds, { padding: 65, maxZoom: 13 });
  }

  const toolbarClass = 'w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 text-slate-700 cursor-pointer';
  return (
    <div className={cn('relative w-full h-[380px] lg:h-[430px] xl:h-[480px] bg-slate-100 rounded-lg overflow-hidden border border-slate-200', className)}>
      <div ref={containerRef} className="absolute inset-0" aria-label="India river and flood extent map" />
      <div className="absolute top-3 left-3 right-14 z-10 flex flex-wrap gap-2">
        <button onClick={() => mapRef.current?.fitBounds(INDIA_BOUNDS, { padding: 45 })} className="rounded bg-slate-900 text-white px-3 py-1.5 text-xs flex items-center gap-1"><Globe2 className="w-3.5 h-3.5" />India</button>
        <button onClick={() => mapRef.current?.flyTo({ center: MANGALURU, zoom: 11.5 })} className="rounded bg-white text-slate-800 px-3 py-1.5 text-xs border">Mangalore</button>
        {selectedZone && <button onClick={focusJurisdiction} className="rounded bg-white text-slate-800 px-2 py-1.5 text-xs border">{selectedZone.name}</button>}
        <select value={basemap} onChange={(event) => setBasemap(event.target.value as Basemap)} className="rounded bg-white text-slate-800 px-2 py-1 text-xs border" aria-label="Basemap">
          {Object.entries(BASEMAPS).map(([id, tiles]) => <option key={id} value={id}>{tiles.name}</option>)}
        </select>
      </div>
      <div className="absolute top-14 left-3 right-14 z-10 space-y-1 pointer-events-none">
        <div role="status" className="bg-white/95 border rounded px-2.5 py-1.5 text-[11px] text-slate-800 shadow-sm">
          {riverNotice}
          <button onClick={() => setRetry((value) => value + 1)} className="ml-2 underline text-sky-700 pointer-events-auto">Retry rivers</button>
        </div>
        <div className="bg-white/95 border rounded px-2.5 py-1 text-[11px] text-slate-700">
           {mode === 'scenario' ? 'Private scenario extent' : mode === 'demo' ? 'Illustrative Mangaluru demo extent' : mode === 'replay' ? 'Historical replay extent' : 'Official forecast extent'}{currentTime ? ` · ${currentTime}` : ''}: {forecastStatus || (extent.features.length ? 'supplied geometry shown in red' : 'no flood extent available')}
        </div>
        {mapError && <div role="alert" className="bg-amber-50 border border-amber-300 rounded px-2.5 py-1 text-xs text-amber-900">{mapError}</div>}
        {(hoveredRiver || facilityNotice) && <div className="inline-block bg-slate-900 text-white rounded px-2 py-1 text-xs">{hoveredRiver ? `${hoveredRiver} · mapped waterway, not modeled depth` : facilityNotice}</div>}
      </div>
      <div className="absolute top-3 right-3 z-10 bg-white/95 border rounded p-1 shadow-sm">
        <button onClick={() => mapRef.current?.zoomIn()} className={toolbarClass} title="Zoom in" aria-label="Zoom in"><Plus className="w-4 h-4" /></button>
        <button onClick={() => mapRef.current?.zoomOut()} className={toolbarClass} title="Zoom out" aria-label="Zoom out"><Minus className="w-4 h-4" /></button>
        <button onClick={() => setShowRivers((value) => !value)} className={cn(toolbarClass, showRivers && 'bg-sky-100')} title="Toggle mapped waterways" aria-label="Toggle mapped waterways" aria-pressed={showRivers}><Waves className="w-4 h-4 text-sky-700" /></button>
        <button onClick={() => setShowFlood((value) => !value)} className={cn(toolbarClass, showFlood && 'bg-red-50')} title="Toggle supplied flood extent" aria-label="Toggle supplied flood extent" aria-pressed={showFlood}><Waves className="w-4 h-4 text-red-700" /></button>
        <button onClick={() => setShowJurisdictions((value) => !value)} className={cn(toolbarClass, showJurisdictions && 'bg-slate-100')} title="Toggle jurisdiction boundaries" aria-label="Toggle jurisdiction boundaries" aria-pressed={showJurisdictions}><Layers className="w-4 h-4" /></button>
        <button onClick={focusJurisdiction} className={toolbarClass} title="Focus supplied jurisdiction geometry" aria-label="Focus jurisdiction"><LocateFixed className="w-4 h-4" /></button>
      </div>
      <div className="absolute bottom-8 left-3 right-3 z-10 flex flex-wrap gap-3 bg-white/95 rounded border px-2.5 py-1.5 text-[10px] text-slate-800 w-fit">
        <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-sky-600" />Mapped waterways (blue)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-red-600/40 border border-red-700" />Supplied flood extent (red)</span>
        <span className="flex items-center gap-1.5"><span className="w-4 border-t border-dashed border-slate-600" />Jurisdiction boundary</span>
      </div>
    </div>
  );
}
