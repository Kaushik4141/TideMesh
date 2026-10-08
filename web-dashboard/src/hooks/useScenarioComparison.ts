'use client';

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type { ComparisonRequest, RunSnapshot } from '../../../packages/contracts/src/comparison';
import type { SimulationEventSummary } from '@/lib/api/types';
import { apiClient } from '@/lib/api/client';
import { baselineProblem, comparisonReducer, createExclusiveTask, initialComparisonState, isCompletedRun } from '@/lib/comparison/state';

export function useScenarioComparison() {
  const [state, dispatch] = useReducer(comparisonReducer, initialComparisonState);
  const [catalog, setCatalog] = useState<SimulationEventSummary[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [snapshot, setSnapshot] = useState<RunSnapshot | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [baselineRunning, setBaselineRunning] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const [baselineError, setBaselineError] = useState<string | null>(null);
  const [operationStartedAt, setOperationStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const exclusive = useRef(createExclusiveTask());
  const selectedIdRef = useRef('');
  const inspection = useRef(0);

  const selectBaseline = useCallback(async (id: string) => {
    const request = ++inspection.current;
    selectedIdRef.current = id;
    setSelectedId(id); setSnapshot(null); setSnapshotError(null); setSnapshotLoading(!!id);
    if (!id) return;
    try {
      const value = await apiClient.fetchRunSnapshot(id);
      if (request === inspection.current) setSnapshot(value);
    } catch (error) {
      if (request === inspection.current) setSnapshotError(error instanceof Error ? error.message : String(error));
    } finally { if (request === inspection.current) setSnapshotLoading(false); }
  }, []);

  const refreshCatalog = useCallback(async (preferredId?: string) => {
    setCatalogLoading(true); setCatalogError(null);
    try {
      const runs = (await apiClient.listComparisonBaselines()).filter(isCompletedRun);
      setCatalog(runs);
      const selected = preferredId && runs.some(run => run.eventId === preferredId) ? preferredId :
        runs.some(run => run.eventId === selectedIdRef.current) ? selectedIdRef.current : (runs[0]?.eventId ?? '');
      await selectBaseline(selected);
      return runs;
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : String(error));
    } finally { setCatalogLoading(false); }
  }, [selectBaseline]);

  const busy = state.pending || baselineRunning;
  const start = state.pending ? state.startedAt : operationStartedAt;
  useEffect(() => {
    if (!busy || start === null) return;
    const update = () => setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [busy, start]);

  const runComparison = useCallback(async (scenario: ComparisonRequest['scenario']) => exclusive.current(async () => {
    const problem = baselineProblem(snapshot, selectedId);
    if (problem) { dispatch({ type: 'failure', error: problem }); return false; }
    dispatch({ type: 'start', at: Date.now() });
    setElapsedSeconds(0);
    try {
      const result = await apiClient.compareSimulations({ baselineRunId: selectedId, scenario });
      dispatch({ type: 'success', result });
      return true;
    } catch (error) {
      dispatch({ type: 'failure', error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }), [snapshot, selectedId]);

  const createBaseline = useCallback(async (scenario: ComparisonRequest['scenario']) => exclusive.current(async () => {
    setBaselineRunning(true); setOperationStartedAt(Date.now()); setBaselineError(null); setElapsedSeconds(0);
    try {
      const response = await apiClient.runSimulation({ ...scenario, durationHours: 6, useLiveWeather: false,
        scenarioName: 'Comparison baseline' });
      if (!response.success) throw new Error(response.message || 'Baseline runner did not complete.');
      const id = response.simulation.eventId;
      if (typeof id !== 'string' || ['latest', 'live', 'default'].includes(id.toLowerCase())) {
        throw new Error('Baseline completed without an immutable run ID. Refresh the catalog to inspect available runs.');
      }
      // The catalog must identify this run as completed before it can be selected.
      const runs = await refreshCatalog(id);
      if (!runs?.some(run => run.eventId === id)) {
        throw new Error(`Run ${id} was returned by the runner but is not available as a completed catalog baseline. Refresh the catalog before comparing.`);
      }
      return true;
    } catch (error) {
      setBaselineError(error instanceof Error ? error.message : String(error));
      return false;
    } finally { setBaselineRunning(false); }
  }), [refreshCatalog]);

  return { ...state, catalog, selectedId, setSelectedId: selectBaseline, snapshot, catalogLoading, snapshotLoading,
    baselineRunning, busy, elapsedSeconds, catalogError, snapshotError, baselineError,
    refreshCatalog, runComparison, createBaseline, baselineProblem: baselineProblem(snapshot, selectedId) };
}
