'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useFloodDashboard } from '@/hooks/useFloodDashboard';
import { useScenarioComparison } from '@/hooks/useScenarioComparison';
import { TopHeader } from '@/components/dashboard/TopHeader';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { KpiStrip } from '@/components/dashboard/KpiStrip';
import { FloodMap } from '@/components/dashboard/FloodMap';
import { Timeline } from '@/components/dashboard/Timeline';
import { ZoneDrawer } from '@/components/dashboard/ZoneDrawer';
import { ShortcutsModal } from '@/components/dashboard/ShortcutsModal';
import { ScenarioModal } from '@/components/dashboard/ScenarioModal';
import { ComparisonResults } from '@/components/dashboard/ComparisonResults';
import { comparisonMapData, type ComparisonMapMode } from '@/lib/comparison/mapData';

export default function OverviewPage() {
  const dashboard = useFloodDashboard();
  const comparison = useScenarioComparison();
  const [scenarioModalOpen, setScenarioModalOpen] = useState(false);
  const [mapMode, setMapMode] = useState<ComparisonMapMode>('scenario');
  const comparisonActive = dashboard.activeMode === 'SCENARIO';
  const selectZone = dashboard.selectZone;
  const mapData = useMemo(() => comparison.result ? comparisonMapData(comparison.result, mapMode) : undefined, [comparison.result, mapMode]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('zone')) selectZone(params.get('zone')!.toUpperCase());
    const timer = params.get('compare') ? window.setTimeout(() => setScenarioModalOpen(true), 0) : null;
    return () => { if (timer !== null) window.clearTimeout(timer); };
  }, [selectZone]);

  return <div className="h-screen w-screen overflow-hidden bg-slate-100 flex flex-col font-sans antialiased text-slate-900">
    <TopHeader
      onOpenShortcuts={() => dashboard.setShortcutsModalOpen(true)}
      activeMode={dashboard.activeMode} onSwitchMode={dashboard.switchMode}
      onOpenScenario={() => setScenarioModalOpen(true)}
      eventName={comparisonActive ? mapData ? `${mapData.context.label} · ${mapData.context.runs.map(run => run.runId).join(' → ')}` : 'Choose a completed comparison' : dashboard.eventData?.name}
      currentTime={dashboard.currentTime} clockTimes={dashboard.clockTimes}
      peakSummary={comparisonActive}
      comparisonContext={comparisonActive ? mapData?.context : undefined}
      isSimulationRunning={comparison.busy} onRunSimulation={() => setScenarioModalOpen(true)}
      onRefresh={comparisonActive ? () => setScenarioModalOpen(true) : () => void dashboard.refreshData()}
      isLoading={dashboard.isLoading}
    />
    <div className="flex flex-1 pt-14 overflow-hidden">
      <Sidebar environmentalData={dashboard.environmentalData} activeMode={dashboard.activeMode}
        currentConditions={dashboard.currentConditions} comparisonActive={comparisonActive}
        comparisonContext={comparisonActive ? mapData?.context : undefined}
        onOpenScenario={() => setScenarioModalOpen(true)} />
      <main className="flex-1 ml-[220px] lg:ml-[232px] p-2.5 lg:p-3 overflow-hidden flex flex-col gap-2">
        <div className="bg-amber-50 border border-amber-300 px-3 py-2 rounded-lg text-xs text-amber-950 shrink-0 flex justify-between gap-3">
          <p>{comparisonActive ? <><strong>HYPOTHETICAL SCENARIO — UNVALIDATED:</strong> Exact baseline/scenario solver artifacts, peak-summary impacts.</> : <><strong>ILLUSTRATIVE / UNVALIDATED DATASET:</strong> Live-mode and historical replay include demonstration zones, probabilities, attribution percentages, facilities and sensor status. No calibration or operational forecast validity has been established.</>}</p>
          <button className="font-bold underline shrink-0" onClick={() => setScenarioModalOpen(true)}>Compare runs</button>
        </div>
        {comparison.error && <p role="alert" className="text-xs text-red-800 bg-red-50 border border-red-200 rounded p-2">{comparison.error}{comparison.result ? ' The last successful comparison is still shown.' : ''}</p>}
        {comparison.baselineError && <p role="alert" className="text-xs text-red-800 bg-red-50 border border-red-200 rounded p-2">Baseline creation: {comparison.baselineError}</p>}
        {comparison.busy && <p role="status" className="text-xs bg-blue-50 p-2">{comparison.baselineRunning ? 'Creating baseline' : 'Running comparison'}… {comparison.elapsedSeconds}s elapsed.{comparisonActive && comparison.result ? ` The last successful result (${comparison.result.comparisonId}) remains displayed until a new comparison completes.` : ''}</p>}
        {comparisonActive ? comparison.result ? <div className="flex-1 min-h-0 flex flex-col xl:flex-row gap-2.5 overflow-auto">
          <FloodMap zones={[]} facilities={[]} selectedZoneId="" onSelectZone={() => {}}
            key={`${comparison.result.comparisonId}:${mapMode}`}
            comparisonData={mapData} comparisonMode={mapMode}
            className="flex-1 min-h-[330px] xl:h-full" />
          <ComparisonResults comparison={comparison.result} mode={mapMode} onModeChange={setMapMode} />
        </div> : <section className="p-6 bg-white rounded border text-sm space-y-3">
          <h1 className="text-lg font-bold">Compare scenario impacts</h1>
          <p>Select a genuine completed baseline, inspect its forcing inputs, then run the rainfall and coastal water-level experiment.</p>
          <button className="bg-amber-700 text-white rounded px-4 py-2" onClick={() => setScenarioModalOpen(true)}>Choose baseline and compare</button>
        </section> : <>
          {dashboard.error && <p role="alert" className="text-xs text-red-700">Dataset load failed: {dashboard.error}. Illustrative fallback data are shown.</p>}
          <KpiStrip kpi={dashboard.kpi} />
          <div className="flex-1 min-h-0 flex flex-col xl:flex-row gap-2.5 overflow-hidden">
            <div className="flex-1 min-w-0 flex flex-col gap-2.5 overflow-hidden">
              <div className="flex-1 min-h-0 relative"><FloodMap zones={dashboard.zones} facilities={dashboard.facilities}
                selectedZoneId={dashboard.selectedZoneId} onSelectZone={dashboard.selectZone}
                floodExtentGeoJson={dashboard.floodExtentGeoJson} currentTime={dashboard.currentTime} className="w-full h-full" /></div>
              <Timeline currentTime={dashboard.currentTime} availableTimestamps={dashboard.availableTimestamps}
                clockTimes={dashboard.clockTimes} activeMode={dashboard.activeMode} onSelectTime={dashboard.setCurrentTime}
                isPlaying={dashboard.isPlaying} onTogglePlay={dashboard.togglePlay} playbackSpeed={dashboard.playbackSpeed}
                onChangeSpeed={dashboard.setPlaybackSpeed} onStepForward={dashboard.stepForward} onStepBackward={dashboard.stepBackward}
                onReset={dashboard.resetTimeline} currentFloodDepth={dashboard.currentReplayState.floodDepth} statusLabel={dashboard.currentReplayState.statusLabel} />
            </div>
            <ZoneDrawer zone={dashboard.selectedZone} isOpen={dashboard.drawerOpen} onClose={() => dashboard.setDrawerOpen(false)}
              countdownMinutes={dashboard.countdownMinutes} acknowledgment={dashboard.currentZoneAcknowledgment}
              onAcknowledge={dashboard.acknowledgeCurrentZone} actionsState={dashboard.actionsState} onAssignAction={dashboard.assignAction} />
          </div>
        </>}
      </main>
    </div>
    <ShortcutsModal open={dashboard.shortcutsModalOpen} onClose={() => dashboard.setShortcutsModalOpen(false)} />
    <ScenarioModal open={scenarioModalOpen} onClose={() => setScenarioModalOpen(false)} workflow={comparison}
      onCompleted={() => { dashboard.switchMode('SCENARIO'); dashboard.setIsPlaying(false); }} />
  </div>;
}
