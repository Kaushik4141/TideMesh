// GeoJSON water bodies, river channels, and hydrodynamic flow vectors for Mangaluru coastal plain

export interface WaterwayFeature {
  type: 'Feature';
  id: string;
  properties: {
    id: string;
    name: string;
    type: 'river' | 'estuary' | 'ocean' | 'channel' | 'flow_vector' | 'route_corridor';
    flowDirection?: 'seaward' | 'surge_inland' | 'bidirectional';
    depthM?: number;
    description: string;
    color?: string;
    casingColor?: string;
    glowColor?: string;
    widthPx?: number;
  };
  geometry: {
    type: 'Polygon' | 'LineString' | 'Point';
    coordinates: any;
  };
}

export interface WaterwaysCollection {
  type: 'FeatureCollection';
  features: WaterwayFeature[];
}

/**
 * Detailed, continuous winding paths tracing the actual river courses (Destination-route style)
 */
export const GURUPURA_WINDING_PATH: [number, number][] = [
  [74.858, 12.982], // Upstream headwaters Kavoor/Maravoor
  [74.852, 12.964], // Baikampady Industrial flank
  [74.846, 12.948], // Upper Kulur bend
  [74.838, 12.934], // Kulur meander
  [74.832, 12.924], // Kulur Bridge (NH-66 River Crossing)
  [74.826, 12.914], // Lower Kulur curve
  [74.821, 12.904], // Tannirbhavi ferry corridor
  [74.819, 12.894], // Tannirbhavi inner river reach
  [74.818, 12.884], // Boloor / Urwa riverside
  [74.820, 12.874], // Bokkapattna bend
  [74.822, 12.864], // Behind Bengre barrier spit
  [74.825, 12.854], // Bengre spit narrow reach
  [74.828, 12.847], // Confluence approach
  [74.832, 12.843], // Estuary confluence meeting point
];

export const NETRAVATI_WINDING_PATH: [number, number][] = [
  [74.898, 12.864], // Inland Netravati reach from Western Ghats
  [74.884, 12.861], // Arkula / Jeppinamogaru river basin
  [74.872, 12.858], // Netravati Railway / National Highway Bridge
  [74.860, 12.854], // Morgan's Gate / Jeppu flank
  [74.848, 12.850], // Bolar North Bank ferry point
  [74.838, 12.845], // Upper Estuary mouth
  [74.832, 12.843], // Confluence with Gurupura River
  [74.825, 12.841], // Estuary breach outlet
  [74.816, 12.840], // Outflow channel past Ullal breakwaters
  [74.802, 12.839], // Discharge plume into Arabian Sea
];

export const SURGE_PENETRATION_PATH: [number, number][] = [
  [74.804, 12.839], // Arabian Sea marine surge front
  [74.818, 12.841], // Breaching the estuary mouth
  [74.828, 12.845], // Flooding Old Port confluence basin
  [74.824, 12.872], // Backwater surge pushing up Gurupura channel
  [74.830, 12.918], // Surge swell reaching Kulur Bridge
];

/**
 * High-visibility route-style LineStrings for turn-by-turn navigation appearance
 */
export const WATERWAY_ROUTE_PATHS: WaterwaysCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'route-gurupura-core',
      properties: {
        id: 'route-gurupura-core',
        name: 'Gurupura (Phalguni) River Waterway',
        type: 'river',
        flowDirection: 'seaward',
        depthM: -2.8,
        description: 'Primary tidal river channel winding 8.5 km to the estuary confluence.',
        color: '#00F0FF', // Neon Electric Cyan (GPS route core)
        casingColor: '#0369A1',
        glowColor: '#38BDF8',
        widthPx: 8,
      },
      geometry: {
        type: 'LineString',
        coordinates: GURUPURA_WINDING_PATH,
      },
    },
    {
      type: 'Feature',
      id: 'route-netravati-core',
      properties: {
        id: 'route-netravati-core',
        name: 'Netravati River Estuary Waterway',
        type: 'estuary',
        flowDirection: 'seaward',
        depthM: -3.2,
        description: 'Major arterial flood channel discharging Western Ghats runoff into Arabian Sea.',
        color: '#06B6D4', // Vibrant Cyan Highway
        casingColor: '#1E3A8A',
        glowColor: '#0284C7',
        widthPx: 10,
      },
      geometry: {
        type: 'LineString',
        coordinates: NETRAVATI_WINDING_PATH,
      },
    },
    {
      type: 'Feature',
      id: 'route-surge-penetration',
      properties: {
        id: 'route-surge-penetration',
        name: 'Storm Surge Inflow & Backwater Vector',
        type: 'flow_vector',
        flowDirection: 'surge_inland',
        depthM: 1.85,
        description: 'Marine tidal surge forcing ocean water inward through the estuary mouth.',
        color: '#F43F5E', // Rose Alert Vector
        casingColor: '#881337',
        glowColor: '#FDA4AF',
        widthPx: 6,
      },
      geometry: {
        type: 'LineString',
        coordinates: SURGE_PENETRATION_PATH,
      },
    },
  ],
};

/**
 * Historical / calibrated SFINCS floodwave progression factors across 9 timesteps
 */
export const TIMESTEP_EXPANSION_FACTORS: Record<string, number> = {
  '14:00': 0.15, // Normal river within banks
  '14:15': 0.35, // Early tide rise
  '14:30': 0.65, // Inundation onset in Zone B & D
  '14:45': 0.85, // Widespread riverbank overtopping
  '15:00': 0.95, // Approaching peak backwater
  '15:10': 1.00, // Peak inundation (maximum patch width)
  '15:15': 0.98,
  '15:30': 0.75, // Recession starts
  '15:45': 0.50,
  '16:00': 0.30, // Drainage back into riverbeds
};

