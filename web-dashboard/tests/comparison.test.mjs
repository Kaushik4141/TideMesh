import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { baselineProblem, comparisonReducer, createExclusiveTask, initialComparisonState, isCompletedRun } from '../src/lib/comparison/state.ts';
import { comparisonMapData } from '../src/lib/comparison/mapData.ts';

// Clearly synthetic component/state fixtures; not production or scientific judging data.
const polygon = { type: 'Polygon', coordinates: [[[74.8, 12.9], [74.9, 12.9], [74.9, 13], [74.8, 12.9]]] };
const inputs = { rainfallRateMmHr: 75, surgeLevelM: 1.5, durationHours: 6 };
const metrics = { inundatedAreaKm2: 2, maximumDepthM: 0.5, affectedRoads: null, affectedBuildings: null, affectedFacilities: null, populationExposureEstimate: null };
const run = { runId: 'run-original', inputs, generatedAt: '2026-10-09T10:00:00Z', simulationStart: '2026-10-09T10:00:00Z', simulationEnd: '2026-10-09T16:00:00Z', modelVersion: 'test', rainfallSeries: null, waterLevelSeries: null, artifactIds: [], floodGeometry: polygon, maximumDepthM: 0.5, gridResolutionM: 100, floodThresholdM: 0.05, qualityNotes: [], metrics, priorities: null };
const asset = { id: 'road-42', name: 'Mock fixture road', kind: 'road', geometry: { type: 'LineString', coordinates: [[74.8, 12.9], [74.9, 13]] }, baselineAffected: false, scenarioAffected: true };
const comparison = { comparisonId: 'compare-one', createdAt: '2026-10-09T11:00:00Z', mode: 'HYPOTHETICAL_SCENARIO', baseline: run, scenario: { ...run, runId: 'run-scenario' }, delta: { inundatedAreaKm2: 0.3, maximumDepthM: 0.2, affectedRoads: null, affectedBuildings: null, affectedFacilities: null, newlyAffectedAssets: [asset], newlyInundatedGeometry: polygon }, assets: [asset], explanations: [], dataQuality: { areaMethod: 'test', infrastructureSource: null, populationSource: null, priorityMethod: null, persistence: 'unavailable', warnings: [] } };

