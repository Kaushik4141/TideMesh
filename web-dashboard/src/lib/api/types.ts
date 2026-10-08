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

export interface EnvironmentalObservation {
  id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  elevation: number;
  rainfall: number;
  precipitation: number;
  temperature: number;
  surfacePressure: number;
  windSpeed: number;
  tideLevel?: number | null;
  stormSurge?: number | null;
}

export interface EnvironmentalObservationsResponse {
  success: boolean;
  count: number;
  observations: EnvironmentalObservation[];
}

export interface EventEnvironmentResponse {
  success: boolean;
  eventEnvironment: {
    eventId: string;
    location: string;
    period: {
      start: string;
      end: string;
    };
    forcing: {
      rainfall: {
        source: string;
        peakRateMmHr: number;
        status: string;
        hourlyTimeSeries: Array<{ timestamp: string; rainfallMmHr: number }>;
      };
      surge: {
        source: string;
        peakSurgeM: number;
        status: string;
        hourlyTimeSeries: Array<{ timestamp: string; surgeLevelM: number }>;
      };
    };
  };
}

