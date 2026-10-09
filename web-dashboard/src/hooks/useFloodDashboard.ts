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
  OperationsContextResponse,
  SimulationArtifactMetadata,
  SimulationArtifacts,
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
  const [demoExtentGeoJson, setDemoExtentGeoJson] = useState<Record<string, unknown> | null>(null);
  const [environmentalData, setEnvironmentalData] = useState<
    EventEnvironmentResponse['eventEnvironment'] | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [forecastStatus, setForecastStatus] = useState<string>('Loading official forecast status…');
  const [operationsContext, setOperationsContext] = useState<OperationsContextResponse | null>(null);
  const [solverEnabled, setSolverEnabled] = useState(false);
  const [solverCapabilityReason, setSolverCapabilityReason] = useState('Solver capability has not been reported by the server');
  const [solverArtifact, setSolverArtifact] = useState<SimulationArtifacts | null>(null);
  const [artifactMetadata, setArtifactMetadata] = useState<SimulationArtifactMetadata | null>(null);
  const [solverRunRequested, setSolverRunRequested] = useState(false);

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
    async (mode: DashboardMode, customScenarioParams?: ScenarioParameters) => {
      setIsLoading(true);
      setError(null);
      setIsPlaying(false);
      setSolverArtifact(null);
      setArtifactMetadata(null);
      try {
        let resp;
        if (mode === 'DEMO_PREVIEW') {
          setEventData(null);
          setSolverRunRequested(false);
          setForecastStatus('Illustrative Mangaluru demo · not an operational forecast');
          setAvailableTimestamps(DEMO_REPLAY_STATES.map((state) => state.time));
          setCurrentTime('14:26');
          try {
            setDemoExtentGeoJson(await apiClient.fetchFloodExtent('mangaluru-historical-2018'));
          } catch {
            setDemoExtentGeoJson(null);
          }
          return;
        } else if (mode === 'LIVE_FORECAST') {
          resp = await apiClient.fetchLiveForecast();
        } else if (mode === 'HISTORICAL_REPLAY') {
          resp = await apiClient.fetchReplayEvent('mangaluru-historical-2018');
        } else {
          resp = await apiClient.fetchScenario(customScenarioParams || scenarioParams);
        }

        setForecastStatus(resp?.status === 'unavailable'
          ? (resp.reason || 'No validated forecast is available.')
          : (resp?.status || 'Forecast status unavailable'));

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
        } else {
          setEventData(null);
          setAvailableTimestamps([]);
          setCurrentTime('NOW');
        }

        try {
          setOperationsContext(await apiClient.fetchOperationsContext());
        } catch {
          setOperationsContext(null);
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
    [scenarioParams]
  );

  // Initial Data Fetching for active mode
  useEffect(() => {
    let mounted = true;
    queueMicrotask(() => {
      if (mounted) void loadModeData(activeMode);
    });
    return () => {
      mounted = false;
    };
  }, [activeMode, loadModeData]);

  useEffect(() => {
    let mounted = true;
    apiClient.fetchSimulationCapabilities()
      .then((capabilities) => {
        if (!mounted) return;
        setSolverEnabled(capabilities.enabled === true);
        setSolverCapabilityReason(capabilities.reason);
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        setSolverEnabled(false);
        setSolverCapabilityReason(err instanceof Error ? err.message : 'Solver capability is unavailable');
      });
    return () => { mounted = false; };
  }, []);

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
      await loadModeData('SCENARIO', params);
    },
    [loadModeData]
  );

  const loadDemoPreview = useCallback(async () => {
    setSolverRunRequested(false);
    setActiveMode('DEMO_PREVIEW');
    await loadModeData('DEMO_PREVIEW');
  }, [loadModeData]);

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
    if (solverRunRequested) return [];
    if (activeMode === 'DEMO_PREVIEW') {
      return MOCK_ZONES;
    }
    if (activeTimestep?.zones && activeTimestep.zones.length > 0) {
      return activeTimestep.zones;
    }
    return [];
  }, [activeMode, activeTimestep, solverRunRequested]);

  // Selected Zone data
  const selectedZone = useMemo<ZoneData | null>(() => {
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
    if (activeMode === 'DEMO_PREVIEW' && !solverRunRequested) {
      return INITIAL_KPI_SUMMARY;
    }
    if (activeTimestep?.kpi) {
      return activeTimestep.kpi;
    }
    return {
      highRiskZones: 0,
      criticalZones: 0,
      exposedPopulation: 0,
      facilitiesAffected: 0,
      nextOnset: '--',
      nextOnsetZone: 'No validated forecast available',
      nextOnsetTimeRemainingMin: 0,
    };
  }, [activeMode, activeTimestep, solverRunRequested]);

  // Dynamic facilities list
  const facilities = useMemo<CriticalFacility[]>(() => {
    const facs: CriticalFacility[] = [];
    zones.forEach((z) => {
      if (z.facilities) {
        facs.push(...z.facilities);
      }
    });
    return activeMode === 'DEMO_PREVIEW' && !solverRunRequested && facs.length === 0 ? MOCK_FACILITIES : facs;
  }, [activeMode, zones, solverRunRequested]);

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
    return activeMode === 'DEMO_PREVIEW' && !solverRunRequested ? DEMO_PRIORITIES : [];
  }, [activeMode, activeTimestep, solverRunRequested]);

  // Dynamic GeoJSON flood extent polygon
  const floodExtentGeoJson = useMemo(() => {
    if (solverRunRequested) return solverArtifact?.extent || null;
    return activeMode === 'DEMO_PREVIEW' ? demoExtentGeoJson : activeTimestep?.floodExtent || null;
  }, [activeMode, activeTimestep, demoExtentGeoJson, solverArtifact, solverRunRequested]);

  // Replay state tracking for demo timeline
  const replayIndex = useMemo(() => {
    const idx = DEMO_REPLAY_STATES.findIndex((s) => s.time === currentTime);
    return idx !== -1 ? idx : 0;
  }, [currentTime]);

  const currentReplayState = useMemo<ReplayState>(() => {
    const match = solverRunRequested ? undefined : DEMO_REPLAY_STATES.find((s) => s.time === currentTime);
    if (match) return match;
    return {
      time: currentTime,
      statusLabel: `${currentTime} IST`,
      floodDepth: selectedZone?.depth || '—',
      highRiskZones: kpi?.highRiskZones ?? 0,
      criticalZones: kpi?.criticalZones ?? 0,
      exposedPopulation: kpi?.exposedPopulation ?? 0,
      affectedBuildings: selectedZone?.buildingsExposed ?? 0,
      affectedRoads:
        typeof selectedZone?.roadsAffectedKm === 'number'
          ? Math.round(selectedZone.roadsAffectedKm * 4)
          : 0,
    };
  }, [currentTime, selectedZone, kpi, solverRunRequested]);

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
      setError(null);
      if (!solverEnabled) {
        const message = 'Bounded Mangaluru solver is unavailable because the server has disabled the local runner.';
        setError(message);
        throw new Error(message);
      }
      setIsSimulationRunning(true);
      setIsPlaying(false);
      setSolverRunRequested(true);
      setEventData(null);
      setSolverArtifact(null);
      setArtifactMetadata(null);
      try {
        const run = await apiClient.runSimulation({
          zoneId: 'zone-mangaluru-coastal',
          rainfallRateMmHr: options.rainfallRateMmHr ?? 110,
          surgeLevelM: options.surgeLevelM ?? 2.8,
          durationHours: 6,
          scenarioName: 'Bounded Mangaluru solver run',
        });
        if (!run.eventId) throw new Error('Solver response did not include an exact event ID');
        const artifacts = await apiClient.fetchSimulationArtifacts(run.eventId);
        setSolverArtifact(artifacts);
        setArtifactMetadata(artifacts.metadata);
        const timestamps = artifacts.frames
          .map((frame) => frame.timestamp)
          .filter((timestamp): timestamp is string => typeof timestamp === 'string' && timestamp.length > 0);
        setAvailableTimestamps(timestamps);
        setCurrentTime(timestamps[0] || 'MAXIMUM');
        setForecastStatus(`Solver artifact ${run.eventId} loaded · ${artifacts.metadata.artifactKind || 'unknown artifact'}`);
      } catch (err: unknown) {
        // A failed real run remains a failure; never replace it with demo data.
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        throw err;
      } finally {
        setIsSimulationRunning(false);
      }
    },
    [solverEnabled]
  );

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [selectZone, acknowledgeCurrentZone, stepForward, stepBackward, togglePlay]);

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
    activeMode,
    loadDemoPreview,
    environmentalData,
    forecastStatus,
    operationsContext,
    solverEnabled,
    solverCapabilityReason,
    solverArtifact,
    artifactMetadata,
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
