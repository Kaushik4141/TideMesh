/** Bounded OSM viewport mapping, not a hydraulic network or validated model. */
export type RiverBbox = readonly [west: number, south: number, east: number, north: number];
export const RIVER_SOURCE = 'OpenStreetMap';
export const RIVER_ATTRIBUTION = '© OpenStreetMap contributors (ODbL)';
export const RIVER_COVERAGE_NOTE =
  'OSM mapping may be incomplete; these waterways are not a hydraulic network or a validated model.';
export const RIVER_BBOX_LIMITS = { minZoom: 10, maxSpanDegrees: 0.5, maxAreaDegrees: 0.1 } as const;
export const RIVER_REQUEST_LIMITS = {
  timeoutMs: 8_000,
  cacheTtlMs: 300_000,
  maxCachedViewports: 24,
  maxResponseBytes: 2 * 1024 * 1024,
  maxFeatures: 2_000,
  maxCoordinates: 100_000,
} as const;
export const DEFAULT_OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

export type RiverEnvironment = {
  OVERPASS_API_URL?: string;
  RIVER_VECTOR_TILE_URL?: string;
  RIVER_VECTOR_SOURCE_LAYER?: string;
  RIVER_ATTRIBUTION?: string;
};

export class RiverBboxError extends Error {
  constructor(message: string, public readonly status: 400 | 422) {
    super(message);
    this.name = 'RiverBboxError';
  }
}

export class RiverUnavailableError extends Error {
  readonly status = 503;
  constructor(message = 'OSM waterways unavailable. Retry or zoom in.') {
    super(message);
    this.name = 'RiverUnavailableError';
  }
}

export function parseRiverBbox(value: string | undefined): RiverBbox {
  if (!value) throw new RiverBboxError('bbox is required as west,south,east,north', 400);
  const parts = value.split(',').map((part) => part.trim());
  if (parts.length !== 4 || parts.some((part) => part === '')) {
    throw new RiverBboxError('bbox must be west,south,east,north', 400);
  }
  const bbox = parts.map(Number) as [number, number, number, number];
  const [west, south, east, north] = bbox;
  if (!bbox.every(Number.isFinite) || west < -180 || east > 180 || south < -90 || north > 90 || west >= east || south >= north) {
    throw new RiverBboxError('bbox must contain ordered WGS84 coordinates', 400);
  }
  // Allow only floating-point rounding noise at the exact configured boundary.
  if (east - west > RIVER_BBOX_LIMITS.maxSpanDegrees + 1e-12 || north - south > RIVER_BBOX_LIMITS.maxSpanDegrees + 1e-12 ||
      (east - west) * (north - south) > RIVER_BBOX_LIMITS.maxAreaDegrees + 1e-12) {
    throw new RiverBboxError('bbox is too large; zoom in for the bounded river viewport endpoint', 422);
  }
  return bbox;
}

export function validateRiverZoom(value: string | undefined): void {
  // The current map supplies bbox only and enforces minZoom using /config.
  if (value !== undefined && (!value.trim() || !Number.isFinite(Number(value)) || Number(value) < RIVER_BBOX_LIMITS.minZoom)) {
    throw new RiverBboxError('River viewport requests require zoom 10 or greater', 422);
  }
}

/** Deployment URLs only: HTTPS, or HTTP on explicit loopback hosts for local tiles/tests. */
export function isRiverUrlAllowed(value: string): boolean {
  try {
    const url = new URL(value);
    return !url.username && !url.password && !url.hash &&
      (url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)));
  } catch {
    return false;
  }
}

