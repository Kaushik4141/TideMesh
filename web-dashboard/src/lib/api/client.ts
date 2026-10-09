import type {
  ReplayEventResponse,
  SimulationEventSummary,
  RunSimulationResponse,
  EventEnvironmentResponse,
  OperationsContextResponse,
  LatestForecastResponse,
  SimulationRunnerCapabilities,
  SimulationArtifacts,
  SimulationArtifactMetadata,
  DemoPreviewResponse,
} from './types';

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

  async fetchOperationsContext(): Promise<OperationsContextResponse> {
    const res = await fetch(`${this.baseUrl}/api/v1/operations/context`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Operations context unavailable (HTTP ${res.status})`);
    return (await res.json()) as OperationsContextResponse;
  }

  async fetchLatestForecast(): Promise<LatestForecastResponse> {
    const res = await fetch(`${this.baseUrl}/api/v1/operations/forecasts/latest`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Latest forecast unavailable (HTTP ${res.status})`);
    return (await res.json()) as LatestForecastResponse;
  }

  async fetchDemoPreview(): Promise<DemoPreviewResponse> {
    const res = await fetch(`${this.baseUrl}/api/v1/simulations/demo/preview`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Demo preview unavailable (HTTP ${res.status})`);
    return (await res.json()) as DemoPreviewResponse;
  }

  async fetchSimulationCapabilities(): Promise<SimulationRunnerCapabilities> {
    const res = await fetch(`${this.baseUrl}/api/v1/simulations/capabilities`, {
      headers: { Accept: 'application/json' }, cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Solver capability status unavailable (HTTP ${res.status})`);
    return (await res.json()) as SimulationRunnerCapabilities;
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

  async fetchSimulationFrames(eventId: string): Promise<{
    eventId: string;
    artifactKind?: string;
    operational?: boolean;
    validationStatus?: string;
    frames: Array<Record<string, unknown>>;
  }> {
    const url = `${this.baseUrl}/api/v1/simulations/${encodeURIComponent(eventId)}/frames`;
    const res = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' });
    if (!res.ok) throw new Error(`Simulation frames unavailable (HTTP ${res.status})`);
    return (await res.json()) as {
      eventId: string;
      artifactKind?: string;
      operational?: boolean;
      validationStatus?: string;
      frames: Array<Record<string, unknown>>;
    };
  }

  /** Load only artifacts belonging to the exact solver event ID. */
  async fetchSimulationArtifacts(eventId: string, options: { attempts?: number; delayMs?: number } = {}): Promise<SimulationArtifacts> {
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(eventId)) throw new Error('Invalid solver event ID');
    const attempts = Math.max(1, Math.min(options.attempts ?? 5, 5));
    const delayMs = Math.max(250, options.delayMs ?? 750);
    let lastError: unknown;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        const [forecastResponse, extent, framesResponse] = await Promise.all([
          this.fetchForecast(eventId),
          this.fetchFloodExtent(eventId),
          this.fetchSimulationFrames(eventId),
        ]);
        const forecast = (forecastResponse.forecast && typeof forecastResponse.forecast === 'object'
          ? forecastResponse.forecast
          : forecastResponse) as Record<string, unknown>;
        const returnedEventId = forecast.eventId;
        if (returnedEventId !== eventId || framesResponse.eventId !== eventId) {
          throw new Error('Solver artifact event ID mismatch');
        }
        const metrics = forecast.metrics && typeof forecast.metrics === 'object'
          ? forecast.metrics as Record<string, unknown>
          : {};
        const metadata: SimulationArtifactMetadata = {
          eventId,
          terrainSource: typeof metrics.terrainSource === 'string' ? metrics.terrainSource : null,
          validationStatus: typeof metrics.validationStatus === 'string' ? metrics.validationStatus : null,
          operational: typeof metrics.operational === 'boolean' ? metrics.operational : null,
          artifactKind: typeof metrics.artifactKind === 'string'
            ? metrics.artifactKind
            : (typeof framesResponse.artifactKind === 'string' ? framesResponse.artifactKind : null),
          frameCount: typeof metrics.frameCount === 'number' ? metrics.frameCount : framesResponse.frames.length,
          provenance: metrics.provenance && typeof metrics.provenance === 'object'
            ? metrics.provenance as Record<string, unknown>
            : null,
        };
        return { eventId, forecast, extent, frames: framesResponse.frames, metadata };
      } catch (error) {
        lastError = error;
        if (attempt < attempts - 1) await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    throw lastError instanceof Error ? lastError : new Error('Solver artifacts unavailable');
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
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    if (!res.ok && res.status !== 202) {
      const text = await res.text();
      throw new Error(`Simulation failed (HTTP ${res.status}): ${text}`);
    }
    const payload = (await res.json()) as RunSimulationResponse & {
      simulation_id?: string;
      event_id?: string;
      job?: { eventId?: string; event_id?: string };
    };
    const simulationEventId = payload.eventId
      ?? payload.simulation?.eventId as string | undefined
      ?? payload.simulation_id
      ?? payload.event_id
      ?? payload.job?.eventId
      ?? payload.job?.event_id;
    return { ...payload, eventId: simulationEventId ?? null };
  }
}

export const apiClient = new ApiClient();