// The installed TypeScript compiler handles TSX in-memory; no test renderer or new dependency.
function loadComponent(path, overrides = {}) {
  const url = new URL(path, import.meta.url);
  const output = ts.transpileModule(readFileSync(url, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText;
  const exports = {};
  const require = createRequire(url);
  new Function('require', 'exports', output)(id => overrides[id] ?? require(id), exports);
  return exports;
}

test('modal renders elapsed loading and visible failures; legacy baseline cannot submit', () => {
  const { ScenarioModal } = loadComponent('../src/components/dashboard/ScenarioModal.tsx');
  const workflow = { ...initialComparisonState, catalog: [{ eventId: run.runId, name: 'Completed baseline', status: 'completed' }], selectedId: run.runId, snapshot: run,
    busy: true, pending: true, elapsedSeconds: 12, baselineRunning: false, catalogLoading: false, snapshotLoading: false, baselineProblem: null,
    catalogError: null, snapshotError: null, baselineError: null, refreshCatalog: async () => [], setSelectedId: () => {}, createBaseline: () => {}, runComparison: () => {} };
  const loading = renderToStaticMarkup(React.createElement(ScenarioModal, { open: true, onClose() {}, workflow }));
  assert.match(loading, /Running comparison.*12s elapsed/);
  assert.match(loading, /disabled=""[^>]*>Compare impacts/);
  assert.match(loading, /Closing this dialog does not cancel the run/);
  const failure = renderToStaticMarkup(React.createElement(ScenarioModal, { open: true, onClose() {}, workflow: { ...workflow, busy: false, pending: false, error: 'Solver unavailable' } }));
  assert.match(failure, /role="alert"[^>]*>Solver unavailable/);
  const legacy = renderToStaticMarkup(React.createElement(ScenarioModal, { open: true, onClose() {}, workflow: { ...workflow, busy: false, snapshot: { ...run, inputs: null }, baselineProblem: baselineProblem({ ...run, inputs: null }, run.runId) } }));
  assert.match(legacy, /legacy run.*fresh completed baseline/);
  assert.match(legacy, /disabled=""[^>]*>Compare impacts/);
});

test('successful results render real IDs and metrics while null impacts and priorities remain unavailable', () => {
  const { ComparisonResults } = loadComponent('../src/components/dashboard/ComparisonResults.tsx');
  const markup = renderToStaticMarkup(React.createElement(ComparisonResults, { comparison, mode: 'difference', onModeChange() {} }));
  assert.match(markup, /run-original/);
  assert.match(markup, /run-scenario/);
  assert.match(markup, /Mock fixture road/);
  assert.match(markup, /road-42/);
  assert.match(markup, /Response priorities: unavailable/);
  assert.match(markup, /Affected roads \(count\).*Unavailable.*Unavailable.*Unavailable/);
  assert.match(markup, /No time-varying comparison is available/);
});

test('loading, success and failure retain the last successful comparison', () => {
  const loading = comparisonReducer(initialComparisonState, { type: 'start', at: 123 });
  assert.equal(loading.pending, true);
  assert.equal(loading.startedAt, 123);
  assert.equal(loading.result, null);
  const success = comparisonReducer(loading, { type: 'success', result: comparison });
  assert.equal(success.pending, false);
  assert.equal(success.result, comparison);
  const retry = comparisonReducer(success, { type: 'start', at: 456 });
  assert.equal(retry.result, comparison);
  const failure = comparisonReducer(retry, { type: 'failure', error: 'Solver unavailable' });
  assert.equal(failure.pending, false);
  assert.equal(failure.result, comparison);
  assert.equal(failure.error, 'Solver unavailable');
});

test('duplicate submission is blocked and failures release the lock', async () => {
  const execute = createExclusiveTask();
  let release;
  let requests = 0;
  const first = execute(() => { requests++; return new Promise(resolve => { release = resolve; }); });
  await execute(async () => { requests++; });
  assert.equal(requests, 1);
  release('completed');
  assert.equal(await first, 'completed');
  await assert.rejects(execute(async () => { throw new Error('failure'); }), /failure/);
  assert.equal(await execute(async () => 'retry succeeded'), 'retry succeeded');
});

test('baseline must be completed, immutable and have recorded numeric forcing', () => {
  assert.equal(isCompletedRun({ eventId: 'latest', status: 'ready' }), false);
  assert.equal(isCompletedRun({ eventId: 'run-original', status: 'running' }), false);
  assert.equal(isCompletedRun({ eventId: 'run-original', status: 'completed' }), true);
  assert.match(baselineProblem({ ...run, inputs: null }, run.runId), /legacy.*fresh completed baseline/);
  assert.match(baselineProblem(run, 'another-run'), /Select and inspect/);
  assert.equal(baselineProblem(run, run.runId), null);
});

test('map adapter selects exact baseline/scenario/difference geometry and actual affected assets', () => {
  const baseline = comparisonMapData(comparison, 'baseline');
  assert.equal(baseline.extent.features[0].geometry, run.floodGeometry);
  assert.deepEqual(baseline.assets.features, []);
  const scenario = comparisonMapData(comparison, 'scenario');
  assert.equal(scenario.assets.features[0].properties.name, asset.name);
  assert.equal(scenario.assets.features[0].properties.id, 'road-42');
  const difference = comparisonMapData(comparison, 'difference');
  assert.equal(difference.extent.features[0].geometry, comparison.delta.newlyInundatedGeometry);
  assert.equal(difference.assets.features[0].geometry, asset.geometry);
  assert.deepEqual(difference.bounds, [[74.8, 12.9], [74.9, 13]]);
});

test('unavailable map data stays empty and unavailable rather than becoming fixture geometry', () => {
  const missing = { ...comparison, assets: null, scenario: { ...run, floodGeometry: null }, delta: { ...comparison.delta, newlyAffectedAssets: null, newlyInundatedGeometry: null } };
  for (const mode of ['scenario', 'difference']) {
    const data = comparisonMapData(missing, mode);
    assert.equal(data.geometryAvailable, false);
    assert.equal(data.assetsAvailable, false);
    assert.deepEqual(data.extent.features, []);
    assert.deepEqual(data.assets.features, []);
    assert.deepEqual(data.bounds, [[74.8, 12.9], [74.9, 13]]); // exact baseline situates a missing extent
  }
});

test('supplied priority ranks, scores, reasons and actions render without generating missing priorities', () => {
  const { ComparisonResults } = loadComponent('../src/components/dashboard/ComparisonResults.tsx');
  const mockPriority = { zoneId: 'mock-zone', rank: 3, score: 25, severity: 'HIGH', reason: 'Mock baseline reason', recommendedActions: ['Mock baseline action'] };
  const supplied = { ...comparison, baseline: { ...run, priorities: [mockPriority] }, scenario: { ...comparison.scenario, priorities: [{ ...mockPriority, rank: 1, score: 40, reason: 'Mock scenario reason', recommendedActions: ['Mock scenario action'] }] }, dataQuality: { ...comparison.dataQuality, priorityMethod: 'Mock scoring method for component tests only' } };
  const render = value => renderToStaticMarkup(React.createElement(ComparisonResults, { comparison: value, mode: 'scenario', onModeChange() {} }));
  const markup = render(supplied);
  assert.match(markup, /Rank change \(scenario − baseline\): -2/);
  assert.match(markup, /Score change \(scenario − baseline\): \+15/);
  for (const text of ['Mock baseline reason', 'Mock scenario reason', 'Mock baseline action', 'Mock scenario action', 'Rank #3', 'Rank #1', 'Score 25', 'Score 40', 'Mock scoring method']) assert.ok(markup.includes(text));
  const partial = render({ ...supplied, baseline: { ...run, priorities: null } });
  assert.match(partial, /Rank change \(scenario − baseline\): Unavailable/);
  assert.match(partial, /Score change \(scenario − baseline\): Unavailable/);
  assert.match(partial, /Mock scenario reason/);
  assert.doesNotMatch(partial, /Mock baseline reason/);
  const unlisted = render({ ...supplied, baseline: { ...run, priorities: [] } });
  assert.match(unlisted, /Zone not listed in the supplied priorities/);
  const empty = render({ ...comparison, baseline: { ...run, priorities: [] }, scenario: { ...comparison.scenario, priorities: [] } });
  assert.match(empty, /No response priorities supplied for this run/);
  assert.doesNotMatch(empty, /Response priorities: unavailable/);
  const warnings = render({ ...comparison, scenario: { ...comparison.scenario, qualityNotes: ['Mock geographic mismatch warning'] }, dataQuality: { ...comparison.dataQuality, warnings: ['Zero counts in mock nonlocal inventory'] } });
  assert.match(warnings, /Known model-domain mismatch/);
  assert.match(warnings, /zero counts do not establish that infrastructure is safe/);
});

test('comparison chrome and map captions use the displayed result and distinguish empty difference from unavailable', () => {
  const utils = loadComponent('../src/lib/utils.ts');
  const { TopHeader } = loadComponent('../src/components/dashboard/TopHeader.tsx', { '@/lib/utils': utils });
  const { Sidebar } = loadComponent('../src/components/dashboard/Sidebar.tsx', { '@/lib/utils': utils, 'next/navigation': { usePathname: () => '/' } });
  const { FloodMap } = loadComponent('../src/components/dashboard/FloodMap.tsx', { '@/lib/utils': utils,
    '@/data/waterways': { TIMESTEP_EXPANSION_FACTORS: {}, WATERWAY_ROUTE_PATHS: {}, getDynamicSwollenWaterways() {} },
    '@/data/coastalRegions': { INDIA_COASTAL_REGIONS: [{ id: 'mock-region' }] } });
  const data = comparisonMapData({ ...comparison, delta: { ...comparison.delta, newlyInundatedGeometry: { type: 'Polygon', coordinates: [] }, newlyAffectedAssets: [] } }, 'difference');
  assert.equal(data.geometryAvailable, true);
  assert.equal(data.geometryEmpty, true);
  assert.equal(data.context.runs.length, 2);
  const header = renderToStaticMarkup(React.createElement(TopHeader, { activeMode: 'SCENARIO', peakSummary: true, comparisonContext: data.context, currentTime: 'UNRELATED-DEMO-TIME', eventName: data.context.label, onRefresh() {} }));
  assert.ok(header.includes(comparison.createdAt));
  assert.doesNotMatch(header, /UNRELATED-DEMO-TIME|3 Active Alerts|R\. Shetty|Duty Officer/);
  assert.match(header, /aria-label="Open comparison controls"/);
  const sidebar = renderToStaticMarkup(React.createElement(Sidebar, { comparisonActive: true, comparisonContext: data.context }));
  for (const value of [run.runId, comparison.scenario.runId, run.generatedAt, run.simulationEnd, comparison.comparisonId]) assert.ok(sidebar.includes(value));
  assert.doesNotMatch(sidebar, /3 Pending|EOC Hotline|Illustrative telemetry/);
  const renderMap = comparisonData => renderToStaticMarkup(React.createElement(FloodMap, { comparisonData, comparisonMode: 'difference', zones: [], facilities: [], selectedZoneId: '', onSelectZone() {} }));
  const empty = renderMap(data);
  assert.match(empty, /No newly inundated area in the computed difference/);
  assert.doesNotMatch(empty, /Run geometry unavailable/);
  assert.ok(empty.includes(run.runId) && empty.includes(comparison.scenario.runId) && empty.includes(run.simulationEnd));
  const missing = renderMap(comparisonMapData({ ...comparison, delta: { ...comparison.delta, newlyInundatedGeometry: null } }, 'difference'));
  assert.match(missing, /Run geometry unavailable/);
  assert.doesNotMatch(missing, /No newly inundated area/);
  const scenario = comparisonMapData(comparison, 'scenario');
  assert.deepEqual(scenario.context.runs.map(value => value.runId), [comparison.scenario.runId]);
  const baseline = comparisonMapData(comparison, 'baseline');
  assert.deepEqual(baseline.context.runs.map(value => value.runId), [comparison.baseline.runId]);
  const allMissing = comparisonMapData({ ...comparison, baseline: { ...run, floodGeometry: null }, scenario: { ...run, floodGeometry: null }, delta: { ...comparison.delta, newlyInundatedGeometry: null } }, 'difference');
  assert.equal(allMissing.bounds, null);
});

test('API client sends the exact comparison contract and surfaces upstream errors without fallback', async () => {
  const { apiClient } = await import('../src/lib/api/client.ts');
  const originalFetch = globalThis.fetch;
  const calls = [];
  try {
    globalThis.fetch = async (url, options) => {
      calls.push({ url, options });
      return Response.json({ success: true, comparison });
    };
    const request = { baselineRunId: run.runId, scenario: { rainfallRateMmHr: 110, surgeLevelM: 2.8 } };
    assert.equal((await apiClient.compareSimulations(request)).comparisonId, comparison.comparisonId);
    assert.ok(calls[0].url.endsWith('/api/v1/simulations/compare'));
    assert.equal(calls[0].options.method, 'POST');
    assert.deepEqual(JSON.parse(calls[0].options.body), request);
    globalThis.fetch = async () => Response.json({ error: 'Solver failed' }, { status: 502 });
    await assert.rejects(apiClient.compareSimulations(request), /Solver failed/);
    assert.equal(calls.length, 1); // no synthetic scenario request or retry
    globalThis.fetch = async (url) => { assert.ok(url.endsWith('/run-original/run')); return Response.json(run); };
    assert.equal((await apiClient.fetchRunSnapshot(run.runId)).runId, run.runId);
    globalThis.fetch = async () => Response.json({ ...run, runId: 'different-run' });
    await assert.rejects(apiClient.fetchRunSnapshot(run.runId), /different baseline/);
  } finally { globalThis.fetch = originalFetch; }
});
