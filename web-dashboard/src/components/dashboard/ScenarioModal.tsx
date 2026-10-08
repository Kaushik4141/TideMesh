'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import type { useScenarioComparison } from '@/hooks/useScenarioComparison';

interface ScenarioModalProps {
  open: boolean;
  onClose: () => void;
  workflow?: ReturnType<typeof useScenarioComparison>;
  onCompleted?: () => void;
}

export function ScenarioModal({ open, onClose, workflow, onCompleted }: ScenarioModalProps) {
  const [edited, setEdited] = useState<{ runId: string | null; rainfallRateMmHr: number; surgeLevelM: number } | null>(null);
  const snapshotId = workflow?.snapshot?.runId ?? null;
  const rainfallRateMmHr = edited?.runId === snapshotId ? edited.rainfallRateMmHr : workflow?.snapshot?.inputs?.rainfallRateMmHr ?? 75;
  const surgeLevelM = edited?.runId === snapshotId ? edited.surgeLevelM : workflow?.snapshot?.inputs?.surgeLevelM ?? 1.5;
  const refreshCatalog = workflow?.refreshCatalog;
  useEffect(() => {
    if (open && refreshCatalog) void refreshCatalog();
  }, [open, refreshCatalog]);
  if (!open) return null;
  const invalid = !Number.isFinite(rainfallRateMmHr) || rainfallRateMmHr < 0 || rainfallRateMmHr > 300 ||
    !Number.isFinite(surgeLevelM) || surgeLevelM < 0 || surgeLevelM > 5;
  const scenario = { rainfallRateMmHr, surgeLevelM };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true" aria-labelledby="scenario-modal-title">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h2 id="scenario-modal-title" className="font-bold">Scenario impact comparison</h2>
          <button onClick={onClose} aria-label="Close scenario modal"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-xs bg-amber-50 border border-amber-200 p-3 rounded text-amber-900">
          Hypothetical experiment using a completed baseline and a new solver run. Peak-summary outputs are unvalidated; this is not a live forecast or a time-varying replay.
        </p>
        {!workflow ? (
          <p className="text-sm">This directory uses illustrative data and is not run-linked. <Link className="text-blue-700 underline" href="/?compare=1">Open comparison in Overview</Link>.</p>
        ) : <>
          <div className="space-y-2 text-sm">
            <label className="font-semibold block" htmlFor="baseline-run">Completed baseline run</label>
            <div className="flex gap-2">
              <select id="baseline-run" className="border rounded p-2 flex-1 min-w-0" value={workflow.selectedId} disabled={workflow.busy || workflow.catalogLoading} onChange={event => workflow.setSelectedId(event.target.value)}>
                <option value="">{workflow.catalogLoading ? 'Loading catalog…' : 'Select a completed run'}</option>
                {workflow.catalog.map(run => <option key={run.eventId} value={run.eventId}>{run.name} · {run.eventId}</option>)}
              </select>
              <button className="border rounded px-2 disabled:opacity-50" disabled={workflow.busy || workflow.catalogLoading} onClick={() => void workflow.refreshCatalog()}>Refresh</button>
            </div>
            {workflow.snapshotLoading && <p role="status">Inspecting exact run snapshot…</p>}
            {workflow.snapshot && <div className="bg-slate-50 rounded p-2 text-xs space-y-1 break-all">
              <p>Run ID: {workflow.snapshot.runId}</p>
              <p>Generated: {workflow.snapshot.generatedAt ?? 'Unavailable (legacy provenance)'}</p>
              <p>Simulation: {workflow.snapshot.simulationStart} – {workflow.snapshot.simulationEnd}</p>
              <p>Baseline forcing: {workflow.snapshot.inputs ? `${workflow.snapshot.inputs.rainfallRateMmHr} mm/hr rainfall; ${workflow.snapshot.inputs.surgeLevelM} m coastal water level; ${workflow.snapshot.inputs.durationHours} hours` : 'Unavailable'}</p>
              {workflow.snapshot.qualityNotes.map((note, index) => <p key={index}>{note}</p>)}
            </div>}
            {workflow.baselineProblem && <p className="text-amber-800">{workflow.baselineProblem}</p>}
          </div>
          <fieldset disabled={workflow.busy} className="grid grid-cols-2 gap-3 text-xs disabled:opacity-60">
            <label htmlFor="comparison-rainfall">Scenario rainfall (mm/hr)
              <input id="comparison-rainfall" className="block border rounded p-2 w-full mt-1" type="number" min="0" max="300" step="1" value={Number.isNaN(rainfallRateMmHr) ? '' : rainfallRateMmHr} onChange={event => setEdited({ runId: snapshotId, surgeLevelM, rainfallRateMmHr: event.target.value === '' ? NaN : Number(event.target.value) })} />
            </label>
            <label htmlFor="comparison-water-level">Scenario coastal water level (m)
              <input id="comparison-water-level" className="block border rounded p-2 w-full mt-1" type="number" min="0" max="5" step="0.05" value={Number.isNaN(surgeLevelM) ? '' : surgeLevelM} onChange={event => setEdited({ runId: snapshotId, rainfallRateMmHr, surgeLevelM: event.target.value === '' ? NaN : Number(event.target.value) })} />
            </label>
          </fieldset>
          <p className="text-xs text-slate-600">Coastal water-level control sets the +3h sample in the existing runner’s profile; it is not additive surge or necessarily the peak. Comparison duration is inherited from the baseline. No sea-wall breach model or return-period claim is available.</p>
          {invalid && <p role="alert" className="text-xs text-red-700">Enter rainfall from 0–300 mm/hr and coastal water level from 0–5 m.</p>}
          {[workflow.catalogError, workflow.snapshotError, workflow.baselineError, workflow.error].filter(Boolean).map((error, index) => <p key={index} role="alert" className="text-sm text-red-700 bg-red-50 rounded p-2">{error}</p>)}
          {workflow.busy && <p role="status" aria-live="polite" className="text-sm">{workflow.baselineRunning ? 'Creating baseline' : 'Running comparison'}… {workflow.elapsedSeconds}s elapsed. Waiting for real solver results.</p>}
          <div className="flex justify-between gap-2">
            <button className="text-xs border rounded px-3 py-2 disabled:opacity-50" disabled={workflow.busy || workflow.catalogLoading || workflow.snapshotLoading || invalid} onClick={() => void workflow.createBaseline(scenario)}>Create baseline (6h, current controls)</button>
            <button className="text-xs bg-amber-700 text-white rounded px-3 py-2 disabled:bg-slate-400" disabled={workflow.busy || workflow.snapshotLoading || workflow.catalogLoading || !!workflow.baselineProblem || invalid} onClick={async () => { if (await workflow.runComparison(scenario)) { onCompleted?.(); onClose(); } }}>Compare impacts</button>
          </div>
        </>}
      </div>
    </div>
  );
}