/**
 * Geometric buffer offset function creating closed polygon strips around a river centerline
 */
function bufferCenterline(
  centerline: [number, number][],
  halfWidthDeg: number
): [number, number][] {
  const left: [number, number][] = [];
  const right: [number, number][] = [];

  for (let i = 0; i < centerline.length; i++) {
    const p = centerline[i];
    let dx = 0;
    let dy = 0;

    if (i === 0) {
      dx = centerline[1][0] - centerline[0][0];
      dy = centerline[1][1] - centerline[0][1];
    } else if (i === centerline.length - 1) {
      dx = centerline[i][0] - centerline[i - 1][0];
      dy = centerline[i][1] - centerline[i - 1][1];
    } else {
      dx = centerline[i + 1][0] - centerline[i - 1][0];
      dy = centerline[i + 1][1] - centerline[i - 1][1];
    }

    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;

    left.push([
      Number((p[0] + nx * halfWidthDeg).toFixed(5)),
      Number((p[1] + ny * halfWidthDeg).toFixed(5)),
    ]);
    right.push([
      Number((p[0] - nx * halfWidthDeg).toFixed(5)),
      Number((p[1] - ny * halfWidthDeg).toFixed(5)),
    ]);
  }

  // Close polygon
  return [...left, ...right.reverse(), left[0]];
}

/**
 * Dynamically computes swelling river flood corridors as simulation progresses.
 * The patch width increases during flood onset/peak, showing river overtopping.
 */
export function getDynamicSwollenWaterways(factor: number): WaterwaysCollection {
  const clampedFactor = Math.max(0.1, Math.min(1.5, factor));

  // Dynamic half-width in degrees (~111km per deg lat, ~108km per deg lon)
  // Base riverbed width ~ 180m; at peak (factor 1.0) swells out by +520m overtopping the banks
  const gurupuraHalfWidth = 0.0018 + 0.0050 * clampedFactor;
  const netravatiHalfWidth = 0.0032 + 0.0068 * clampedFactor;
  const confluenceRadius = 0.0065 + 0.0085 * clampedFactor;

  const gurupuraPolygon = bufferCenterline(GURUPURA_WINDING_PATH, gurupuraHalfWidth);
  const netravatiPolygon = bufferCenterline(NETRAVATI_WINDING_PATH, netravatiHalfWidth);

  // Confluence basin expansion
  const centerConf = [74.828, 12.845];
  const confCoords: [number, number][] = [];
  const steps = 16;
  for (let s = 0; s <= steps; s++) {
    const angle = (s / steps) * Math.PI * 2;
    confCoords.push([
      Number((centerConf[0] + Math.cos(angle) * confluenceRadius * 1.25).toFixed(5)),
      Number((centerConf[1] + Math.sin(angle) * confluenceRadius).toFixed(5)),
    ]);
  }

  // Dynamic visual depth & swelling width
  const peakDepth = Number((0.45 + 2.55 * clampedFactor).toFixed(2));
  const swellMeters = Math.round(clampedFactor * 520);

  // Arabian Sea coastal polygon
  const oceanCoords = [
    [74.780, 13.025],
    [74.782, 12.805],
    [74.815, 12.805],
    [74.818, 12.840],
    [74.812, 12.880],
    [74.800, 12.928],
    [74.792, 12.965],
    [74.778, 13.025],
    [74.780, 13.025],
  ];

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: 'swollen-patch-gurupura',
        properties: {
          id: 'swollen-patch-gurupura',
          name: 'Gurupura River Inundation Corridor',
          type: 'route_corridor',
          depthM: peakDepth,
          description: `Active flood corridor · Width: +${swellMeters}m overtopping riverbanks · Water depth: ${peakDepth}m`,
          color: clampedFactor > 0.8 ? '#1D4ED8' : clampedFactor > 0.5 ? '#0284C7' : '#0EA5E9',
          glowColor: '#38BDF8',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [gurupuraPolygon],
        },
      },
      {
        type: 'Feature',
        id: 'swollen-patch-netravati',
        properties: {
          id: 'swollen-patch-netravati',
          name: 'Netravati Estuarine Flood Swath',
          type: 'route_corridor',
          depthM: peakDepth,
          description: `Discharging estuarine floodwave · Width: +${swellMeters}m expansion · Water depth: ${peakDepth}m`,
          color: clampedFactor > 0.8 ? '#1E40AF' : clampedFactor > 0.5 ? '#0369A1' : '#0284C7',
          glowColor: '#60A5FA',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [netravatiPolygon],
        },
      },
      {
        type: 'Feature',
        id: 'swollen-patch-confluence',
        properties: {
          id: 'swollen-patch-confluence',
          name: 'Old Port Estuary Confluence Basin',
          type: 'route_corridor',
          depthM: peakDepth + 0.45,
          description: `Tidal mixing backwater swell · Compound Surge: +${(0.85 * clampedFactor).toFixed(2)}m`,
          color: '#1E3A8A',
          glowColor: '#38BDF8',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [confCoords],
        },
      },
      {
        type: 'Feature',
        id: 'ocean-arabian-sea',
        properties: {
          id: 'ocean-arabian-sea',
          name: 'Arabian Sea Nearshore Coastal Waters',
          type: 'ocean',
          depthM: -6.0,
          description: 'Open ocean tidal forcing boundary generating storm surges and astronomical tides.',
          color: '#075985',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [oceanCoords],
        },
      },
    ],
  };
}

export const MANGALURU_WATERWAYS = getDynamicSwollenWaterways(0.65);
export const FLOW_DIRECTION_VECTORS = WATERWAY_ROUTE_PATHS;
