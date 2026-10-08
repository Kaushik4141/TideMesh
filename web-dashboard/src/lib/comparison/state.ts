import type { Comparison, RunSnapshot } from '../../../../packages/contracts/src/comparison';
import type { SimulationEventSummary } from '../api/types';

export type ComparisonState = {
  result: Comparison | null;
  pending: boolean;
  startedAt: number | null;
  error: string | null;
};
export const initialComparisonState: ComparisonState = {
  result: null, pending: false, startedAt: null, error: null,
};
export type ComparisonAction =
  | { type: 'start'; at: number }
  | { type: 'success'; result: Comparison }
  | { type: 'failure'; error: string };

export function comparisonReducer(state: ComparisonState, action: ComparisonAction): ComparisonState {
  switch (action.type) {
    case 'start': return { ...state, pending: true, startedAt: action.at, error: null };
    case 'success': return { ...state, pending: false, result: action.result, error: null };
    case 'failure': return { ...state, pending: false, error: action.error };
  }
}

export function isCompletedRun(run: SimulationEventSummary): boolean {
  return !['latest', 'live', 'default'].includes(run.eventId.toLowerCase()) &&
    ['ready', 'completed', 'complete', 'success'].includes(run.status.toLowerCase());
}

export function baselineProblem(snapshot: RunSnapshot | null, selectedId: string): string | null {
  if (!snapshot || snapshot.runId !== selectedId) return 'Select and inspect a completed baseline run.';
  if (!snapshot.inputs) return 'This legacy run has no recorded numeric forcing inputs. Create a fresh completed baseline before comparing.';
  if (snapshot.inputs.durationHours < 3) return 'Choose a baseline lasting at least 3 hours; the coastal water-level control is applied at +3h.';
  return null;
}

// A synchronous lock also prevents two clicks before React renders the pending state.
export function createExclusiveTask() {
  let pending = false;
  return async function execute<T>(task: () => Promise<T>): Promise<T | undefined> {
    if (pending) return undefined;
    pending = true;
    try { return await task(); } finally { pending = false; }
  };
}