export function getRiverConfig(env: RiverEnvironment = {}) {
  const tiles = env.RIVER_VECTOR_TILE_URL?.trim();
  const sourceLayer = env.RIVER_VECTOR_SOURCE_LAYER?.trim();
  const attribution = env.RIVER_ATTRIBUTION?.trim() || RIVER_ATTRIBUTION;
  let configurationWarning: string | undefined;
  let vector: { tiles: string[]; sourceLayer: string; attribution: string; coverage: string } | null = null;
  if (tiles || sourceLayer) {
    if (!tiles || !sourceLayer) {
      configurationWarning = 'River vector tiles require both RIVER_VECTOR_TILE_URL and RIVER_VECTOR_SOURCE_LAYER.';
    } else if (!['{z}', '{x}', '{y}'].every((token) => tiles.includes(token)) ||
        /\{(?![zxy]\})/.test(tiles) || !isRiverUrlAllowed(tiles.replace(/\{[zxy]\}/g, '0')) ||
        /[\x00-\x1f\x7f]/.test(sourceLayer) || sourceLayer.length > 256) {
      configurationWarning = 'Invalid river vector configuration: use an HTTPS (or HTTP loopback) {z}/{x}/{y} tile template and explicit source layer.';
    } else {
      vector = { tiles: [tiles], sourceLayer, attribution, coverage: 'Configured vector dataset; geographic coverage depends on the supplied dataset.' };
    }
  }
  return {
    vector,
    viewport: { endpoint: '/api/v1/rivers', ...RIVER_BBOX_LIMITS, attribution },
    nationalAvailable: vector !== null,
    notice: `${vector ? 'Configured river vector tiles are available.' : 'National river vector tiles are not configured; zoom in for bounded OSM viewport mapping.'} ${RIVER_COVERAGE_NOTE}`,
    ...(configurationWarning ? { configurationWarning } : {}),
  };
}

export type RiverFeature = {
  type: 'Feature';
  id: string;
  properties: { name: string; waterway: 'river' | 'stream' | 'canal'; source: typeof RIVER_SOURCE; osmWayId: number };
  geometry: { type: 'LineString'; coordinates: [number, number][] };
};
export type RiverGeoJSON = { type: 'FeatureCollection'; features: RiverFeature[] };
export type RiverResponse = {
  success: true;
  geojson: RiverGeoJSON;
  coverage: { status: 'mapped' | 'limited'; source: typeof RIVER_SOURCE; note: string };
};

