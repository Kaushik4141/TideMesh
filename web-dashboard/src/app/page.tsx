'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFloodDashboard } from '@/hooks/useFloodDashboard';
import { TopHeader } from '@/components/dashboard/TopHeader';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { KpiStrip, KpiStripSkeleton } from '@/components/dashboard/KpiStrip';
import { FloodMap, MapSkeleton } from '@/components/dashboard/FloodMap';
import { Timeline, TimelineSkeleton } from '@/components/dashboard/Timeline';
import { ZoneDrawer, ZoneDrawerSkeleton } from '@/components/dashboard/ZoneDrawer';
import { DataErrorPanel } from '@/components/dashboard/DashboardSkeletons';
import { ShortcutsCustomizationModal } from '@/components/dashboard/ShortcutsCustomizationModal';
import { ScenarioModal } from '@/components/dashboard/ScenarioModal';
import { useShortcuts } from '@/hooks/useShortcuts';
import type { ShortcutActionId } from '@/lib/shortcuts';

export default function OverviewPage() {
  const router = useRouter();

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
    countdownMinutes,
    currentZoneAcknowledgment,
    acknowledgeCurrentZone,
    actionsState,
    assignAction,
    isPlaying,
    setIsPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    // Replay controls
    currentReplayState,
    stepForward,
    stepBackward,
    resetTimeline,
    scenario,
  } = useFloodDashboard();

  const [scenarioModalOpen, setScenarioModalOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [isCapturingKey, setIsCapturingKey] = useState(false);

  // Data loading and error watchdog states
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadKey, setLoadKey] = useState(0);

  // Loading state lifecycle with 3s watchdog time limit and dev toggles (?loading=1, ?error=1)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const forceLoading = params.get('loading') === '1' || params.get('loading') === 'true';
    const forceError = params.get('error') === '1' || params.get('timeout') === '1';

    if (forceLoading) {
      setIsLoading(true);
      setLoadError(false);
      return;
    }

    if (forceError) {
      setIsLoading(false);
      setLoadError(true);
      return;
    }

    setIsLoading(true);
    setLoadError(false);

    // Mock load delay of ~600ms
    const loadTimer = setTimeout(() => {
      setIsLoading(false);
    }, 600);

    // Time limit: if data hasn't loaded within 3 seconds, replace skeleton with error panel
    const watchdogTimer = setTimeout(() => {
      setIsLoading((loading) => {
        if (loading) {
          setLoadError(true);
          return false;
        }
        return false;
      });
    }, 3000);

    return () => {
      clearTimeout(loadTimer);
      clearTimeout(watchdogTimer);
    };
  }, [loadKey]);

  const handleRetry = () => {
    setLoadError(false);
    setIsLoading(true);
    setLoadKey((k) => k + 1);
  };

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

  // Action handlers map for keyboard shortcut registry
  const actionHandlers = useMemo<Partial<Record<ShortcutActionId, () => void>>>(() => {
    // Determine priority zones for quick jumping
    const priorityZones = [...zones].sort((a, b) => a.rank - b.rank);
    const currentIndex = priorityZones.findIndex((z) => z.id === selectedZoneId);

    return {
      acknowledge: () => {
        acknowledgeCurrentZone();
      },
      assignTeam: () => {
        // Dispatches first pending action for current zone
        const firstPending = selectedZone.actions.find(
          (a) => (actionsState[a.id]?.status || a.status) === 'unassigned'
        );
        if (firstPending) {
          assignAction(firstPending.id, 'Team Delta');
        } else if (selectedZone.actions[0]) {
          assignAction(selectedZone.actions[0].id, 'Team Delta');
        }
      },
      selectZone1: () => {
        selectZone('B');
      },
      selectZone2: () => {
        selectZone('F');
      },
      selectZone3: () => {
        selectZone('C');
      },
      nextZone: () => {
        if (priorityZones.length > 0) {
          const nextIdx = (currentIndex + 1) % priorityZones.length;
          selectZone(priorityZones[nextIdx].id);
        }
      },
      prevZone: () => {
        if (priorityZones.length > 0) {
          const prevIdx = (currentIndex - 1 + priorityZones.length) % priorityZones.length;
          selectZone(priorityZones[prevIdx].id);
        }
      },
      openZone: () => {
        router.push('/zones');
      },
      closeDrawer: () => {
        if (shortcutsModalOpen) {
          setShortcutsModalOpen(false);
        } else if (scenarioModalOpen) {
          setScenarioModalOpen(false);
        } else {
          setDrawerOpen(false);
        }
      },
      toggleTimeline: () => {
        setIsPlaying((p) => !p);
      },
      jumpNow: () => {
        setCurrentTime('14:26');
      },
      jumpOnset: () => {
        setCurrentTime('14:30');
      },
      focusAlerts: () => {
        router.push('/degraded-state');
      },
      openShortcuts: () => {
        setShortcutsModalOpen(true);
      },
    };
  }, [
    acknowledgeCurrentZone,
    actionsState,
    assignAction,
    router,
    scenarioModalOpen,
    selectZone,
    selectedZone,
    selectedZoneId,
    setCurrentTime,
    setDrawerOpen,
    setIsPlaying,
    shortcutsModalOpen,
    zones,
  ]);

  const {
    bindings,
    updateBinding,
    swapBindings,
    resetActionBinding,
    resetAllBindings,
    toastMessage,
    getBindingDisplay,
    canPerformAction,
  } = useShortcuts(actionHandlers, { isCapturing: isCapturingKey });

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-100 flex flex-col font-sans antialiased text-slate-900 select-none">
      {/* Top Header with Wordmark and Role-based Profile Menu */}
      <TopHeader onOpenShortcuts={() => setShortcutsModalOpen(true)} />

      {/* Main Body */}
      <div className="flex flex-1 pt-14 overflow-hidden">
        {/* Left Sidebar with Scenario dialog trigger */}
        <Sidebar onOpenScenario={() => setScenarioModalOpen(true)} />

        {/* Content Area */}
        <main
          className="flex-1 ml-[220px] lg:ml-[232px] p-2.5 lg:p-3 overflow-hidden flex flex-col gap-2.5"
          aria-busy={isLoading ? 'true' : undefined}
        >
          {isLoading && (
            <span className="sr-only" role="status">
              Loading zone data
            </span>
          )}

          {/* KPI Strip: Plain card shells stay visible at all times; contents swap */}
          {loadError ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2 lg:gap-2.5 w-full">
              {['High-risk zones', 'Critical zones', 'Exposed (est.)', 'Facilities affected', 'Next onset'].map((label) => (
                <div
                  key={label}
                  className="bg-white border border-[#CBD5E1] rounded-[4px] p-4 shadow-none flex flex-col justify-between overflow-hidden"
                >
                  <div className="pb-1">
                    <span className="text-xs font-normal text-[#475569] leading-tight">{label}</span>
                  </div>
                  <div className="my-0.5">
                    <span className="font-display font-bold text-[32px] leading-tight tracking-tight tabular-nums text-slate-300">
                      —
                    </span>
                  </div>
                  <div className="text-[11px] leading-tight text-slate-400 mt-0.5 font-normal">
                    Unavailable
                  </div>
                </div>
              ))}
            </div>
          ) : isLoading ? (
            <KpiStripSkeleton />
          ) : (
            <KpiStrip kpi={kpi} />
          )}

          {/* Workspace Area: Error panel OR Map + Timeline + Zone Drawer */}
          {loadError ? (
            <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
              <DataErrorPanel onRetry={handleRetry} />
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col xl:flex-row gap-2.5 overflow-hidden">
              {/* Map and Timeline Column */}
              <div className="flex-1 min-w-0 flex flex-col gap-2.5 overflow-hidden">
                {/* Flood Map Canvas (≥ 55% of workspace) */}
                <div className="flex-1 min-h-0 relative">
                  {isLoading ? (
                    <MapSkeleton />
                  ) : (
                    <FloodMap
                      zones={zones}
                      facilities={facilities}
                      selectedZoneId={selectedZoneId}
                      onSelectZone={selectZone}
                      className="w-full h-full"
                    />
                  )}
                </div>

                {/* Timeline (Always visible in first viewport, fully connected to replay states) */}
                {isLoading ? (
                  <TimelineSkeleton />
                ) : (
                  <Timeline
                    currentTime={currentTime}
                    isPlaying={isPlaying}
                    onTogglePlay={() => setIsPlaying((p) => !p)}
                    playbackSpeed={playbackSpeed}
                    onChangeSpeed={setPlaybackSpeed}
                    onStepForward={stepForward}
                    onStepBackward={stepBackward}
                    onReset={resetTimeline}
                    currentFloodDepth={currentReplayState.floodDepth}
                    statusLabel={currentReplayState.statusLabel}
                  />
                )}
              </div>

              {/* Zone Investigation Drawer (Scrollable body, sticky actions) */}
              {isLoading ? (
                <ZoneDrawerSkeleton />
              ) : (
                drawerOpen && (
                  <ZoneDrawer
                    zone={selectedZone}
                    allZones={zones}
                    onSelectZone={selectZone}
                    onClose={() => setDrawerOpen(false)}
                    countdownMinutes={countdownMinutes}
                    acknowledgment={currentZoneAcknowledgment}
                    onAcknowledge={acknowledgeCurrentZone}
                    onAssignAction={assignAction}
                    actionsState={actionsState}
                    acknowledgeKeyHint={getBindingDisplay('acknowledge')}
                    assignTeamKeyHint={getBindingDisplay('assignTeam')}
                    canAcknowledge={canPerformAction('acknowledge')}
                    canAssignTeam={canPerformAction('assignTeam')}
                    className="h-full"
                  />
                )
              )}
            </div>
          )}
        </main>
      </div>

      {/* Shortcuts Customization Modal */}
      <ShortcutsCustomizationModal
        open={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
        bindings={bindings}
        onUpdateBinding={updateBinding}
        onSwapBindings={swapBindings}
        onResetAction={resetActionBinding}
        onResetAll={resetAllBindings}
        setIsCapturingKey={setIsCapturingKey}
      />

      {/* What-If Heavier Rainfall Scenario Dialog */}
      <ScenarioModal
        open={scenarioModalOpen}
        onClose={() => setScenarioModalOpen(false)}
        scenario={scenario}
      />

      {/* Role Permission Toast Announcement */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 right-4 z-50 bg-slate-900/95 text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-150 flex items-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
