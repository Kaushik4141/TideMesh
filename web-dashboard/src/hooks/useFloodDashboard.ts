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
import type {
  ReplaySimulationEvent,
  EventEnvironmentResponse,
  DashboardMode,
  ScenarioParameters,
} from '@/lib/api/types';

export type ActionStatus = 'unassigned' | 'dispatched' | 'done';

export interface AcknowledgmentState {
  acknowledged: boolean;
  dutyOfficer: string;
  time: string;
}

export function useFloodDashboard() {
  // Operational Dashboard Mode: LIVE_FORECAST (Default), HISTORICAL_REPLAY, or SCENARIO
  const [activeMode, setActiveMode] = useState<DashboardMode>('LIVE_FORECAST');
  const [scenarioParams, setScenarioParams] = useState<ScenarioParameters>({
    rainfallRateMmHr: 110,
    surgeLevelM: 2.80,
    scenarioName: 'Extreme Monsoonal Cloudburst (+110 mm/hr) + 1-in-100 Year Surge',
    breachSeaWall: true,
  });

  // Selected Zone ID (defaults to Rank 1 critical zone 'B')
  const [selectedZoneId, setSelectedZoneId] = useState<string>('B');
  const [drawerOpen, setDrawerOpen] = useState<boolean>(true);

  // Time & Playback States
  const [currentTime, setCurrentTime] = useState<string>('NOW');
  const [availableTimestamps, setAvailableTimestamps] = useState<string[]>([
    'NOW',
    '+15m',
    '+30m',
    '+45m',
    '+1h',
    '+1h 30m',
    '+2h',
    '+3h',
    '+4h',
    '+6h',
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

  // Core Data Loader parameterized by active mode
  const loadModeData = useCallback(
    async (mode: DashboardMode) => {
      setIsLoading(true);
      setError(null);
      setIsPlaying(false);
      if (mode === 'SCENARIO') {
        // Scenario comparison is loaded by useScenarioComparison from exact runs.
        setEventData(null);
        setIsLoading(false);
        return;
      }
      try {
        let resp;
        if (mode === 'LIVE_FORECAST') {
          resp = await apiClient.fetchLiveForecast();
        } else if (mode === 'HISTORICAL_REPLAY') {
          resp = await apiClient.fetchReplayEvent('mangaluru-historical-2018');
        }

        if (resp?.success && resp.event) {
          setEventData(resp.event);
          if (resp.event.timestamps && resp.event.timestamps.length > 0) {
            setAvailableTimestamps(resp.event.timestamps);
            // Default to appropriate starting timestamp for mode
            if (mode === 'LIVE_FORECAST') {
              setCurrentTime(resp.event.timestamps[0] || 'NOW');
            } else if (mode === 'HISTORICAL_REPLAY') {
              const defaultTs = resp.event.timestamps.includes('14:30')
                ? '14:30'
                : resp.event.timestamps.includes('14:26')
                ? '14:26'
                : resp.event.timestamps[0];
              setCurrentTime(defaultTs);
            } else {
              setCurrentTime(resp.event.timestamps[0] || 'T+00');
            }
          }
        }

        // Fetch live environmental telemetry for sidebar
        try {
          const envResp = await apiClient.fetchEventEnvironment('mangaluru-historical-2018');
          if (envResp?.success && envResp.eventEnvironment) {
            setEnvironmentalData(envResp.eventEnvironment);
          }
        } catch {}
      } catch (err: unknown) {
        console.warn(`[useFloodDashboard] Mode ${mode} fetch warning:`, err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Initial Data Fetching for active mode
  useEffect(() => {
    let mounted = true;
    if (mounted) {
      loadModeData(activeMode);
    }
    return () => {
      mounted = false;
    };
  }, [activeMode, loadModeData]);

  // Mode switcher handler
  const switchMode = useCallback(
    (newMode: DashboardMode) => {
      setActiveMode(newMode);
    },
    []
  );

  // Trigger custom scenario stress-test
  const triggerScenarioRun = useCallback(
    async (params: ScenarioParameters) => {
      setScenarioParams(params);
      setActiveMode('SCENARIO');
      await loadModeData('SCENARIO');
    },
    [loadModeData]
  );

  // Manual refresh helper
  const refreshData = useCallback(async () => {
    await loadModeData(activeMode);
  }, [activeMode, loadModeData]);

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
    if (activeTimestep?.kpi?.nextOnsetTimeRemainingMin != null) {
      return activeTimestep.kpi.nextOnsetTimeRemainingMin;
    }
    if (!selectedZone || selectedZone.onset === '--:--') return null;

    if (selectedZone.onset.startsWith('+')) {
      const matchMin = selectedZone.onset.match(/\+(\d+)m/);
      const matchHour = selectedZone.onset.match(/\+(\d+)h/);
      let onsetOffset = 0;
      if (matchHour) onsetOffset += parseInt(matchHour[1], 10) * 60;
      if (matchMin) onsetOffset += parseInt(matchMin[1], 10);

      let currentOffset = 0;
      if (currentTime === 'NOW') currentOffset = 0;
      else if (currentTime.startsWith('+')) {
        const cHour = currentTime.match(/\+(\d+)h/);
        const cMin = currentTime.match(/\+(\d+)m/);
        if (cHour) currentOffset += parseInt(cHour[1], 10) * 60;
        if (cMin) currentOffset += parseInt(cMin[1], 10);
      }
      return Math.max(0, onsetOffset - currentOffset);
    }

    const [cHours, cMins] = currentTime.split(':').map(Number);
    const [oHours, oMins] = selectedZone.onset.split(':').map(Number);
    if (isNaN(cHours) || isNaN(cMins) || isNaN(oHours) || isNaN(oMins)) return null;

    const currentTotalMin = cHours * 60 + cMins;
    const onsetTotalMin = oHours * 60 + oMins;
    const diff = onsetTotalMin - currentTotalMin;
    return diff > 0 ? diff : 0;
  }, [currentTime, selectedZone, activeTimestep]);

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

  const clockTimes = useMemo<Record<string, string>>(() => {
    return eventData?.clockTimes || {};
  }, [eventData]);

  const currentReplayState = useMemo<ReplayState>(() => {
    const match = DEMO_REPLAY_STATES.find((s) => s.time === currentTime);
    const clock = clockTimes[currentTime];
    const computedLabel =
      activeMode === 'LIVE_FORECAST'
        ? clock ? `${currentTime} (${clock} IST)` : `${currentTime} Forecast`
        : activeMode === 'SCENARIO'
        ? `${currentTime} · Stress Test`
        : `${currentTime} IST`;

    if (match && activeMode === 'HISTORICAL_REPLAY') return match;
    return {
      time: currentTime,
      statusLabel: computedLabel,
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
  }, [currentTime, selectedZone, kpi, clockTimes, activeMode]);

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

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeMode === 'SCENARIO') return;
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
        togglePlay();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        stepForward();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        stepBackward();
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
  }, [activeMode, selectZone, acknowledgeCurrentZone, stepForward, stepBackward, togglePlay]);

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

    // Operational Mode Architecture
    activeMode,
    setActiveMode,
    switchMode,
    scenarioParams,
    setScenarioParams,
    triggerScenarioRun,
    clockTimes,
    isHypothetical: eventData?.isHypothetical ?? (activeMode === 'SCENARIO'),
    disclaimer: eventData?.disclaimer ?? '',
    currentConditions: eventData?.currentConditions,

    // Modal
    shortcutsModalOpen,
    setShortcutsModalOpen,
  };
}
