'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ZoneData, KpiSummary } from '@/types/dashboard';
import {
  DEMO_ZONES,
  DEMO_KPI_SUMMARY,
  DEMO_FACILITIES,
  DEMO_EVENT,
  DEMO_REPLAY_STATES,
  DEMO_PRIORITIES,
  DEMO_ROADS,
  DEMO_ALERTS,
  DEMO_SCENARIO,
  DEMO_CITIZEN_ALERT,
  type ReplayState,
} from '@/data/demoFloodEvent';

export interface AcknowledgmentState {
  acknowledged: boolean;
  dutyOfficer: string;
  time: string;
}

export function useFloodDashboard() {
  const [selectedZoneId, setSelectedZoneId] = useState<string>('B');
  const [drawerOpen, setDrawerOpen] = useState<boolean>(true);
  
  // Replay timeline state indices (14:00 -> 14:20 -> 14:26 -> 14:30 -> 14:40 -> 15:00 -> 15:10 -> 15:30 -> 16:00)
  // Default index is 2 (14:26 - Current Telemetry NOW)
  const [replayIndex, setReplayIndex] = useState<number>(2);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 5>(1);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState<boolean>(false);

  // Per-zone acknowledgment status (default: Zone B unacknowledged ready for demo)
  const [acknowledgments, setAcknowledgments] = useState<Record<string, AcknowledgmentState>>({
    B: {
      acknowledged: false,
      dutyOfficer: 'R. Shetty',
      time: '',
    },
  });

  // Action assignments (demo actions start unassigned ready for single-click dispatch)
  const [actionsState, setActionsState] = useState<
    Record<string, { status: 'unassigned' | 'acknowledged' | 'dispatched' | 'done'; team?: string; timestamp?: string }>
  >({
    'act-b1': { status: 'unassigned' },
    'act-b2': { status: 'unassigned' },
    'act-b3': { status: 'unassigned' },
    'act-b4': { status: 'unassigned' },
  });

  // Current replay snapshot
  const currentReplayState: ReplayState = DEMO_REPLAY_STATES[replayIndex] || DEMO_REPLAY_STATES[2];
  const currentTime = currentReplayState.time;

  // Selected Zone from centralized data
  const selectedZone = useMemo<ZoneData>(() => {
    return DEMO_ZONES.find((z) => z.id === selectedZoneId) || DEMO_ZONES[0];
  }, [selectedZoneId]);

  // Compute countdown dynamically against selected zone onset
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

  // Dynamic KPI reflecting the replay evolution while preserving baseline demo spec at 14:26/14:30
  const kpi = useMemo<KpiSummary>(() => {
    return {
      highRiskZones: currentReplayState.highRiskZones,
      criticalZones: currentReplayState.criticalZones,
      exposedPopulation: currentReplayState.exposedPopulation > 0 ? currentReplayState.exposedPopulation : DEMO_KPI_SUMMARY.exposedPopulation,
      facilitiesAffected: DEMO_KPI_SUMMARY.facilitiesAffected,
      nextOnset: DEMO_KPI_SUMMARY.nextOnset,
      nextOnsetZone: DEMO_KPI_SUMMARY.nextOnsetZone,
      nextOnsetTimeRemainingMin: countdownMinutes !== null ? countdownMinutes : DEMO_KPI_SUMMARY.nextOnsetTimeRemainingMin,
    };
  }, [currentReplayState, countdownMinutes]);

  // Acknowledge handler (updates UI immediately to "Acknowledged by R. Shetty · HH:MM")
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

  // Team assignment handler (dispatches Team Delta as per judging demo story)
  const assignAction = useCallback((actionId: string, team = 'Team Delta') => {
    setActionsState((prev) => ({
      ...prev,
      [actionId]: {
        status: 'dispatched',
        team,
        timestamp: currentTime,
      },
    }));
  }, [currentTime]);

  const selectZone = useCallback((zoneId: string) => {
    setSelectedZoneId(zoneId);
    setDrawerOpen(true);
  }, []);

  // Timeline Step Functions
  const stepForward = useCallback(() => {
    setReplayIndex((prev) => Math.min(prev + 1, DEMO_REPLAY_STATES.length - 1));
  }, []);

  const stepBackward = useCallback(() => {
    setReplayIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const resetTimeline = useCallback(() => {
    setReplayIndex(0); // 14:00 baseline
    setIsPlaying(false);
  }, []);

  const setTimelineTime = useCallback((timeStr: string) => {
    const idx = DEMO_REPLAY_STATES.findIndex((s) => s.time === timeStr);
    if (idx !== -1) {
      setReplayIndex(idx);
    }
  }, []);

  // Automatic playback timer
  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = Math.max(1000 / playbackSpeed, 400);
    const timer = setInterval(() => {
      setReplayIndex((prev) => {
        if (prev >= DEMO_REPLAY_STATES.length - 1) {
          setIsPlaying(false); // Stop when reaching end of replay
          return prev;
        }
        return prev + 1;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed]);

  return {
    demoEvent: DEMO_EVENT,
    zones: DEMO_ZONES,
    selectedZone,
    selectedZoneId,
    selectZone,
    drawerOpen,
    setDrawerOpen,
    kpi,
    currentTime,
    setCurrentTime: setTimelineTime,
    countdownMinutes,
    currentZoneAcknowledgment: acknowledgments[selectedZoneId] || {
      acknowledged: false,
      dutyOfficer: 'R. Shetty',
      time: '',
    },
    acknowledgeCurrentZone,
    actionsState,
    assignAction,
    facilities: DEMO_FACILITIES,
    isPlaying,
    setIsPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    shortcutsModalOpen,
    setShortcutsModalOpen,
    // Replay controls
    replayIndex,
    currentReplayState,
    replayStates: DEMO_REPLAY_STATES,
    stepForward,
    stepBackward,
    resetTimeline,
    priorities: DEMO_PRIORITIES,
    affectedRoads: DEMO_ROADS,
    alerts: DEMO_ALERTS,
    scenario: DEMO_SCENARIO,
    citizenAlert: DEMO_CITIZEN_ALERT,
  };
}
