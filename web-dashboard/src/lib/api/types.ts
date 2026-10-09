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

export type DashboardMode = 'LIVE_FORECAST' | 'HISTORICAL_REPLAY' | 'SCENARIO' | 'DEMO_PREVIEW';

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
  status?: 'available' | 'unavailable' | 'stale' | string;
  reason?: string;
  event?: {
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

export type ReplaySimulationEvent = NonNullable<ReplayEventResponse['event']>;

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
  message?: string;
  status?: 'completed' | 'queued' | string;
  eventId?: string | null;
  executionTimeMs?: number;
  simulation?: Record<string, unknown> | null;
  persistedRecord?: Record<string, unknown>;
}

export interface SimulationRunnerCapabilities {
  solver: 'sfincs';
  enabled: boolean;
  operational: false;
  reason: string;
}

export interface SimulationArtifactMetadata {
  eventId: string;
  terrainSource: string | null;
  validationStatus: string | null;
  operational: boolean | null;
  artifactKind: string | null;
  frameCount: number;
  provenance: Record<string, unknown> | null;
}

export interface SimulationArtifacts {
  eventId: string;
  forecast: Record<string, unknown>;
  extent: Record<string, unknown>;
  frames: Array<Record<string, unknown>>;
  metadata: SimulationArtifactMetadata;
}

export interface OperationsJurisdiction {
  id: string;
  name: string;
  geometry: Record<string, unknown>;
  boundaryStatus: 'approximate-unverified' | 'verified';
  boundarySource: string;
  modelStatus: 'available' | 'unavailable';
  modelId: string | null;
  teamIds?: string[];
}

export interface OperationsContextResponse {
  success: boolean;
  status: 'pilot' | 'operational' | string;
  user: { id: string; name: string; teamId: string; jurisdictionIds: string[]; canRunScenarios: false } | null;
  canRunScenarios: false;
  jurisdiction: OperationsJurisdiction;
  jurisdictions: OperationsJurisdiction[];
  modelStatus: string;
  boundaryStatus: string;
  notices: string[];
  resources: { forecasts: string; jurisdictions: string; alerts: string };
}

export interface LatestForecastResponse {
  success: boolean;
  forecast: Record<string, unknown> | null;
  status: 'available' | 'stale' | 'unavailable' | string;
  reason?: string;
}

export interface DemoPreviewResponse {
  success: boolean;
  mode: 'DEMO_PREVIEW';
  status: 'illustrative_unvalidated';
  reason: string;
  floodExtent: Record<string, unknown>;
  rivers: Record<string, unknown>;
  provenance: { source: string; operational: false; validationStatus: 'unvalidated' };
}
