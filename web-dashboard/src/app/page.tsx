'use client';

import React from 'react';
import { useFloodDashboard } from '@/hooks/useFloodDashboard';
import { TopHeader } from '@/components/dashboard/TopHeader';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { KpiStrip } from '@/components/dashboard/KpiStrip';
import { FloodMap } from '@/components/dashboard/FloodMap';
import { Timeline } from '@/components/dashboard/Timeline';
import { ZoneDrawer } from '@/components/dashboard/ZoneDrawer';
import { ShortcutsModal } from '@/components/dashboard/ShortcutsModal';

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
    countdownMinutes,
    currentZoneAcknowledgment,
    acknowledgeCurrentZone,
    actionsState,
    assignAction,
    isPlaying,
    setIsPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    shortcutsModalOpen,
    setShortcutsModalOpen,
  } = useFloodDashboard();

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-100 flex flex-col font-sans antialiased text-slate-900 select-none">
      {/* Top Header */}
      <TopHeader onOpenShortcuts={() => setShortcutsModalOpen(true)} />

      {/* Main Body */}
      <div className="flex flex-1 pt-14 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Content Area */}
        <main className="flex-1 ml-[220px] lg:ml-[232px] p-2.5 lg:p-3 overflow-hidden flex flex-col gap-2.5">
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
                  className="w-full h-full"
                />
              </div>

              {/* Timeline (Always visible in first viewport at 1440x900 and 1280x720) */}
              <Timeline
                currentTime={currentTime}
                isPlaying={isPlaying}
                onTogglePlay={() => setIsPlaying((p) => !p)}
                playbackSpeed={playbackSpeed}
                onChangeSpeed={setPlaybackSpeed}
              />
            </div>

            {/* Zone Investigation Drawer (Scrollable body, sticky actions) */}
            {drawerOpen && (
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
                className="h-full"
              />
            )}
          </div>
        </main>
      </div>

      {/* Keyboard Shortcuts Dialog */}
      <ShortcutsModal
        open={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />
    </div>
  );
}