export function buildRiverOverpassQuery(bbox: RiverBbox): string {
  const [west, south, east, north] = parseRiverBbox(bbox.join(','));
  return `[out:json][timeout:7][maxsize:${RIVER_REQUEST_LIMITS.maxResponseBytes}];way["waterway"~"^(river|stream|canal)$"](${south},${west},${north},${east});out geom;`;
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Reject partial/error payloads, including Overpass's HTTP-200 timeout remarks. */
export function overpassToRiverResponse(value: unknown): RiverResponse {
  if (!record(value) || !Array.isArray(value.elements) || value.remark || value.elements.length > 10_000) {
    throw new RiverUnavailableError('OSM returned an incomplete or invalid response. Retry or zoom in.');
  }
  const features: RiverFeature[] = [];
  const seen = new Set<number>();
  let coordinatesCount = 0;
  let limited = false;
  for (const element of value.elements) {
    if (!record(element)) throw new RiverUnavailableError();
    if (element.type !== 'way') continue;
    if (!Number.isSafeInteger(element.id) || Number(element.id) <= 0 || !record(element.tags)) continue;
    const waterway = element.tags.waterway;
    if (waterway !== 'river' && waterway !== 'stream' && waterway !== 'canal') continue;
    if (!Array.isArray(element.geometry) || element.geometry.length < 2) throw new RiverUnavailableError();
    const coordinates: [number, number][] = [];
    for (const point of element.geometry) {
      if (!record(point) || typeof point.lon !== 'number' || typeof point.lat !== 'number' ||
          !Number.isFinite(point.lon) || !Number.isFinite(point.lat) || Math.abs(point.lon) > 180 || Math.abs(point.lat) > 90) {
        throw new RiverUnavailableError();
      }
      coordinates.push([point.lon, point.lat]);
    }
    const id = Number(element.id);
    if (seen.has(id)) continue;
    seen.add(id);
    if (features.length >= RIVER_REQUEST_LIMITS.maxFeatures || coordinatesCount + coordinates.length > RIVER_REQUEST_LIMITS.maxCoordinates) {
      limited = true;
      continue;
    }
    coordinatesCount += coordinates.length;
    features.push({
      type: 'Feature', id: `osm-way-${id}`,
      properties: { name: typeof element.tags.name === 'string' ? element.tags.name : 'Unnamed mapped waterway', waterway, source: RIVER_SOURCE, osmWayId: id },
      geometry: { type: 'LineString', coordinates },
    });
  }
  // An oversized way cannot masquerade as a genuinely empty viewport.
  if (limited && features.length === 0) throw new RiverUnavailableError('OSM geometry exceeds viewport limits. Zoom in.');
  features.sort((a, b) => a.properties.osmWayId - b.properties.osmWayId);
  return {
    success: true, geojson: { type: 'FeatureCollection', features },
    coverage: { status: limited ? 'limited' : 'mapped', source: RIVER_SOURCE, note: `${RIVER_COVERAGE_NOTE}${limited ? ' Result limits reached; zoom in for more mapped geometry.' : ''}` },
  };
}

async function readBoundedOverpass(response: Response): Promise<unknown> {
  if (!response.ok) throw new RiverUnavailableError();
  const length = response.headers.get('content-length');
  if (length && Number(length) > RIVER_REQUEST_LIMITS.maxResponseBytes) {
    void response.body?.cancel().catch(() => {});
    throw new RiverUnavailableError('OSM response exceeds viewport limits. Zoom in.');
  }
  if (!response.body) throw new RiverUnavailableError();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > RIVER_REQUEST_LIMITS.maxResponseBytes) throw new RiverUnavailableError('OSM response exceeds viewport limits. Zoom in.');
      chunks.push(chunk.value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } finally {
    void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

/** One upstream request, no queue; bounded TTL/LRU cache. Fetch and clock are injectable. */
export function createRiverService(options: { fetch?: typeof fetch; now?: () => number; timeoutMs?: number } = {}) {
  const fetcher: typeof fetch = options.fetch ?? ((...args) => globalThis.fetch(...args));
  const now = options.now ?? Date.now;
  const timeoutMs = Math.min(RIVER_REQUEST_LIMITS.timeoutMs, Math.max(1, options.timeoutMs ?? RIVER_REQUEST_LIMITS.timeoutMs));
  const cache = new Map<string, { expiresAt: number; data: RiverResponse }>();
  let inFlight: { key: string; promise: Promise<RiverResponse> } | undefined;

  async function getRivers(bbox: RiverBbox, env: RiverEnvironment = {}): Promise<RiverResponse> {
    const query = buildRiverOverpassQuery(bbox);
    const endpoint = env.OVERPASS_API_URL?.trim() || DEFAULT_OVERPASS_API_URL;
    if (!isRiverUrlAllowed(endpoint) || /[{}]/.test(endpoint)) throw new RiverUnavailableError('Invalid server Overpass configuration.');
    const key = `${endpoint}|${bbox.join(',')}`;
    for (const [cachedKey, entry] of cache) if (entry.expiresAt <= now()) cache.delete(cachedKey);
    const cached = cache.get(key);
    if (cached) {
      cache.delete(key); cache.set(key, cached);
      return structuredClone(cached.data);
    }
    if (inFlight) {
      if (inFlight.key === key) return structuredClone(await inFlight.promise);
      throw new RiverUnavailableError('OSM viewport service is busy. Retry shortly.');
    }
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(new RiverUnavailableError('OSM viewport request timed out. Retry or zoom in.'));
      }, timeoutMs);
    });
    const request = async () => {
      const response = await fetcher(endpoint, {
        method: 'POST', redirect: 'error', signal: controller.signal,
        headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
        body: new URLSearchParams({ data: query }).toString(),
      });
      return overpassToRiverResponse(await readBoundedOverpass(response));
    };
    const promise = Promise.race([request(), timeout]);
    inFlight = { key, promise };
    try {
      const data = await promise;
      if (cache.size >= RIVER_REQUEST_LIMITS.maxCachedViewports) cache.delete(cache.keys().next().value!);
      cache.set(key, { expiresAt: now() + RIVER_REQUEST_LIMITS.cacheTtlMs, data });
      return structuredClone(data);
    } catch (error) {
      controller.abort();
      if (error instanceof RiverUnavailableError) throw error;
      throw new RiverUnavailableError();
    } finally {
      clearTimeout(timer);
      inFlight = undefined;
    }
  }
  return { getRivers };
}
