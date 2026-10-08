// GeoJSON water bodies, river channels, and hydrodynamic flow vectors for Mangaluru coastal plain

export interface WaterwayFeature {
  type: 'Feature';
  id: string;
  properties: {
    id: string;
    name: string;
    type: 'river' | 'estuary' | 'ocean' | 'channel' | 'flow_vector';
    flowDirection?: 'seaward' | 'surge_inland' | 'bidirectional';
    depthM?: number;
    description: string;
    color?: string;
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
 * High-accuracy river channel polygons and estuarine water bodies for Mangaluru
 */
export const MANGALURU_WATERWAYS: WaterwaysCollection = {
  type: 'FeatureCollection',
  features: [
    // 1. Gurupura (Phalguni) River Channel Polygon
    {
      type: 'Feature',
      id: 'river-gurupura',
      properties: {
        id: 'river-gurupura',
        name: 'Gurupura (Phalguni) River',
        type: 'river',
        depthM: -2.8,
        description: 'Tidal river flowing south behind Tannirbhavi and Bengre sandspits to confluence.',
        color: '#0284C7',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [74.848, 12.965],
            [74.842, 12.945],
            [74.832, 12.924], // Kulur Bridge
            [74.821, 12.905], // Tannirbhavi ferry corridor
            [74.818, 12.885],
            [74.822, 12.865], // Behind Bengre
            [74.828, 12.848], // Confluence approach
            [74.834, 12.845],
            [74.830, 12.862],
            [74.825, 12.885],
            [74.828, 12.908],
            [74.838, 12.926],
            [74.848, 12.948],
            [74.854, 12.965],
            [74.848, 12.965],
          ],
        ],
      },
    },

    // 2. Netravati River Estuary Channel Polygon
    {
      type: 'Feature',
      id: 'river-netravati',
      properties: {
        id: 'river-netravati',
        name: 'Netravati River Estuary',
        type: 'estuary',
        depthM: -3.2,
        description: 'Major perennial river discharging Western Ghats runoff into Arabian Sea.',
        color: '#0369A1',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [74.888, 12.865],
            [74.872, 12.860],
            [74.858, 12.856], // Bolar North Bank
            [74.845, 12.852],
            [74.835, 12.846], // Estuary mouth
            [74.828, 12.842],
            [74.832, 12.836], // Ullal South Bank
            [74.842, 12.838],
            [74.855, 12.842],
            [74.870, 12.848],
            [74.888, 12.852],
            [74.888, 12.865],
          ],
        ],
      },
    },

    // 3. Mangaluru Estuary Confluence & Old Port Basin
    {
      type: 'Feature',
      id: 'waterway-confluence',
      properties: {
        id: 'waterway-confluence',
        name: 'Netravati–Gurupura Confluence (Old Port Basin)',
        type: 'channel',
        depthM: -4.5,
        description: 'Deep tidal mixing confluence where both rivers meet before breaching into the sea.',
        color: '#0284C7',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [74.826, 12.855],
            [74.835, 12.852],
            [74.836, 12.842],
            [74.828, 12.838],
            [74.818, 12.840], // Outflow mouth
            [74.816, 12.846],
            [74.822, 12.852],
            [74.826, 12.855],
          ],
        ],
      },
    },

    // 4. Arabian Sea Nearshore Coastal Waterway
    {
      type: 'Feature',
      id: 'ocean-arabian-sea',
      properties: {
        id: 'ocean-arabian-sea',
        name: 'Arabian Sea (Nearshore Marine Boundary)',
        type: 'ocean',
        depthM: -6.0,
        description: 'Open ocean tidal forcing boundary generating storm surges and astronomical tides.',
        color: '#075985',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [74.780, 13.025],
            [74.782, 12.805],
            [74.815, 12.805],
            [74.818, 12.840],
            [74.812, 12.880], // Tannirbhavi Coast
            [74.800, 12.928],
            [74.792, 12.965],
            [74.778, 13.025],
            [74.780, 13.025],
          ],
        ],
      },
    },
  ],
};

/**
 * Hydrodynamic flow direction paths (downstream discharge & surge backwater vectors)
 */
export const FLOW_DIRECTION_VECTORS: WaterwaysCollection = {
  type: 'FeatureCollection',
  features: [
    // Gurupura downstream discharge line
    {
      type: 'Feature',
      id: 'flow-gurupura-downstream',
      properties: {
        id: 'flow-gurupura-downstream',
        name: 'Gurupura Downstream Flow',
        type: 'flow_vector',
        flowDirection: 'seaward',
        description: 'Gravitational river flow south toward the estuary confluence.',
        color: '#38BDF8',
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [74.850, 12.960],
          [74.840, 12.935],
          [74.834, 12.924], // Kulur
          [74.824, 12.900],
          [74.821, 12.875],
          [74.828, 12.850],
          [74.822, 12.842], // Estuary mouth
        ],
      },
    },

    // Netravati downstream discharge line
    {
      type: 'Feature',
      id: 'flow-netravati-downstream',
      properties: {
        id: 'flow-netravati-downstream',
        name: 'Netravati Seaward Discharge',
        type: 'flow_vector',
        flowDirection: 'seaward',
        description: 'Main runoff stream discharging west toward the Arabian Sea.',
        color: '#38BDF8',
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [74.885, 12.858],
          [74.870, 12.855],
          [74.855, 12.850],
          [74.842, 12.846],
          [74.830, 12.842],
          [74.820, 12.841],
        ],
      },
    },

    // Tidal surge inland penetration vector (backwater effect)
    {
      type: 'Feature',
      id: 'flow-surge-backwater',
      properties: {
        id: 'flow-surge-backwater',
        name: 'Marine Surge Inflow / Backwater Swell',
        type: 'flow_vector',
        flowDirection: 'surge_inland',
        description: 'High tide surge pushing marine waters inward through the rivermouth.',
        color: '#F43F5E',
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [74.815, 12.841],
          [74.825, 12.844],
          [74.830, 12.855],
          [74.828, 12.880], // Swelling up Gurupura channel
          [74.832, 12.915], // Threatening Kulur Bridge
        ],
      },
    },
  ],
};

