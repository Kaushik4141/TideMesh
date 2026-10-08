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
    environmentalData,
    isLoading,
    isSimulationRunning,
    triggerSimulationRun,
    refreshData,
    // Operational 3-Mode Architecture
    activeMode,
    switchMode,
    scenarioParams,
    triggerScenarioRun,
    clockTimes,
    isHypothetical,
    disclaimer,
    currentConditions,
    // Replay controls
    currentReplayState,
    resetTimeline,
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
      {/* Top Header with 3-Mode Segmented Switcher & Live Telemetry Controls */}
      <TopHeader
        onOpenShortcuts={() => setShortcutsModalOpen(true)}
        activeMode={activeMode}
        onSwitchMode={switchMode}
        onOpenScenario={() => setScenarioModalOpen(true)}
        eventName={eventData?.name}
        currentTime={currentTime}
        clockTimes={clockTimes}
        isSimulationRunning={isSimulationRunning}
        onRunSimulation={() => triggerSimulationRun()}
        onRefresh={() => refreshData()}
        isLoading={isLoading}
      />

      {/* Main Body */}
      <div className="flex flex-1 pt-14 overflow-hidden">
        {/* Left Sidebar with Scenario dialog trigger and telemetry data */}
        <Sidebar
          environmentalData={environmentalData}
          activeMode={activeMode}
          currentConditions={currentConditions}
          scenarioParams={scenarioParams}
          onOpenScenario={() => setScenarioModalOpen(true)}
        />

        {/* Content Area */}
        <main className="flex-1 ml-[220px] lg:ml-[232px] p-2.5 lg:p-3 overflow-hidden flex flex-col gap-2">
          {/* Operational Mode Callout Banner */}
          {activeMode === 'SCENARIO' ? (
            <div className="bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg flex items-center justify-between text-xs text-amber-900 shadow-2xs shrink-0 animate-in fade-in">
              <div className="flex items-center gap-2">
                <span className="font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500 text-white text-[10px] tracking-wider">
                  Scenario
                </span>
                <span className="font-semibold">
                  <strong>Hypothetical Stress Test:</strong> Simulating Cloudburst (+{scenarioParams?.rainfallRateMmHr ?? 110} mm/hr) & High Surge (+{scenarioParams?.surgeLevelM ?? 2.8}m). NOT a live forecast.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setScenarioModalOpen(true)}
                  className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] cursor-pointer"
                >
                  Adjust Parameters
                </button>
                <button
                  onClick={() => switchMode('LIVE_FORECAST')}
                  className="px-2 py-0.5 rounded border border-amber-600 text-amber-900 hover:bg-amber-100 font-bold text-[11px] cursor-pointer"
                >
                  Back to Live Mode
                </button>
              </div>
            </div>
          ) : activeMode === 'HISTORICAL_REPLAY' ? (
            <div className="bg-blue-500/10 border border-blue-500/30 px-3 py-1.5 rounded-lg flex items-center justify-between text-xs text-blue-900 shadow-2xs shrink-0 animate-in fade-in">
              <div className="flex items-center gap-2">
                <span className="font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] tracking-wider">
                  Replay
                </span>
                <span className="font-semibold">
                  <strong>Validation Hindcast:</strong> Calibrated reproduction of the May 29, 2018 Cyclone Mekunu event (14:00–16:00 IST).
                </span>
              </div>
              <button
                onClick={() => switchMode('LIVE_FORECAST')}
                className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] cursor-pointer"
              >
                Switch to Live Forecast
              </button>
            </div>
          ) : (
            <div className="bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 rounded-lg flex items-center justify-between text-[11px] text-emerald-900 shadow-2xs shrink-0">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                </span>
                <span className="font-semibold">
                  <strong>Operational Live Forecast:</strong> 0–6 hour forward hydrodynamic prediction generated from real-time meteorological & marine conditions.
                </span>
              </div>
              <span className="text-[10px] text-emerald-700 font-mono font-semibold">
                SFINCS-v2.4 Solver · Continuous Auto-Cycle
              </span>
            </div>
          )}

          {/* KPI Strip */}
          <KpiStrip kpi={kpi} />

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
                  currentTime={currentTime}
                  className="w-full h-full"
                />
              </div>

              {/* Timeline (Always visible in first viewport, fully connected to replay states) */}
              <Timeline
                currentTime={currentTime}
                availableTimestamps={availableTimestamps}
                clockTimes={clockTimes}
                activeMode={activeMode}
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
              />
            </div>

            {/* Zone Detail Drawer */}
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
          </div>
        </main>
      </div>

      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal
        open={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />

      {/* What-If Contingency Scenario Dialog */}
      <ScenarioModal
        open={scenarioModalOpen}
        onClose={() => setScenarioModalOpen(false)}
        initialParams={scenarioParams}
        onRunScenario={triggerScenarioRun}
      />
    </div>
  );
}
