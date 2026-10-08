import type {
  ReplayEventResponse,
  SimulationEventSummary,
  RunSimulationResponse,
  EnvironmentalObservationsResponse,
  EventEnvironmentResponse,
} from './types';

const resolveApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    // In browser runtime: use relative URL so Next.js rewrites proxy to backend.
    // This avoids CORS, port mismatches, and Private Network Access restrictions.
    const customUrl = process.env.NEXT_PUBLIC_API_URL;
    if (customUrl && !customUrl.includes('localhost') && !customUrl.includes('127.0.0.1')) {
      return customUrl.replace(/\/$/, '');
    }
    return '';
  }
  // Server runtime (SSR / Node.js)
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
    return this.baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:3000');
  }

  /**
   * Fetches the complete aggregated historical replay sequence for the event.
   */
  async fetchReplayEvent(
    eventId: string = 'mangaluru-historical-2018'
  ): Promise<ReplayEventResponse> {
    const url = `${this.baseUrl}/api/v1/simulations/${encodeURIComponent(eventId)}/replay`;
    try {
      console.info(`[ApiClient] GET ${url}`);
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
    console.info(`[ApiClient] GET ${url}`);
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
   * Fetches live environmental observations ingested from Open-Meteo.
   */
  async fetchEnvironmentalObservations(limit: number = 24): Promise<EnvironmentalObservationsResponse> {
    const url = `${this.baseUrl}/api/v1/environmental-observations?limit=${limit}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as EnvironmentalObservationsResponse;
  }

  /**
   * Fetches event-specific environmental forcing data.
   */
  async fetchEventEnvironment(eventId: string = 'mangaluru-historical-2018'): Promise<EventEnvironmentResponse> {
    const url = `${this.baseUrl}/api/v1/events/${encodeURIComponent(eventId)}/environment`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as EventEnvironmentResponse;
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
  } = {}): Promise<RunSimulationResponse> {
    const url = `${this.baseUrl}/api/v1/simulations/run`;
    console.info(`[ApiClient] POST ${url}`, options);
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

