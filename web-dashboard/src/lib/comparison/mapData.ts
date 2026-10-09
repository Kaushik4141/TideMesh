import type { Comparison, RunSnapshot } from '../../../../packages/contracts/src/comparison';

export type ComparisonMapMode = 'baseline' | 'scenario' | 'difference';
export type ComparisonViewContext = {
  label: string;
  comparisonId: string;
  createdAt: string;
  runs: { label: string; runId: string; generatedAt: string | null; simulationStart: string; simulationEnd: string; forcing: string }[];
};
type Geometry = NonNullable<RunSnapshot['floodGeometry']>;
type MapFeature = { type: 'Feature'; geometry: Geometry; properties: Record<string, string | boolean> };
type MapCollection = { type: 'FeatureCollection'; features: MapFeature[] };

function collection(features: MapFeature[]): MapCollection {
  return { type: 'FeatureCollection', features };
}

// All map modes are peak summaries of exact run artifacts, never timestep fixtures.
export function comparisonMapData(comparison: Comparison, mode: ComparisonMapMode) {
  const runKeys = mode === 'difference' ? ['baseline', 'scenario'] as const : [mode];
  const context: ComparisonViewContext = {
    label: `${mode[0].toUpperCase()}${mode.slice(1)} · Hypothetical peak summary`,
    comparisonId: comparison.comparisonId,
    createdAt: comparison.createdAt,
    runs: runKeys.map(key => ({
      label: key, runId: comparison[key].runId, generatedAt: comparison[key].generatedAt,
      simulationStart: comparison[key].simulationStart, simulationEnd: comparison[key].simulationEnd,
      forcing: comparison[key].inputs ? `${comparison[key].inputs.rainfallRateMmHr} mm/hr rainfall; ${comparison[key].inputs.surgeLevelM} m coastal water-level control; ${comparison[key].inputs.durationHours}h` : 'Unavailable',
    })),
  };
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
  const extentBounds = geometryBounds(geometry);
  return { extent, assets: assetData, context, geometryAvailable: geometry !== null,
    geometryEmpty: geometry !== null && extentBounds === null,
    assetsAvailable: assets !== null,
    // A dry/unavailable difference can still be situated using these exact runs.
    bounds: extentBounds ?? geometryBounds(comparison.scenario.floodGeometry) ?? geometryBounds(comparison.baseline.floodGeometry) };
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
