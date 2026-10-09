'use client';

import React, { useState, useEffect } from 'react';
import { useFloodDashboard } from '@/hooks/useFloodDashboard';
import { TopHeader } from '@/components/dashboard/TopHeader';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { KpiStrip } from '@/components/dashboard/KpiStrip';
import { FloodMap } from '@/components/dashboard/FloodMap';
import { Timeline } from '@/components/dashboard/Timeline';
import { ZoneDrawer } from '@/components/dashboard/ZoneDrawer';
import { ShortcutsModal } from '@/components/dashboard/ShortcutsModal';
import { ScenarioModal } from '@/components/dashboard/ScenarioModal';

export default function OverviewPage() {
  const {
    zones,
    facilities,
    selectedZone,
    selectedZoneId,
    selectZone,
    drawerOpen,
    setDrawerOpen,
    kpi,
    currentTime,
    setCurrentTime,
    availableTimestamps,
    stepForward,
    stepBackward,
    countdownMinutes,
    currentZoneAcknowledgment,
    acknowledgeCurrentZone,
    actionsState,
    assignAction,
    isPlaying,
    togglePlay,
    playbackSpeed,
    setPlaybackSpeed,
    shortcutsModalOpen,
    setShortcutsModalOpen,
    floodExtentGeoJson,
    eventData,
    activeMode,
    loadDemoPreview,
    environmentalData,
    forecastStatus,
    operationsContext,
    isLoading,
    isSimulationRunning,
    error,
    triggerSimulationRun,
    solverEnabled,
    solverCapabilityReason,
    artifactMetadata,
    solverArtifact,
    demoRiverGeoJson,
    refreshData,
    // Replay controls & scenario
    currentReplayState,
    resetTimeline,
    scenario,
  } = useFloodDashboard();

  const [scenarioModalOpen, setScenarioModalOpen] = useState(false);

  // Sync with URL query parameter e.g. /?zone=B
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const zoneParam = params.get('zone');
      if (zoneParam) {
        selectZone(zoneParam.toUpperCase());
        setDrawerOpen(true);
      }
    }
  }, [selectZone, setDrawerOpen]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-100 flex flex-col font-sans antialiased text-slate-900 select-none">
      {/* Top Header with live data fetching status and simulation trigger */}
      <TopHeader
        onOpenShortcuts={() => setShortcutsModalOpen(true)}
        eventName={eventData?.name}
        eventType={activeMode === 'DEMO_PREVIEW' ? 'DEMO' : eventData?.type || 'LIVE FORECAST'}
        currentTime={currentTime}
        isSimulation={activeMode !== 'LIVE_FORECAST'}
        isSimulationRunning={isSimulationRunning}
        onRunSimulation={() => { void triggerSimulationRun(); }}
        solverEnabled={solverEnabled}
        solverCapabilityReason={solverCapabilityReason}
        onLoadDemo={loadDemoPreview}
        onRefresh={() => refreshData()}
        isLoading={isLoading}
        isDataAvailable={Boolean(eventData) || Boolean(solverArtifact) || activeMode === 'DEMO_PREVIEW'}
      />

      {/* Main Body */}
      <div className="flex flex-1 pt-14 overflow-hidden">
        {/* Left Sidebar with Scenario dialog trigger and telemetry data */}
        <Sidebar
          environmentalData={environmentalData}
          onOpenScenario={() => setScenarioModalOpen(true)}
        />

        {/* Content Area */}
        <main className="flex-1 ml-[220px] lg:ml-[232px] p-2.5 lg:p-3 overflow-hidden flex flex-col gap-2.5">
          {/* KPI Strip */}
          <KpiStrip kpi={kpi} />
          {error && (
            <div role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-800">
              {error}
            </div>
          )}

          {/* Workspace Area: Map + Timeline on Left, Zone Drawer on Right */}
          <div className="flex-1 min-h-0 flex flex-col xl:flex-row gap-2.5 overflow-hidden">
            {/* Map and Timeline Column */}
            <div className="flex-1 min-w-0 flex flex-col gap-2.5 overflow-hidden">
              {/* Flood Map Canvas (≥ 55% of workspace) */}
              <div className="flex-1 min-h-0 relative">
                  <FloodMap
                  zones={zones}
                  facilities={facilities}
                  selectedZoneId={selectedZoneId}
                  onSelectZone={selectZone}
                    floodExtentGeoJson={floodExtentGeoJson}
                    demoRiverGeoJson={demoRiverGeoJson}
                    jurisdictionGeoJson={operationsContext?.jurisdiction?.geometry ?? null}
                    forecastStatus={forecastStatus}
                    mode={activeMode === 'DEMO_PREVIEW' ? 'demo' : eventData?.mode === 'SCENARIO' ? 'scenario' : eventData?.mode === 'HISTORICAL_REPLAY' ? 'replay' : 'official'}
                    initialView="india"
                    currentTime={currentTime}
                  className="w-full h-full"
                />
              </div>

              {/* Timeline (Always visible in first viewport, fully connected to replay states) */}
              <Timeline
                currentTime={currentTime}
                availableTimestamps={availableTimestamps}
                onSelectTime={setCurrentTime}
                isPlaying={isPlaying}
                onTogglePlay={togglePlay}
                playbackSpeed={playbackSpeed}
                onChangeSpeed={setPlaybackSpeed}
                onStepForward={stepForward}
                onStepBackward={stepBackward}
                onReset={resetTimeline}
                currentFloodDepth={currentReplayState.floodDepth}
                statusLabel={currentReplayState.statusLabel}
                truthfulArtifact={Boolean(solverArtifact)}
              />
              {artifactMetadata && solverArtifact && (
                <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-[11px] text-slate-700 flex flex-wrap gap-x-4 gap-y-1">
                  <strong className="text-slate-900">Solver artifact: {solverArtifact.eventId}</strong>
                  <span>Terrain: {artifactMetadata.terrainSource || 'unknown'}</span>
                  <span>Validation: {artifactMetadata.validationStatus || 'unknown'}</span>
                  <span>Operational: {artifactMetadata.operational === false ? 'false' : String(artifactMetadata.operational)}</span>
                  <span>Kind: {artifactMetadata.artifactKind || 'unknown'}</span>
                  <span>Frames: {artifactMetadata.frameCount}</span>
                  <span>Provenance: {artifactMetadata.provenance ? JSON.stringify(artifactMetadata.provenance) : 'unreported'}</span>
                </div>
              )}
            </div>

            {/* Zone Detail Drawer */}
              {selectedZone ? (
                <ZoneDrawer
                  zone={selectedZone}
                  isOpen={drawerOpen}
                  onClose={() => setDrawerOpen(false)}
                  countdownMinutes={countdownMinutes}
                  acknowledgment={currentZoneAcknowledgment}
                  onAcknowledge={acknowledgeCurrentZone}
                  actionsState={actionsState}
                  onAssignAction={assignAction}
                />
              ) : (
                <aside className="w-full xl:w-[420px] 2xl:w-[440px] shrink-0 bg-white border border-slate-200/90 rounded-lg shadow-xs p-5 h-full">
                  <h2 className="text-base font-bold text-slate-900">No forecast frame selected</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {forecastStatus}. Blue lines are mapped waterways only. Red flood areas will appear here only after a validated forecast is published.
                  </p>
                  <p className="mt-4 text-xs text-slate-500">
                    Jurisdiction: {operationsContext?.jurisdiction?.name || 'Unavailable'}
                  </p>
                </aside>
              )}
          </div>
        </main>
      </div>

      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal
        open={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />

      {/* What-If Heavier Rainfall Scenario Dialog */}
      <ScenarioModal
        open={scenarioModalOpen}
        onClose={() => setScenarioModalOpen(false)}
        scenario={scenario}
      />
    </div>
  );
}
