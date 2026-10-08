import type { Comparison, RunSnapshot } from '../../../../packages/contracts/src/comparison';

export type ComparisonMapMode = 'baseline' | 'scenario' | 'difference';
type Geometry = NonNullable<RunSnapshot['floodGeometry']>;
type MapFeature = { type: 'Feature'; geometry: Geometry; properties: Record<string, string | boolean> };
type MapCollection = { type: 'FeatureCollection'; features: MapFeature[] };

function collection(features: MapFeature[]): MapCollection {
  return { type: 'FeatureCollection', features };
}

// All map modes are peak summaries of exact run artifacts, never timestep fixtures.
export function comparisonMapData(comparison: Comparison, mode: ComparisonMapMode) {
  const geometry = mode === 'difference' ? comparison.delta.newlyInundatedGeometry : comparison[mode].floodGeometry;
  const assets = mode === 'difference' ? comparison.delta.newlyAffectedAssets : comparison.assets;
  const selectedAssets = assets?.filter(asset => mode === 'difference' ||
    (mode === 'baseline' ? asset.baselineAffected : asset.scenarioAffected));
  const extent = collection(geometry ? [{ type: 'Feature', geometry, properties: { mode } }] : []);
  const assetData = collection((selectedAssets ?? []).map(asset => ({
    type: 'Feature', geometry: asset.geometry,
    properties: { id: asset.id, name: asset.name ?? asset.id, kind: asset.kind,
      baselineAffected: asset.baselineAffected, scenarioAffected: asset.scenarioAffected },
  })));
  return { extent, assets: assetData, geometryAvailable: geometry !== null,
    assetsAvailable: assets !== null, bounds: geometryBounds(geometry) };
}

function geometryBounds(geometry: Geometry | null): [[number, number], [number, number]] | null {
  let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity;
  function visit(value: unknown) {
    if (!Array.isArray(value)) return;
    if (value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
      if (!Number.isFinite(value[0]) || !Number.isFinite(value[1])) return;
      west = Math.min(west, value[0]); east = Math.max(east, value[0]);
      south = Math.min(south, value[1]); north = Math.max(north, value[1]);
    } else value.forEach(visit);
  }
  visit(geometry?.coordinates);
  return west === Infinity ? null : [[west, south], [east, north]];
}
