import type {
  ReplayEventResponse,
  SimulationEventSummary,
  RunSimulationResponse,
  EventEnvironmentResponse,
} from './types';
import type { Comparison, ComparisonRequest, RunSnapshot } from '../../../../packages/contracts/src/comparison';

const resolveApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    // In browser: use relative URL so Next rewrites proxy cleanly
    const customUrl = process.env.NEXT_PUBLIC_API_URL;
    if (customUrl && !customUrl.includes('localhost') && !customUrl.includes('127.0.0.1')) {
      return customUrl.replace(/\/$/, '');
    }
    return '';
  }
  // SSR / Node runtime
  return (
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:3000'
  ).replace(/\/$/, '');
};

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = resolveApiBaseUrl();
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  private async readComparisonResponse<T>(res: Response): Promise<T> {
    const data = await res.json().catch(() => null);
    if (!res.ok || data?.success === false) {
      throw new Error(data?.message || data?.error || `Request failed (HTTP ${res.status})`);
    }
    return data as T;
  }

  async listComparisonBaselines(): Promise<SimulationEventSummary[]> {
    const res = await fetch(`${this.baseUrl}/api/v1/simulations`, { cache: 'no-store' });
    const data = await this.readComparisonResponse<{ simulations: SimulationEventSummary[] }>(res);
    if (!Array.isArray(data.simulations)) throw new Error('The run catalog response is invalid.');
    return data.simulations;
  }

  async fetchRunSnapshot(runId: string): Promise<RunSnapshot> {
    const res = await fetch(`${this.baseUrl}/api/v1/simulations/${encodeURIComponent(runId)}/run`, { cache: 'no-store' });
    const snapshot = await this.readComparisonResponse<RunSnapshot>(res);
    if (snapshot.runId !== runId) throw new Error('The server returned a different baseline run.');
    return snapshot;
  }

  async compareSimulations(request: ComparisonRequest): Promise<Comparison> {
    const res = await fetch(`${this.baseUrl}/api/v1/simulations/compare`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request),
    });
    const data = await this.readComparisonResponse<{ success: boolean; comparison: Comparison }>(res);
    const comparison = data.comparison;
    if (!comparison || comparison.baseline?.runId !== request.baselineRunId || comparison.mode !== 'HYPOTHETICAL_SCENARIO') {
      throw new Error('The comparison response does not match the selected baseline.');
    }
    return comparison;
  }

  /**
   * Primary Operational Mode: Fetches 0-6 hour live forward forecast
   * driven by real-time meteorological and marine conditions.
   */
  async fetchLiveForecast(): Promise<ReplayEventResponse> {
    const url = `${this.baseUrl}/api/v1/simulations/live/forecast`;
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!res.ok) {
        throw new Error(`API returned HTTP ${res.status}: ${res.statusText}`);
      }
      return (await res.json()) as ReplayEventResponse;
    } catch (err) {
      console.warn(`[ApiClient] Failed to fetch live forecast from ${url}:`, err);
      throw err;
    }
  }

  /**
   * What-If Contingency Mode: Generates hypothetical stress test sequence.
   */
  async fetchScenario(options: {
    rainfallRateMmHr?: number;
    surgeLevelM?: number;
    scenarioName?: string;
    breachSeaWall?: boolean;
  } = {}): Promise<ReplayEventResponse> {
    const url = `${this.baseUrl}/api/v1/simulations/scenario`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });
      if (!res.ok) throw new Error(`API returned HTTP ${res.status}`);
      return (await res.json()) as ReplayEventResponse;
    } catch (err) {
      console.warn(`[ApiClient] Failed to fetch scenario from ${url}:`, err);
      throw err;
    }
  }

  /**
   * Fetches the complete aggregated historical replay sequence for the event.
   */
  async fetchReplayEvent(
    eventId: string = 'mangaluru-historical-2018'
  ): Promise<ReplayEventResponse> {
    const url = `${this.baseUrl}/api/v1/simulations/${encodeURIComponent(eventId)}/replay`;
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!res.ok) {
        throw new Error(`API returned HTTP ${res.status}: ${res.statusText}`);
      }
      return (await res.json()) as ReplayEventResponse;
    } catch (err) {
      console.warn(`[ApiClient] Failed to fetch replay from ${url}:`, err);
      throw err;
    }
  }

  /**
   * Fetches environmental forcing data for an event.
   */
  async fetchEventEnvironment(
    eventId: string = 'mangaluru-historical-2018'
  ): Promise<EventEnvironmentResponse> {
    const canonicalUrl = `${this.baseUrl}/api/v1/events/${encodeURIComponent(eventId)}/environment`;
    const fallbackUrl = `${this.baseUrl}/api/v1/environmental/events/${encodeURIComponent(eventId)}/summary`;
    try {
      const res = await fetch(canonicalUrl, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (res.ok) {
        return (await res.json()) as EventEnvironmentResponse;
      }
      // Fallback
      const fallbackRes = await fetch(fallbackUrl, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!fallbackRes.ok) {
        throw new Error(`API returned HTTP ${res.status}: ${res.statusText}`);
      }
      return (await fallbackRes.json()) as EventEnvironmentResponse;
    } catch (err) {
      console.warn(`[ApiClient] Failed to fetch event environment from ${canonicalUrl}:`, err);
      throw err;
    }
  }

  /**
   * Lists available hydrodynamic simulation events.
   */
  async listSimulations(): Promise<SimulationEventSummary[]> {
    const url = `${this.baseUrl}/api/v1/simulations`;
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.simulations || [];
    } catch (err) {
      console.warn(`[ApiClient] Failed to list simulations from ${url}:`, err);
      return [];
    }
  }

  /**
   * Fetches normalized flood prediction for an event.
   */
  async fetchForecast(
    eventId: string,
    zoneId?: string
  ): Promise<Record<string, unknown>> {
    const q = zoneId ? `?zoneId=${encodeURIComponent(zoneId)}` : '';
    const url = `${this.baseUrl}/api/v1/simulations/${encodeURIComponent(eventId)}/forecast${q}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as Record<string, unknown>;
  }

  /**
   * Fetches GeoJSON FeatureCollection of SFINCS flood inundation extent.
   */
  async fetchFloodExtent(eventId: string): Promise<Record<string, unknown>> {
    const url = `${this.baseUrl}/api/v1/simulations/${encodeURIComponent(eventId)}/extent`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as Record<string, unknown>;
  }

  /**
   * Triggers an on-demand SFINCS hydrodynamic simulation run (< 15 seconds).
   */
  async runSimulation(options: {
    eventId?: string;
    zoneId?: string;
    rainfallRateMmHr?: number;
    surgeLevelM?: number;
    durationHours?: number;
    scenarioName?: string;
    useLiveWeather?: boolean;
  } = {}): Promise<RunSimulationResponse> {
    const url = `${this.baseUrl}/api/v1/simulations/run`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Simulation failed (HTTP ${res.status}): ${text}`);
    }
    return (await res.json()) as RunSimulationResponse;
  }
}

export const apiClient = new ApiClient();
