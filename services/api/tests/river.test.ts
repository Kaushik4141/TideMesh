import assert from 'node:assert/strict';
import { Hono } from 'hono';
import { createRiversRouter } from '../src/routes/rivers.js';
import {
  buildRiverOverpassQuery,
  createRiverService,
  DEFAULT_OVERPASS_API_URL,
  getRiverConfig,
  overpassToRiverResponse,
  parseRiverBbox,
  RIVER_REQUEST_LIMITS,
} from '../src/services/river.service.js';

const bbox = parseRiverBbox('77,12,77.1,12.1');
const overpassPayload = {
  version: 0.6,
  elements: [
    { type: 'way', id: 22, tags: { waterway: 'stream', name: 'Test stream' }, geometry: [{ lon: 77, lat: 12 }, { lon: 77.05, lat: 12.05 }] },
    { type: 'way', id: 11, tags: { waterway: 'river' }, geometry: [{ lon: 77.01, lat: 12.02 }, { lon: 77.08, lat: 12.08 }] },
  ],
};

function response(payload: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(payload), { status: 200, headers: { 'content-type': 'application/json' }, ...init });
}

export async function runRiverTests() {
  assert.match(buildRiverOverpassQuery(bbox), /way\["waterway"~"\^\(river\|stream\|canal\)\$"\]/);
  assert.match(buildRiverOverpassQuery(bbox), /\(12,77,12\.1,77\.1\)/);
  assert.throws(() => parseRiverBbox('0,0,0.51,0.1'), /too large/);
  assert.throws(() => parseRiverBbox('0,0,0.5,0.201'), /too large/);
  assert.throws(() => parseRiverBbox('0,0,6,1'), /too large/);
  for (const invalid of [undefined, '', '1,2,3', '1,,3,4', 'NaN,0,1,1', '181,0,182,1', '0,-91,1,0', '1,0,0,1', '0,0,1,0']) {
    assert.throws(() => parseRiverBbox(invalid), `must reject ${invalid}`);
  }

  const transformed = overpassToRiverResponse(overpassPayload);
  assert.equal(transformed.success, true);
  assert.deepEqual(transformed.geojson.features.map((feature) => feature.id), ['osm-way-11', 'osm-way-22']);
  assert.equal(transformed.geojson.features[0].properties.source, 'OpenStreetMap');
  assert.equal('verified' in transformed.geojson.features[0].properties, false);
  assert.equal(transformed.coverage.status, 'mapped');
  assert.deepEqual(overpassToRiverResponse({ version: 0.6, elements: [] }).geojson.features, []);
  assert.throws(() => overpassToRiverResponse({ elements: [], remark: 'timeout' }), /incomplete/);

  let calls = 0;
  const service = createRiverService({
    fetch: async (input, init) => {
      calls++;
      assert.equal(input, DEFAULT_OVERPASS_API_URL);
      assert.equal(init?.method, 'POST');
      assert.match(String(init?.body), /data=%5Bout%3Ajson%5D/);
      return response(overpassPayload);
    },
    now: () => 100,
  });
  const first = await service.getRivers(bbox);
  const second = await service.getRivers(bbox);
  assert.equal(calls, 1, 'same viewport should use TTL cache');
  assert.deepEqual(second, first);
  second.geojson.features.length = 0;
  assert.equal((await service.getRivers(bbox)).geojson.features.length, 2, 'cached response is cloned');

  let concurrentCalls = 0;
  let release!: () => void;
  const concurrent = createRiverService({
    fetch: () => {
      concurrentCalls++;
      return new Promise<Response>((resolve) => { release = () => resolve(response(overpassPayload)); });
    },
  });
  const pending = concurrent.getRivers(bbox);
  await assert.rejects(() => concurrent.getRivers(parseRiverBbox('77.2,12,77.3,12.1')), /busy/);
  release();
  await pending;
  assert.equal(concurrentCalls, 1);

  const app = new Hono().route('/api/v1/rivers', createRiversRouter(createRiverService({ fetch: async () => response(overpassPayload) })));
  const mapped = await app.request('/api/v1/rivers?bbox=77,12,77.1,12.1');
  assert.equal(mapped.status, 200);
  const mappedBody = await mapped.json() as { geojson?: { type?: string } };
  assert.deepEqual(mappedBody.geojson?.type, 'FeatureCollection');
  assert.equal((await app.request('/api/v1/rivers?bbox=0,0,6,1')).status, 422);
  assert.equal((await app.request('/api/v1/rivers')).status, 400);
  const failedApp = new Hono().route('/api/v1/rivers', createRiversRouter(createRiverService({ fetch: async () => response({}, { status: 500 }) })));
  assert.equal((await failedApp.request('/api/v1/rivers?bbox=77,12,77.1,12.1')).status, 503);
  const malformedApp = new Hono().route('/api/v1/rivers', createRiversRouter(createRiverService({ fetch: async () => new Response('{"elements":', { status: 200 }) })));
  assert.equal((await malformedApp.request('/api/v1/rivers?bbox=77,12,77.1,12.1')).status, 503);
  let aborted = false;
  const timeoutService = createRiverService({
    timeoutMs: 1,
    fetch: (_input, init) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => { aborted = true; reject(new DOMException('Aborted', 'AbortError')); });
    }),
  });
  await assert.rejects(() => timeoutService.getRivers(bbox), /timed out/);
  assert.equal(aborted, true);

  const config = getRiverConfig({ RIVER_VECTOR_TILE_URL: 'https://tiles.example/{z}/{x}/{y}.pbf', RIVER_VECTOR_SOURCE_LAYER: 'waterways' });
  assert.deepEqual(config.vector?.tiles, ['https://tiles.example/{z}/{x}/{y}.pbf']);
  assert.equal(config.vector?.sourceLayer, 'waterways');
  assert.equal(getRiverConfig({ RIVER_VECTOR_TILE_URL: 'https://tiles.example/{z}/{x}/{y}.pbf' }).vector, null);
  assert.ok(getRiverConfig({ RIVER_VECTOR_TILE_URL: 'ftp://tiles.example/{z}/{x}/{y}.pbf', RIVER_VECTOR_SOURCE_LAYER: 'guess' }).configurationWarning);
  assert.equal(RIVER_REQUEST_LIMITS.timeoutMs, 8_000);
  console.log('✓ river Overpass mapping, bounds, caching, config, and failure tests');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runRiverTests().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
