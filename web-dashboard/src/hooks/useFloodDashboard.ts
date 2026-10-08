'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ZoneData, KpiSummary, CriticalFacility } from '@/types/dashboard';
import { MOCK_ZONES, INITIAL_KPI_SUMMARY, MOCK_FACILITIES } from '@/mocks/floodData';
import { apiClient } from '@/lib/api/client';
import type { ReplayEventResponse, PriorityItem } from '@/lib/api/types';

export interface AcknowledgmentState {
  acknowledged: boolean;
  dutyOfficer: string;
  time: string;
}

export function useFloodDashboard() {
  const [selectedZoneId, setSelectedZoneId] = useState<string>('B');
  const [drawerOpen, setDrawerOpen] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<string>('14:30');
  const [availableTimestamps, setAvailableTimestamps] = useState<string[]>([
    '14:00', '14:15', '14:30', '14:45', '15:00', '15:15', '15:30', '15:45', '16:00'
  ]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 5>(1);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSimulationRunning, setIsSimulationRunning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Loaded event metadata
  const [eventData, setEventData] = useState<ReplayEventResponse['event'] | null>(null);

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

  // Initial fetch of real SFINCS replay data from Hono API
  useEffect(() => {
    let mounted = true;
    async function fetchInitialReplay() {
      setIsLoading(true);
      try {
        const resp = await apiClient.fetchReplayEvent('mangaluru-historical-2018');
        if (mounted && resp?.success && resp.event) {
          setEventData(resp.event);
          if (resp.event.timestamps && resp.event.timestamps.length > 0) {
            setAvailableTimestamps(resp.event.timestamps);
            // Default to 14:30 onset step
            if (resp.event.timestamps.includes('14:30')) {
              setCurrentTime('14:30');
            } else {
              setCurrentTime(resp.event.timestamps[0]);
            }
          }
          setError(null);
        }
      } catch (err: unknown) {
        if (mounted) {
          const message = err instanceof Error ? err.message : String(err);
          console.warn('[useFloodDashboard] API replay fetch failed, using validated baseline fixtures:', message);
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
    if (activeTimestep?.priorities) {
      return activeTimestep.priorities;
    }
    return [];
  }, [activeTimestep]);

  // Dynamic GeoJSON flood extent polygon
  const floodExtentGeoJson = useMemo(() => {
    return activeTimestep?.floodExtent || null;
  }, [activeTimestep]);

  // Dynamic playback toggle with instant feedback
  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      const nextPlaying = !prev;
      return nextPlaying;
    });
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

  // Trigger on-demand simulation run
  const triggerSimulationRun = useCallback(async (options: { rainfallRateMmHr?: number; surgeLevelM?: number } = {}) => {
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
  }, []);

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
    countdownMinutes,

    // State & Status
    isLoading,
    isSimulationRunning,
    error,
    eventData,
    triggerSimulationRun,

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