/**
 * Key hydrological points and monitoring landmarks along the river channels
 */
export const RIVER_LANDMARKS = [
  {
    id: 'lm-gurupura-upper',
    name: 'Gurupura River Channel',
    subtitle: 'Bed Level: -2.8m MSL · Flow: Seaward',
    position: [74.836, 12.932] as [number, number],
    type: 'river',
  },
  {
    id: 'lm-kulur-bridge',
    name: 'Kulur River Bridge (NH-66)',
    subtitle: 'Clearance: +3.8m · Inundation Risk Sector',
    position: [74.834, 12.924] as [number, number],
    type: 'bridge',
  },
  {
    id: 'lm-netravati-estuary',
    name: 'Netravati River Estuary',
    subtitle: 'Width: 1.2km · Western Ghats Discharge',
    position: [74.862, 12.852] as [number, number],
    type: 'river',
  },
  {
    id: 'lm-confluence-mouth',
    name: 'Estuary Confluence & Harbour Mouth',
    subtitle: 'Compound Tidal Surge Mixing Zone',
    position: [74.824, 12.843] as [number, number],
    type: 'estuary',
  },
];

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

const GURUPURA_CENTERLINE: [number, number][] = [
  [74.848, 12.965],
  [74.842, 12.945],
  [74.832, 12.924], // Kulur Bridge
  [74.821, 12.905], // Tannirbhavi
  [74.818, 12.885],
  [74.822, 12.865], // Bengre spit
  [74.828, 12.848],
  [74.834, 12.845], // Confluence
];

const NETRAVATI_CENTERLINE: [number, number][] = [
  [74.888, 12.860],
  [74.872, 12.856],
  [74.858, 12.852], // Bolar
  [74.845, 12.848],
  [74.835, 12.844], // Confluence approach
  [74.828, 12.842],
  [74.818, 12.841], // Outflow
];

/**
 * Dynamically computes swelling river polygons as simulation progresses.
 * The patch width increases during flood onset/peak, showing river overtopping.
 */
export function getDynamicSwollenWaterways(factor: number): WaterwaysCollection {
  const clampedFactor = Math.max(0.1, Math.min(1.5, factor));

  // Dynamic half-width in degrees (~111km per deg lat, ~108km per deg lon)
  // Base width ~ 180m, max expansion at factor 1.0 reaches +450m on each bank
  const gurupuraHalfWidth = 0.0016 + 0.0042 * clampedFactor;
  const netravatiHalfWidth = 0.0028 + 0.0055 * clampedFactor;
  const confluenceRadius = 0.006 + 0.007 * clampedFactor;

  const gurupuraPolygon = bufferCenterline(GURUPURA_CENTERLINE, gurupuraHalfWidth);
  const netravatiPolygon = bufferCenterline(NETRAVATI_CENTERLINE, netravatiHalfWidth);

  // Confluence basin expansion
  const centerConf = [74.828, 12.846];
  const confCoords: [number, number][] = [];
  const steps = 14;
  for (let s = 0; s <= steps; s++) {
    const angle = (s / steps) * Math.PI * 2;
    confCoords.push([
      Number((centerConf[0] + Math.cos(angle) * confluenceRadius * 1.2).toFixed(5)),
      Number((centerConf[1] + Math.sin(angle) * confluenceRadius).toFixed(5)),
    ]);
  }

  // Dynamic visual depth & swelling width
  const peakDepth = Number((0.45 + 2.55 * clampedFactor).toFixed(2));
  const swellMeters = Math.round(clampedFactor * 480);

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: 'river-gurupura',
        properties: {
          id: 'river-gurupura',
          name: 'Gurupura (Phalguni) River Channel',
          type: 'river',
          depthM: peakDepth,
          description: `Swollen river corridor · Width: +${swellMeters}m bank overtopping · Water level: ${peakDepth}m`,
          color: clampedFactor > 0.8 ? '#1D4ED8' : clampedFactor > 0.5 ? '#0284C7' : '#0EA5E9',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [gurupuraPolygon],
        },
      },
      {
        type: 'Feature',
        id: 'river-netravati',
        properties: {
          id: 'river-netravati',
          name: 'Netravati River Estuary',
          type: 'estuary',
          depthM: peakDepth,
          description: `Discharging estuarine floodwave · Width: +${swellMeters}m expansion · Water level: ${peakDepth}m`,
          color: clampedFactor > 0.8 ? '#1E40AF' : clampedFactor > 0.5 ? '#0369A1' : '#0284C7',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [netravatiPolygon],
        },
      },
      {
        type: 'Feature',
        id: 'waterway-confluence',
        properties: {
          id: 'waterway-confluence',
          name: 'Estuary Confluence & Harbour Swell',
          type: 'channel',
          depthM: peakDepth + 0.5,
          description: `Tidal mixing backwater swell · Compound Surge: +${(0.85 * clampedFactor).toFixed(2)}m`,
          color: '#1D4ED8',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [confCoords],
        },
      },
      // Arabian Sea baseline
      MANGALURU_WATERWAYS.features[3],
    ],
  };
}
