import type { ZoneData, KpiSummary } from '@/types/dashboard';

export interface PriorityItem {
  rank: number;
  zoneId: string;
  zoneName: string;
  severity: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  score: number;
  reason: string;
  recommendedAction: string;
}

export interface ReplayTimestep {
  timestamp: string;
  rainfallMmHr: number;
  tideLevelM: number;
  maxDepthM: number;
  floodedAreaKm2: number;
  kpi: KpiSummary;
  floodExtent: Record<string, unknown> | null;
  zones: ZoneData[];
  priorities: PriorityItem[];
}

export interface ReplayEventResponse {
  success: boolean;
  event: {
    id: string;
    name: string;
    type: 'HISTORICAL REPLAY' | 'SIMULATION';
    mode: string;
    status: string;
    location: string;
    model: string;
    gridResolutionM: number;
    crs: string;
    timeStepMinutes: number;
    timestamps: string[];
    timesteps: Record<string, ReplayTimestep>;
  };
}

export interface SimulationEventSummary {
  eventId: string;
  name: string;
  location: string;
  startTime: string;
  endTime: string;
  maxDepthM: number;
  floodedAreaKm2?: number;
  model: string;
  status: string;
}

export interface RunSimulationResponse {
  success: boolean;
  message: string;
  executionTimeMs: number;
  simulation: Record<string, unknown>;
  persistedRecord?: Record<string, unknown>;
}
