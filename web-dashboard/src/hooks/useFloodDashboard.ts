'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ZoneData, KpiSummary } from '@/types/dashboard';
import { MOCK_ZONES, INITIAL_KPI_SUMMARY, MOCK_FACILITIES } from '@/mocks/floodData';

export interface AcknowledgmentState {
  acknowledged: boolean;
  dutyOfficer: string;
  time: string;
}

export function useFloodDashboard() {
  const [selectedZoneId, setSelectedZoneId] = useState<string>('B');
  const [drawerOpen, setDrawerOpen] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<string>('14:26');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 5>(1);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState<boolean>(false);

  // Per-zone acknowledgment status
  const [acknowledgments, setAcknowledgments] = useState<Record<string, AcknowledgmentState>>({
    B: {
      acknowledged: false,
      dutyOfficer: 'R. Shetty',
      time: '14:22',
    },
  });

  // Action assignments
  const [actionsState, setActionsState] = useState<
    Record<string, { status: 'unassigned' | 'acknowledged' | 'dispatched' | 'done'; team?: string; timestamp?: string }>
  >({
    'act-1': { status: 'unassigned' },
    'act-2': { status: 'acknowledged', team: 'Team 2', timestamp: '14:22' },
    'act-3': { status: 'dispatched', team: 'Team 4', timestamp: '14:15' },
  });

  const selectedZone = useMemo<ZoneData>(() => {
    return MOCK_ZONES.find((z) => z.id === selectedZoneId) || MOCK_ZONES[0];
  }, [selectedZoneId]);

  // Compute countdown dynamically
  const countdownMinutes = useMemo<number | null>(() => {
    if (!selectedZone || selectedZone.onset === '--:--') return null;
    const [cHours, cMins] = currentTime.split(':').map(Number);
    const [oHours, oMins] = selectedZone.onset.split(':').map(Number);
    if (isNaN(cHours) || isNaN(cMins) || isNaN(oHours) || isNaN(oMins)) return null;

    const currentTotalMin = cHours * 60 + cMins;
    const onsetTotalMin = oHours * 60 + oMins;
    const diff = onsetTotalMin - currentTotalMin;
    return diff > 0 ? diff : 0;
  }, [currentTime, selectedZone]);

  const acknowledgeCurrentZone = useCallback(() => {
    if (!selectedZoneId) return;
    setAcknowledgments((prev) => ({
      ...prev,
      [selectedZoneId]: {
        acknowledged: true,
        dutyOfficer: 'R. Shetty',
        time: currentTime,
      },
    }));
  }, [selectedZoneId, currentTime]);

  const assignAction = useCallback((actionId: string, team = 'Team 1') => {
    setActionsState((prev) => ({
      ...prev,
      [actionId]: {
        status: 'dispatched',
        team,
        timestamp: '14:26',
      },
    }));
  }, []);

  const selectZone = useCallback((zoneId: string) => {
    setSelectedZoneId(zoneId);
    setDrawerOpen(true);
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input, textarea or select
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      if (e.key === '1') {
        e.preventDefault();
        selectZone('B'); // Rank 1
      } else if (e.key === '2') {
        e.preventDefault();
        selectZone('F'); // Rank 2
      } else if (e.key === '3') {
        e.preventDefault();
        selectZone('C'); // Rank 3
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        acknowledgeCurrentZone();
      } else if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setDrawerOpen(false);
      } else if (e.key === '?') {
        e.preventDefault();
        setShortcutsModalOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectZone, acknowledgeCurrentZone]);

  return {
    zones: MOCK_ZONES,
    selectedZone,
    selectedZoneId,
    selectZone,
    drawerOpen,
    setDrawerOpen,
    kpi: INITIAL_KPI_SUMMARY,
    currentTime,
    setCurrentTime,
    countdownMinutes,
    currentZoneAcknowledgment: acknowledgments[selectedZoneId] || {
      acknowledged: false,
      dutyOfficer: 'R. Shetty',
      time: '',
    },
    acknowledgeCurrentZone,
    actionsState,
    assignAction,
    facilities: MOCK_FACILITIES,
    isPlaying,
    setIsPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    shortcutsModalOpen,
    setShortcutsModalOpen,
  };
}
