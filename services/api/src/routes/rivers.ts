import { Hono } from 'hono';
import {
  createRiverService, getRiverConfig, parseRiverBbox, validateRiverZoom,
  RiverBboxError, RiverUnavailableError, type RiverEnvironment,
} from '../services/river.service.js';

function environment(bindings: RiverEnvironment = {}): RiverEnvironment {
  const processEnv = typeof process !== 'undefined' ? process.env : {};
  return {
    OVERPASS_API_URL: bindings.OVERPASS_API_URL ?? processEnv.OVERPASS_API_URL,
    RIVER_VECTOR_TILE_URL: bindings.RIVER_VECTOR_TILE_URL ?? processEnv.RIVER_VECTOR_TILE_URL,
    RIVER_VECTOR_SOURCE_LAYER: bindings.RIVER_VECTOR_SOURCE_LAYER ?? processEnv.RIVER_VECTOR_SOURCE_LAYER,
    RIVER_ATTRIBUTION: bindings.RIVER_ATTRIBUTION ?? processEnv.RIVER_ATTRIBUTION,
  };
}

/** Mount at /api/v1/rivers. The factory provides isolated mocked-fetch tests. */
export function createRiversRouter(service = createRiverService()) {
  const router = new Hono<{ Bindings: RiverEnvironment }>();
  router.get('/config', (c) => c.json(getRiverConfig(environment(c.env))));
  router.get('/', async (c) => {
    try {
      const bbox = parseRiverBbox(c.req.query('bbox'));
      validateRiverZoom(c.req.query('zoom'));
      return c.json(await service.getRivers(bbox, environment(c.env)));
    } catch (error) {
      if (error instanceof RiverBboxError || error instanceof RiverUnavailableError) {
        return c.json({ success: false, error: error.message }, error.status);
      }
      throw error;
    }
  });
  return router;
}

export const riversRouter = createRiversRouter();
