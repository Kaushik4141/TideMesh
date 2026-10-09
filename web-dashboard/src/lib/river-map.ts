import type { Feature, FeatureCollection, LineString, MultiPolygon, Polygon, Position } from 'geojson';

export interface RiverDisplayConfig {
  vector: { tiles: string[]; sourceLayer: string; attribution: string; coverage: string } | null;
  viewport: { endpoint: string; minZoom: number; maxSpanDegrees: number; maxAreaDegrees: number; attribution: string };
  nationalAvailable: boolean;
  notice: string;
  configurationWarning?: string | null;
}

export const emptyCollection = (): FeatureCollection => ({ type: 'FeatureCollection', features: [] });
const isPosition = (value: unknown): value is Position => Array.isArray(value) && value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number' && Number.isFinite(value[0]) && Number.isFinite(value[1]) && Math.abs(value[0]) <= 180 && Math.abs(value[1]) <= 90;
const isRing = (value: unknown): value is Position[] => Array.isArray(value) && value.length >= 4 && value.every(isPosition) && value[0][0] === value[value.length - 1][0] && value[0][1] === value[value.length - 1][1];
const isPolygon = (value: unknown): value is Position[][] => Array.isArray(value) && value.length > 0 && value.every(isRing);

/** Accept real polygon GeoJSON only. Lines and malformed rings are never flood fills. */
export function polygonCollection(value: unknown): FeatureCollection<Polygon | MultiPolygon> {
  const result: FeatureCollection<Polygon | MultiPolygon> = { type: 'FeatureCollection', features: [] };
  if (!value || typeof value !== 'object') return result;
  const data = value as { type?: string; features?: unknown[]; geometry?: unknown; coordinates?: unknown };
  const candidates = data.type === 'FeatureCollection' && Array.isArray(data.features) ? data.features : data.type === 'Feature' ? [data] : [{ type: 'Feature', geometry: data, properties: {} }];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object') continue;
    const feature = candidate as Feature;
    const geometry = feature.geometry;
    if (!geometry) continue;
    if ((geometry.type === 'Polygon' && isPolygon(geometry.coordinates)) || (geometry.type === 'MultiPolygon' && Array.isArray(geometry.coordinates) && geometry.coordinates.length > 0 && geometry.coordinates.every(isPolygon))) {
      result.features.push({ type: 'Feature', ...(typeof feature.id === 'string' || typeof feature.id === 'number' ? { id: feature.id } : {}), properties: feature.properties && typeof feature.properties === 'object' ? feature.properties : {}, geometry });
    }
  }
  return result;
}

export function riverCollection(value: unknown): FeatureCollection<LineString> {
  if (!value || typeof value !== 'object' || !Array.isArray((value as FeatureCollection).features)) throw new Error('Invalid river geometry response');
  const features = (value as FeatureCollection).features;
  if (features.some((feature) => feature?.type !== 'Feature' || feature.geometry?.type !== 'LineString' || feature.geometry.coordinates.length < 2 || !feature.geometry.coordinates.every(isPosition))) throw new Error('Invalid river geometry response');
  return value as FeatureCollection<LineString>;
}

/** Bounds come only from valid geometries, never names, zone IDs, or pixel coordinates. */
export function polygonBounds(value: unknown): [[number, number], [number, number]] | null {
  const collection = polygonCollection(value);
  let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity;
  for (const feature of collection.features) {
    const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
    for (const polygon of polygons) for (const ring of polygon) for (const [lon, lat] of ring) {
      west = Math.min(west, lon); south = Math.min(south, lat); east = Math.max(east, lon); north = Math.max(north, lat);
    }
  }
  return Number.isFinite(west) ? [[west, south], [east, north]] : null;
}
