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

export type DashboardMode = 'LIVE_FORECAST' | 'HISTORICAL_REPLAY' | 'SCENARIO';

export interface CurrentConditions {
  rainfallMmHr: number;
  tideSurgeM: number;
  windSpeedKmh: number;
  source?: string;
  marineDatum?: string;
}

export interface ScenarioParameters {
  rainfallRateMmHr?: number;
  surgeLevelM?: number;
  scenarioName?: string;
  breachSeaWall?: boolean;
}

export interface ReplayEventResponse {
  success: boolean;
  mode?: DashboardMode;
  event: {
    id: string;
    name: string;
    type: string;
    mode: string;
    status: string;
    isHypothetical?: boolean;
    disclaimer?: string;
    location: string;
    model: string;
    gridResolutionM: number;
    crs: string;
    timeStepMinutes?: number;
    generatedAt?: string;
    validUntil?: string;
    currentConditions?: CurrentConditions;
    parameters?: ScenarioParameters;
    timestamps: string[];
    clockTimes?: Record<string, string>;
    timesteps: Record<string, ReplayTimestep>;
  };
}

export type ReplaySimulationEvent = ReplayEventResponse['event'];

export interface EventEnvironmentResponse {
  success: boolean;
  eventEnvironment: {
    eventId: string;
    forcing?: {
      rainfall?: {
        peakRateMmHr?: number;
      };
      surge?: {
        peakSurgeM?: number;
      };
    };
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
