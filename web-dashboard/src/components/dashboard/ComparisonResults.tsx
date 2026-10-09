'use client';

import type { Comparison } from '../../../../packages/contracts/src/comparison';
import type { ComparisonMapMode } from '@/lib/comparison/mapData';

function metric(value: number | null, delta = false) {
  return value === null ? 'Unavailable' : `${delta && value > 0 ? '+' : ''}${value.toLocaleString(undefined, { maximumFractionDigits: 3 })}`;
}

export function ComparisonResults({ comparison, mode, onModeChange }: {
  comparison: Comparison; mode: ComparisonMapMode; onModeChange: (mode: ComparisonMapMode) => void;
}) {
  const rows = [
    ['Inundated area (km²)', 'inundatedAreaKm2'], ['Maximum depth (m)', 'maximumDepthM'],
    ['Affected roads (count)', 'affectedRoads'], ['Affected buildings (count)', 'affectedBuildings'],
    ['Affected facilities (count)', 'affectedFacilities'],
  ] as const;
  const baselinePriorities = comparison.baseline.priorities;
  const scenarioPriorities = comparison.scenario.priorities;
  const zoneIds = [...new Set([...(scenarioPriorities ?? []).map(priority => priority.zoneId), ...(baselinePriorities ?? []).map(priority => priority.zoneId)])];
  return <section className="w-full xl:w-[410px] shrink-0 bg-white rounded-lg border border-slate-200 p-3 overflow-y-auto text-xs space-y-3 select-text" aria-label="Comparison results">
    <h2 className="font-bold text-base">Real run impact comparison</h2>
    <p>Hypothetical scenario · peak-summary extents over each simulation window. No time-varying comparison is available.</p>
    {comparison.scenario.qualityNotes.some(note => note.includes('geographic mismatch')) && <p className="bg-amber-50 border border-amber-300 rounded p-2 font-semibold">Known model-domain mismatch: the unchanged template is not at Mangaluru&apos;s reported coordinates. This is not a validated local emergency forecast.</p>}
    {comparison.dataQuality.warnings.some(note => note.includes('Zero counts')) && <p className="bg-amber-50 border border-amber-300 rounded p-2">No inventory assets intersect these extents. Geographic inventory coverage is unverified; zero counts do not establish that infrastructure is safe.</p>}
    <div className="flex gap-1" role="group" aria-label="Comparison map mode">
      {(['baseline', 'scenario', 'difference'] as const).map(value => <button type="button" key={value} aria-pressed={mode === value} onClick={() => onModeChange(value)} className={`px-3 py-2 rounded capitalize focus-visible:ring-2 focus-visible:ring-blue-700 ${mode === value ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}>{value}</button>)}
    </div>
    <p className="text-slate-600">Difference shows newly inundated area and newly affected assets (scenario minus baseline), not a depth-change surface.</p>
    <p className="break-all">Comparison ID: {comparison.comparisonId}<br />Created: {comparison.createdAt}</p>
    {(['baseline', 'scenario'] as const).map(key => {
      const run = comparison[key];
      return <div key={key} className="bg-slate-50 rounded p-2 space-y-1 break-all">
        <h3 className="font-bold capitalize">{key} · {run.runId}</h3>
        <p>Generated: {run.generatedAt ?? 'Unavailable'}</p>
        <p>Simulation: {run.simulationStart} – {run.simulationEnd}</p>
        <p>Model version: {run.modelVersion ?? 'Unavailable'} (unvalidated)</p>
        <p>Forcing: {run.inputs ? `${run.inputs.rainfallRateMmHr} mm/hr; ${run.inputs.surgeLevelM} m coastal water level; ${run.inputs.durationHours}h` : 'Unavailable'}</p>
        <details><summary className="cursor-pointer">Run quality notes ({run.qualityNotes.length})</summary>{run.qualityNotes.map((note, index) => <p key={index}>{note}</p>)}</details>
      </div>;
    })}
    <table className="w-full text-left border-collapse">
      <caption className="font-bold text-left mb-1">Peak impact metrics</caption>
      <thead><tr><th className="p-1">Metric</th><th className="p-1">Baseline</th><th className="p-1">Scenario</th><th className="p-1">Delta</th></tr></thead>
      <tbody>{rows.map(([label, key]) => <tr key={key} className="border-t border-slate-200"><th className="p-1 font-medium">{label}</th><td className="p-1">{metric(comparison.baseline.metrics[key])}</td><td className="p-1">{metric(comparison.scenario.metrics[key])}</td><td className="p-1">{metric(comparison.delta[key], true)}</td></tr>)}
        <tr className="border-t border-slate-200"><th className="p-1 font-medium">Population exposure estimate</th><td className="p-1">{metric(comparison.baseline.metrics.populationExposureEstimate)}</td><td className="p-1">{metric(comparison.scenario.metrics.populationExposureEstimate)}</td><td className="p-1">Unavailable</td></tr>
      </tbody>
    </table>
    <div><h3 className="font-bold">Newly affected assets</h3>
      {comparison.delta.newlyAffectedAssets === null ? <p>Unavailable — infrastructure intersections were not computed.</p> : comparison.delta.newlyAffectedAssets.length === 0 ? <p>No newly affected assets in the evaluated dataset.</p> : <ul className="list-disc pl-4 space-y-1">{comparison.delta.newlyAffectedAssets.map(asset => <li key={`${asset.kind}:${asset.id}`}>{asset.name ?? 'Unnamed asset'} · {asset.kind} · ID: {asset.id}</li>)}</ul>}
    </div>
    <div className="space-y-2">
      <h3 className="font-bold">Response priorities{baselinePriorities === null && scenarioPriorities === null ? ': unavailable' : ''}</h3>
      <p>Priority method: {comparison.dataQuality.priorityMethod ?? 'Unavailable — no executable scoring methodology is reported.'} No illustrative priority scores are substituted.</p>
      {(['baseline', 'scenario'] as const).map(key => <p key={key} className="capitalize">{key}: {comparison[key].priorities === null ? 'Unavailable — priorities were not computed.' : comparison[key].priorities.length === 0 ? 'No response priorities supplied for this run.' : `${comparison[key].priorities.length} supplied response priorities.`}</p>)}
      {zoneIds.map(zoneId => {
        const baseline = baselinePriorities?.find(priority => priority.zoneId === zoneId);
        const scenario = scenarioPriorities?.find(priority => priority.zoneId === zoneId);
        return <article key={zoneId} className="border border-slate-200 rounded p-2 space-y-2">
          <h4 className="font-bold">Zone {zoneId}</h4>
          <p>Rank change (scenario − baseline): {baseline && scenario ? metric(scenario.rank - baseline.rank, true) : 'Unavailable'}. A lower rank is higher priority.</p>
          <p>Score change (scenario − baseline): {baseline && scenario ? metric(scenario.score - baseline.score, true) : 'Unavailable'}</p>
          {(['baseline', 'scenario'] as const).map(key => {
            const priority = key === 'baseline' ? baseline : scenario;
            return <div key={key}>
              <h5 className="font-semibold capitalize">{key} · {comparison[key].runId}</h5>
              {priority ? <>
                <p>Rank #{priority.rank} · Score {metric(priority.score)} · {priority.severity}</p>
                <p>Provided reason: {priority.reason || 'Unavailable'}</p>
                <p>Provided recommended actions:</p>
                {priority.recommendedActions.length ? <ul className="list-disc pl-4">{priority.recommendedActions.map((action, index) => <li key={index}>{action}</li>)}</ul> : <p>No actions supplied.</p>}
              </> : <p>{comparison[key].priorities === null ? 'Unavailable — priorities were not computed.' : 'Zone not listed in the supplied priorities.'}</p>}
            </div>;
          })}
        </article>;
      })}
    </div>
    <div><h3 className="font-bold">Explanation and data quality</h3>
      <ul className="list-disc pl-4 space-y-1">{[...comparison.explanations, ...comparison.dataQuality.warnings].map((text, index) => <li key={index}>{text}</li>)}</ul>
      <p className="mt-2">Area method: {comparison.dataQuality.areaMethod}</p>
      <p>Infrastructure source: {comparison.dataQuality.infrastructureSource ?? 'Unavailable'}</p>
      <p>Population source: {comparison.dataQuality.populationSource ?? 'Unavailable'}</p>
      <p>Persistence: {comparison.dataQuality.persistence === 'database' ? 'Database' : 'Unavailable — this result is only retained in this page session'}</p>
    </div>
  </section>;
}
