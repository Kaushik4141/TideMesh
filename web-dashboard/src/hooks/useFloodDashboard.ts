'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  ZoneData,
  KpiSummary,
  CriticalFacility,
} from '@/types/dashboard';
import {
  MOCK_ZONES,
  INITIAL_KPI_SUMMARY,
  MOCK_FACILITIES,
  DEMO_EVENT,
  DEMO_REPLAY_STATES,
  DEMO_PRIORITIES,
  DEMO_ROADS,
  DEMO_ALERTS,
  DEMO_SCENARIO,
  DEMO_CITIZEN_ALERT,
  type ReplayState,
  type PriorityItem,
} from '@/mocks/floodData';
import { apiClient } from '@/lib/api/client';
import type { ReplaySimulationEvent, EventEnvironmentResponse } from '@/lib/api/types';

export type ActionStatus = 'unassigned' | 'dispatched' | 'done';

export interface AcknowledgmentState {
  acknowledged: boolean;
  dutyOfficer: string;
  time: string;
}

export function useFloodDashboard() {
  // Selected Zone ID (defaults to Rank 1 critical zone 'B')
  const [selectedZoneId, setSelectedZoneId] = useState<string>('B');
  const [drawerOpen, setDrawerOpen] = useState<boolean>(true);

  // Time & Playback States
  const [currentTime, setCurrentTime] = useState<string>('14:26');
  const [availableTimestamps, setAvailableTimestamps] = useState<string[]>([
    '14:00',
    '14:15',
    '14:26',
    '14:30',
    '14:45',
    '15:00',
    '15:15',
    '15:30',
    '15:45',
    '16:00',
  ]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 5>(1);

  // Modal Dialogs
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);

  // Asynchronous API Simulation & Event State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSimulationRunning, setIsSimulationRunning] = useState<boolean>(false);
  const [eventData, setEventData] = useState<ReplaySimulationEvent | null>(null);
  const [environmentalData, setEnvironmentalData] = useState<
    EventEnvironmentResponse['eventEnvironment'] | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  // Duty officer acknowledgments per zone
  const [acknowledgments, setAcknowledgments] = useState<
    Record<string, { acknowledged: boolean; dutyOfficer: string; time: string }>
  >({});

  // Dynamic actions dispatch state
  const [actionsState, setActionsState] = useState<
    Record<string, { status: ActionStatus; team?: string; timestamp?: string }>
  >({});

  // Initial Data Fetching from Live API
  useEffect(() => {
    let mounted = true;

    async function fetchInitialReplay() {
      setIsLoading(true);
      setError(null);
      try {
        console.info('[useFloodDashboard] Fetching active replay simulation from API...');
        const resp = await apiClient.fetchReplayEvent('mangaluru-historical-2018');
        if (mounted && resp?.success && resp.event) {
          setEventData(resp.event);
          if (resp.event.timestamps && resp.event.timestamps.length > 0) {
            setAvailableTimestamps(resp.event.timestamps);
            // If currentTime is not in timestamps, set to closest or first
            if (!resp.event.timestamps.includes(currentTime)) {
              const preferred = resp.event.timestamps.includes('14:26')
                ? '14:26'
                : resp.event.timestamps[0];
              setCurrentTime(preferred);
            }
          }
        }

        const envResp = await apiClient.fetchEventEnvironment('mangaluru-historical-2018');
        if (mounted && envResp?.success && envResp.eventEnvironment) {
          setEnvironmentalData(envResp.eventEnvironment);
        }
      } catch (err: unknown) {
        console.warn('[useFloodDashboard] API offline, falling back gracefully to embedded data:', err);
        if (mounted) {
          const message = err instanceof Error ? err.message : 'Failed to fetch replay data';
          setError(message);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    fetchInitialReplay();
    return () => {
      mounted = false;
    };
  }, []);

  // Manual refresh helper
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const resp = await apiClient.fetchReplayEvent('mangaluru-historical-2018');
      if (resp?.success && resp.event) {
        setEventData(resp.event);
        setAvailableTimestamps(resp.event.timestamps);
      }
      const envResp = await apiClient.fetchEventEnvironment('mangaluru-historical-2018');
      if (envResp?.success && envResp.eventEnvironment) {
        setEnvironmentalData(envResp.eventEnvironment);
      }
    } catch (err: unknown) {
      console.warn('[useFloodDashboard] Manual refresh fallback notice:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Derive active timestep data from loaded replay or fall back gracefully
  const activeTimestep = useMemo(() => {
    if (eventData?.timesteps && eventData.timesteps[currentTime]) {
      return eventData.timesteps[currentTime];
    }
    return null;
  }, [eventData, currentTime]);

  // Dynamic Zones list for active timestamp
  const zones = useMemo<ZoneData[]>(() => {
    if (activeTimestep?.zones && activeTimestep.zones.length > 0) {
      return activeTimestep.zones;
    }
    return MOCK_ZONES;
  }, [activeTimestep]);

  // Selected Zone data
  const selectedZone = useMemo<ZoneData>(() => {
    return zones.find((z) => z.id === selectedZoneId) || zones[0];
  }, [zones, selectedZoneId]);

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

  // Dynamic KPI summary for active timestamp
  const kpi = useMemo<KpiSummary>(() => {
    if (activeTimestep?.kpi) {
      return activeTimestep.kpi;
    }
    return INITIAL_KPI_SUMMARY;
  }, [activeTimestep]);

  // Dynamic facilities list
  const facilities = useMemo<CriticalFacility[]>(() => {
    const facs: CriticalFacility[] = [];
    zones.forEach((z) => {
      if (z.facilities) {
        facs.push(...z.facilities);
      }
    });
    return facs.length > 0 ? facs : MOCK_FACILITIES;
  }, [zones]);

  // Dynamic Response Priorities
  const priorities = useMemo<PriorityItem[]>(() => {
    if (activeTimestep?.priorities && activeTimestep.priorities.length > 0) {
      return activeTimestep.priorities.map((p) => ({
        rank: p.rank,
        zoneId: p.zoneId,
        name:
          (p as unknown as { name?: string; zoneName?: string }).zoneName ||
          (p as unknown as { name?: string; zoneName?: string }).name ||
          `Zone ${p.zoneId}`,
        severity: p.severity,
        reason: p.reason,
      }));
    }
    return DEMO_PRIORITIES;
  }, [activeTimestep]);

  // Dynamic GeoJSON flood extent polygon
  const floodExtentGeoJson = useMemo(() => {
    return activeTimestep?.floodExtent || null;
  }, [activeTimestep]);

  // Replay state tracking for demo timeline
  const replayIndex = useMemo(() => {
    const idx = DEMO_REPLAY_STATES.findIndex((s) => s.time === currentTime);
    return idx !== -1 ? idx : 0;
  }, [currentTime]);

  const currentReplayState = useMemo<ReplayState>(() => {
    const match = DEMO_REPLAY_STATES.find((s) => s.time === currentTime);
    if (match) return match;
    return {
      time: currentTime,
      statusLabel: `${currentTime} IST`,
      floodDepth: selectedZone?.depth || '0.31–0.71 m',
      highRiskZones: kpi?.highRiskZones ?? 3,
      criticalZones: kpi?.criticalZones ?? 1,
      exposedPopulation: kpi?.exposedPopulation ?? 4820,
      affectedBuildings: selectedZone?.buildingsExposed ?? 890,
      affectedRoads:
        typeof selectedZone?.roadsAffectedKm === 'number'
          ? Math.round(selectedZone.roadsAffectedKm * 4)
          : 12,
    };
  }, [currentTime, selectedZone, kpi]);

  // Dynamic playback toggle with instant feedback
  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
    if (!isPlaying) {
      setCurrentTime((curr) => {
        const idx = availableTimestamps.indexOf(curr);
        if (idx === -1 || idx >= availableTimestamps.length - 1) {
          return availableTimestamps[0];
        }
        return availableTimestamps[idx + 1];
      });
    }
  }, [isPlaying, availableTimestamps]);

  // Playback timer loop
  useEffect(() => {
    if (!isPlaying || availableTimestamps.length === 0) return;

    const intervalMs = playbackSpeed === 5 ? 250 : playbackSpeed === 2 ? 500 : 1000;
    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const idx = availableTimestamps.indexOf(prev);
        if (idx === -1 || idx >= availableTimestamps.length - 1) {
          return availableTimestamps[0]; // loop back to start
        }
        return availableTimestamps[idx + 1];
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, availableTimestamps]);

  // Step controls
  const stepForward = useCallback(() => {
    const idx = availableTimestamps.indexOf(currentTime);
    if (idx !== -1 && idx < availableTimestamps.length - 1) {
      setCurrentTime(availableTimestamps[idx + 1]);
    }
  }, [currentTime, availableTimestamps]);

  const stepBackward = useCallback(() => {
    const idx = availableTimestamps.indexOf(currentTime);
    if (idx > 0) {
      setCurrentTime(availableTimestamps[idx - 1]);
    }
  }, [currentTime, availableTimestamps]);

  const resetTimeline = useCallback(() => {
    if (availableTimestamps.length > 0) {
      setCurrentTime(availableTimestamps[0]);
    } else {
      setCurrentTime('14:00');
    }
    setIsPlaying(false);
  }, [availableTimestamps]);

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

  // Trigger on-demand simulation run
  const triggerSimulationRun = useCallback(
    async (options: { rainfallRateMmHr?: number; surgeLevelM?: number } = {}) => {
      setIsSimulationRunning(true);
      try {
        const res = await apiClient.runSimulation(options);
        // Refresh replay data
        const refreshed = await apiClient.fetchReplayEvent('mangaluru-historical-2018');
        if (refreshed?.success && refreshed.event) {
          setEventData(refreshed.event);
          setAvailableTimestamps(refreshed.event.timestamps);
        }
        return res;
      } catch (err: unknown) {
        console.error('[useFloodDashboard] Simulation run failed:', err);
        throw err;
      } finally {
        setIsSimulationRunning(false);
      }
    },
    []
  );


  return {
    // Data
    demoEvent: DEMO_EVENT,
    zones,
    selectedZone,
    selectedZoneId,
    selectZone,
    drawerOpen,
    setDrawerOpen,
    kpi,
    facilities,
    priorities,
    floodExtentGeoJson,

    // Time & Playback
    currentTime,
    setCurrentTime,
    availableTimestamps,
    isPlaying,
    setIsPlaying,
    togglePlay,
    playbackSpeed,
    setPlaybackSpeed,
    stepForward,
    stepBackward,
    resetTimeline,
    countdownMinutes,

    // Replay controls & Demo
    replayIndex,
    currentReplayState,
    replayStates: DEMO_REPLAY_STATES,
    affectedRoads: DEMO_ROADS,
    alerts: DEMO_ALERTS,
    scenario: DEMO_SCENARIO,
    citizenAlert: DEMO_CITIZEN_ALERT,

    // State & Status
    isLoading,
    isSimulationRunning,
    error,
    eventData,
    environmentalData,
    triggerSimulationRun,
    refreshData,

    // Actions & Acknowledgments
    currentZoneAcknowledgment: acknowledgments[selectedZoneId] || {
      acknowledged: false,
      dutyOfficer: 'R. Shetty',
      time: '',
    },
    acknowledgeCurrentZone,
    actionsState,
    assignAction,

    // Modal
    shortcutsModalOpen,
    setShortcutsModalOpen,
  };
}
