import type {
  SeverityLevel,
  FactorContribution,
  ResponderAction,
  CriticalFacility,
  ZoneData,
  KpiSummary,
} from '@/types/dashboard';

// --- DEMO EVENT DEFINITION ---
export interface DemoFloodEvent {
  id: string;
  name: string;
  location: string;
  region: string;
  scenario: string;
  demoDate: string;
  status: 'SIMULATION' | 'HISTORICAL REPLAY';
  currentDemoTime: string;
  model: string;
  baselineRainfall: string;
  scenarioRainfall: string;
}

export const DEMO_EVENT: DemoFloodEvent = {
  id: 'mangalore-coast-demo-01',
  name: 'Coastal Flood Event — Mangaluru Coast',
  location: 'Mangaluru Coast',
  region: 'Mangaluru North',
  scenario: 'Historical Flood Scenario',
  demoDate: '08 Oct 2026',
  status: 'SIMULATION',
  currentDemoTime: '14:26',
  model: 'Model v1.2',
  baselineRainfall: '85 mm / 3 hr',
  scenarioRainfall: '110 mm / 3 hr',
};

// --- TIMELINE / REPLAY STATES ---
export interface ReplayState {
  time: string;
  floodDepth: string; // e.g. "0.00 m"
  affectedBuildings: number;
  affectedRoads: number;
  exposedPopulation: number;
  criticalZones: number;
  highRiskZones: number;
  statusLabel?: string;
}

export const DEMO_REPLAY_STATES: ReplayState[] = [
  {
    time: '14:00',
    floodDepth: '0.00 m',
    affectedBuildings: 0,
    affectedRoads: 0,
    exposedPopulation: 0,
    criticalZones: 0,
    highRiskZones: 1,
    statusLabel: 'Baseline Tide',
  },
  {
    time: '14:20',
    floodDepth: '0.12 m',
    affectedBuildings: 18,
    affectedRoads: 1,
    exposedPopulation: 620,
    criticalZones: 0,
    highRiskZones: 2,
    statusLabel: 'Tidal Ingress',
  },
  {
    time: '14:26',
    floodDepth: '0.18 m',
    affectedBuildings: 32,
    affectedRoads: 2,
    exposedPopulation: 980,
    criticalZones: 1,
    highRiskZones: 3,
    statusLabel: 'Current Telemetry (NOW)',
  },
  {
    time: '14:30',
    floodDepth: '0.22 m',
    affectedBuildings: 42,
    affectedRoads: 2,
    exposedPopulation: 1240,
    criticalZones: 1,
    highRiskZones: 3,
    statusLabel: 'Zone B Onset',
  },
  {
    time: '14:40',
    floodDepth: '0.38 m',
    affectedBuildings: 74,
    affectedRoads: 3,
    exposedPopulation: 2400,
    criticalZones: 1,
    highRiskZones: 3,
    statusLabel: 'Hospital Spur Submerged',
  },
  {
    time: '15:00',
    floodDepth: '0.65 m',
    affectedBuildings: 124,
    affectedRoads: 4,
    exposedPopulation: 3240,
    criticalZones: 1,
    highRiskZones: 3,
    statusLabel: 'Peak Inflow',
  },
  {
    time: '15:10',
    floodDepth: '0.71 m',
    affectedBuildings: 124,
    affectedRoads: 4,
    exposedPopulation: 3240,
    criticalZones: 1,
    highRiskZones: 3,
    statusLabel: 'Astrological Peak (0.71 m)',
  },
  {
    time: '15:30',
    floodDepth: '0.58 m',
    affectedBuildings: 109,
    affectedRoads: 4,
    exposedPopulation: 3050,
    criticalZones: 1,
    highRiskZones: 2,
    statusLabel: 'Ebb Tide Beginning',
  },
  {
    time: '16:00',
    floodDepth: '0.31 m',
    affectedBuildings: 64,
    affectedRoads: 2,
    exposedPopulation: 1700,
    criticalZones: 0,
    highRiskZones: 1,
    statusLabel: 'Receding Flood Waters',
  },
];

// --- TOP KPI SUMMARY (Reference Event Spec) ---
export const DEMO_KPI_SUMMARY: KpiSummary = {
  highRiskZones: 3,
  criticalZones: 1,
  exposedPopulation: 12840,
  facilitiesAffected: 7,
  nextOnset: '14:30',
  nextOnsetZone: 'Zone B',
  nextOnsetTimeRemainingMin: 4,
};

// --- RESPONSE PRIORITIES ---
export interface PriorityItem {
  rank: number;
  zoneId: string;
  name: string;
  severity: SeverityLevel;
  reason: string;
}

export const DEMO_PRIORITIES: PriorityItem[] = [
  { rank: 1, zoneId: 'B', name: 'Zone B', severity: 'CRITICAL', reason: 'Hospital access threatened' },
  { rank: 2, zoneId: 'F', name: 'Zone F', severity: 'HIGH', reason: '2,800 residents exposed' },
  { rank: 3, zoneId: 'C', name: 'Zone C', severity: 'HIGH', reason: '4 roads affected' },
  { rank: 4, zoneId: 'A', name: 'Zone A', severity: 'ELEVATED', reason: 'Rapidly increasing flood extent' },
  { rank: 5, zoneId: 'H', name: 'Zone H', severity: 'ELEVATED', reason: 'Critical facility exposure' },
];

// --- CRITICAL FACILITIES ---
export const DEMO_FACILITIES: CriticalFacility[] = [
  {
    id: 'district-hospital-h1',
    name: 'District Hospital H1',
    category: 'hospital',
    zoneId: 'B',
    severity: 'CRITICAL',
    depth: '0.31–0.71 m',
    onset: '14:30',
    routeStatus: 'Submerged',
    warningNote: 'Hospital access threatened · Road R12 water egress',
    capacity: '420 Beds · ICU Active',
    x: 340,
    y: 110,
  },
  {
    id: 'panambur-fire',
    name: 'Panambur Fire Station',
    category: 'fire',
    zoneId: 'B',
    severity: 'HIGH',
    depth: '0.20–0.50 m',
    onset: '14:55',
    routeStatus: 'Primary Arterial Clear',
    x: 290,
    y: 130,
  },
  {
    id: 'govt-school-shelter',
    name: 'Govt. Higher Primary School',
    category: 'shelter',
    zoneId: 'B',
    severity: 'HIGH',
    depth: '0.15–0.40 m',
    onset: '15:00',
    routeStatus: 'Route Clear',
    warningNote: 'Designated Evacuation Shelter #4 · Ground floor risk',
    capacity: '600 PAX',
    x: 385,
    y: 155,
  },
  {
    id: 'tannirbhavi-marine',
    name: 'Tannirbhavi Coast Guard Station',
    category: 'security',
    zoneId: 'F',
    severity: 'HIGH',
    depth: '0.22–0.51 m',
    onset: '14:45',
    routeStatus: 'At Risk',
    warningNote: 'Wave overtopping along Bengre peninsula roadway',
    x: 350,
    y: 215,
  },
  {
    id: 'substation-f',
    name: 'MESCOM Primary Substation 11kV',
    category: 'utility',
    zoneId: 'F',
    severity: 'HIGH',
    depth: '0.20–0.40 m',
    onset: '15:15',
    routeStatus: 'Route Clear',
    x: 410,
    y: 225,
  },
  {
    id: 'surathkal-health',
    name: 'Surathkal Community Health Centre',
    category: 'hospital',
    zoneId: 'C',
    severity: 'HIGH',
    depth: '0.18–0.46 m',
    onset: '14:55',
    routeStatus: 'Route Clear',
    x: 295,
    y: 350,
  },
  {
    id: 'bengre-spit-shelter',
    name: 'Bengre Fishermen Community Shelter',
    category: 'shelter',
    zoneId: 'H',
    severity: 'ELEVATED',
    depth: '0.08–0.24 m',
    onset: '15:30',
    routeStatus: 'Route Clear',
    x: 420,
    y: 295,
  },
];

// --- ALL DEMO ZONES (Fully matching prompt specification) ---
export const DEMO_ZONES: ZoneData[] = [
  // 1. PRIMARY DEMO ZONE: ZONE B
  {
    id: 'B',
    name: 'Zone B',
    locality: 'Panambur Coast',
    ward: 'Coastal Ward 14 · Mangaluru North',
    rank: 1,
    severity: 'CRITICAL',
    probability: 84.7,
    depth: '0.31–0.71 m',
    onset: '14:30',
    peak: '15:10',
    peakDepth: '0.71 m',
    population: 3240,
    facilitiesCount: 1,
    buildingsExposed: 124,
    roadsAffectedKm: 4, // 4 Affected Roads (R12, R18, R21, R24)
    summaryExplanation:
      'Heavy localized precipitation coinciding with high spring tide over low-lying coastal terrain increases the likelihood of rapid inundation in Zone B.',
    factors: [
      { name: 'Heavy Rainfall', detail: '41 mm / 3 hr', percentage: 41 },
      { name: 'Spring Tide', detail: '2.8 m + surge', percentage: 29 },
      { name: 'Topography', detail: 'Avg 2.1 m low coast', percentage: 19 },
      { name: 'Drainage', detail: 'Restricted culvert outfall', percentage: 11 },
    ],
    facilities: DEMO_FACILITIES.filter((f) => f.zoneId === 'B'),
    actions: [
      {
        id: 'act-b1',
        title: 'Monitor Hospital H1 access',
        status: 'unassigned',
        priority: 'Urgent',
      },
      {
        id: 'act-b2',
        title: 'Deploy response team to Zone B',
        status: 'unassigned',
        priority: 'Urgent',
      },
      {
        id: 'act-b3',
        title: 'Secure Road R12',
        status: 'unassigned',
        priority: 'High',
      },
      {
        id: 'act-b4',
        title: 'Issue localized warning',
        status: 'unassigned',
        priority: 'High',
      },
    ],
    svgPoints: '255,30 420,35 435,175 270,170',
  },

  // 2. ZONE F
  {
    id: 'F',
    name: 'Zone F',
    locality: 'Tannirbhavi',
    ward: 'Ward 11 · Gurupura Estuary',
    rank: 2,
    severity: 'HIGH',
    probability: 72.4,
    depth: '0.22–0.51 m',
    onset: '14:45',
    peak: '15:20',
    peakDepth: '0.51 m',
    population: 2800,
    facilitiesCount: 2,
    buildingsExposed: 96,
    roadsAffectedKm: 3,
    summaryExplanation:
      'Estuarine backwater swell combined with wave run-up along sandy beach barrier spit threatening 2,800 residents.',
    factors: [
      { name: 'Estuary Surge', detail: 'Tidal Backflow', percentage: 45 },
      { name: 'Wave Runup', detail: '1.4 m Swell', percentage: 32 },
      { name: 'Rainfall Runoff', detail: '28 mm / 3 hr', percentage: 23 },
    ],
    facilities: DEMO_FACILITIES.filter((f) => f.zoneId === 'F'),
    actions: [
      {
        id: 'act-f1',
        title: 'Verify sandbar breach barrier status',
        status: 'unassigned',
        priority: 'High',
      },
      {
        id: 'act-f2',
        title: 'Alert Coast Guard coastal detachment',
        status: 'unassigned',
        priority: 'High',
      },
    ],
    svgPoints: '280,185 450,195 440,245 285,240',
  },

  // 3. ZONE C
  {
    id: 'C',
    name: 'Zone C',
    locality: 'Surathkal Coastal',
    ward: 'Ward 8 · NITK Beach Corridor',
    rank: 3,
    severity: 'HIGH',
    probability: 67.8,
    depth: '0.18–0.46 m',
    onset: '14:55',
    peak: '15:30',
    peakDepth: '0.46 m',
    population: 2100,
    facilitiesCount: 1,
    buildingsExposed: 73,
    roadsAffectedKm: 4,
    summaryExplanation:
      'Moderate beach berm overtopping threatening low-lying fishing hamlet settlements and 4 key connector roads.',
    factors: [
      { name: 'Coastal Surge', detail: 'Tidal Crest', percentage: 42 },
      { name: 'Localized Inundation', detail: 'Surface Runoff', percentage: 36 },
      { name: 'Culvert Obstruction', detail: 'Stormwater Silt', percentage: 22 },
    ],
    facilities: DEMO_FACILITIES.filter((f) => f.zoneId === 'C'),
    actions: [
      {
        id: 'act-c1',
        title: 'Deploy portable dewatering pump to culvert 3',
        status: 'unassigned',
        priority: 'Normal',
      },
      {
        id: 'act-c2',
        title: 'Cordon low-elevation highway slipway',
        status: 'unassigned',
        priority: 'Normal',
      },
    ],
    svgPoints: '230,270 355,270 360,420 220,425',
  },

  // 4. ZONE A
  {
    id: 'A',
    name: 'Zone A',
    locality: 'Ullal Estuary',
    ward: 'Ward 4 · Netravati Estuary',
    rank: 4,
    severity: 'ELEVATED',
    probability: 48.2,
    depth: '0.10–0.28 m',
    onset: '15:20',
    peak: '16:00',
    peakDepth: '0.28 m',
    population: 1850,
    facilitiesCount: 0,
    buildingsExposed: 42,
    roadsAffectedKm: 2,
    summaryExplanation:
      'Marginal estuarine rise buffering against seawall revetment with rapidly increasing flood extent along shoreline.',
    factors: [
      { name: 'River Inflow', detail: 'Netravati Discharge', percentage: 58 },
      { name: 'Tide Crest', detail: 'Spring High', percentage: 42 },
    ],
    facilities: [],
    actions: [
      {
        id: 'act-a1',
        title: 'Confirm telemetry gauge A-04 reading',
        status: 'unassigned',
        priority: 'Normal',
      },
    ],
    svgPoints: '200,470 370,460 380,570 190,570',
  },

  // 5. ZONE H
  {
    id: 'H',
    name: 'Zone H',
    locality: 'Bengre Spit',
    ward: 'Ward 16 · Old Port Spit',
    rank: 5,
    severity: 'ELEVATED',
    probability: 44.8,
    depth: '0.08–0.24 m',
    onset: '15:30',
    peak: '16:15',
    peakDepth: '0.24 m',
    population: 980,
    facilitiesCount: 1,
    buildingsExposed: 31,
    roadsAffectedKm: 1,
    summaryExplanation:
      'Shallow tidal ponding along fishing jetty approaches and critical community shelter approach during peak astronomical tide.',
    factors: [
      { name: 'Tidal Backflow', detail: 'Port Channel', percentage: 55 },
      { name: 'Rainfall', detail: '18 mm / 3 hr', percentage: 45 },
    ],
    facilities: DEMO_FACILITIES.filter((f) => f.zoneId === 'H'),
    actions: [
      {
        id: 'act-h1',
        title: 'Monitor ferry crossing point for high water level',
        status: 'unassigned',
        priority: 'Normal',
      },
    ],
    svgPoints: '370,250 480,230 480,350 365,360',
  },

  // 6. ZONE D
  {
    id: 'D',
    name: 'Zone D',
    locality: 'Kulur Bridge Sector',
    ward: 'Ward 6',
    rank: 6,
    severity: 'LOW',
    probability: 21.3,
    depth: '0.03–0.12 m',
    onset: '16:00',
    peak: '16:40',
    peakDepth: '0.12 m',
    population: 850,
    facilitiesCount: 0,
    buildingsExposed: 12,
    roadsAffectedKm: 1,
    summaryExplanation:
      'Inundation below critical threshold; nominal highway transit maintained across bridge piers.',
    factors: [{ name: 'River Channel', detail: 'Normal Flow', percentage: 100 }],
    facilities: [],
    actions: [],
    svgPoints: '460,50 630,40 650,135 480,150',
  },

  // 7. ZONE E
  {
    id: 'E',
    name: 'Zone E',
    locality: 'Baikampady Industrial',
    ward: 'Ward 9',
    rank: 7,
    severity: 'LOW',
    probability: 18.5,
    depth: '0.02–0.10 m',
    onset: '16:10',
    peak: '16:50',
    peakDepth: '0.10 m',
    population: 620,
    facilitiesCount: 0,
    buildingsExposed: 9,
    roadsAffectedKm: 1,
    summaryExplanation: 'Industrial buffer drains functioning with no water ingress.',
    factors: [{ name: 'Drainage', detail: 'Clear Channels', percentage: 100 }],
    facilities: [],
    actions: [],
    svgPoints: '640,40 820,30 840,140 660,135',
  },

  // 8. ZONE G
  {
    id: 'G',
    name: 'Zone G',
    locality: 'Kodialbail Urban',
    ward: 'Ward 22',
    rank: 8,
    severity: 'LOW',
    probability: 15.7,
    depth: '0.02–0.08 m',
    onset: '16:20',
    peak: '17:00',
    peakDepth: '0.08 m',
    population: 410,
    facilitiesCount: 0,
    buildingsExposed: 6,
    roadsAffectedKm: 0,
    summaryExplanation: 'Urban core storm sewers maintaining positive discharge head.',
    factors: [{ name: 'Stormwater', detail: 'Gravity Outfall', percentage: 100 }],
    facilities: [],
    actions: [],
    svgPoints: '490,225 650,215 670,330 495,310',
  },

  // 9. ZONE I
  {
    id: 'I',
    name: 'Zone I',
    locality: 'Bolar Ferry Point',
    ward: 'Ward 25',
    rank: 9,
    severity: 'LOW',
    probability: 12.2,
    depth: '0.01–0.06 m',
    onset: '16:30',
    peak: '17:10',
    peakDepth: '0.06 m',
    population: 280,
    facilitiesCount: 0,
    buildingsExposed: 4,
    roadsAffectedKm: 0,
    summaryExplanation: 'Slipway and ferry ramp normal; no risk to navigation or passengers.',
    factors: [{ name: 'Tide', detail: 'Within Freeboard', percentage: 100 }],
    facilities: [],
    actions: [],
    svgPoints: '680,210 880,220 890,340 680,330',
  },

  // 10. ZONE J
  {
    id: 'J',
    name: 'Zone J',
    locality: 'Kadri Hills Escarpment',
    ward: 'Ward 29',
    rank: 10,
    severity: 'LOW',
    probability: 10.4,
    depth: '0.01–0.05 m',
    onset: '16:40',
    peak: '17:20',
    peakDepth: '0.05 m',
    population: 190,
    facilitiesCount: 0,
    buildingsExposed: 3,
    roadsAffectedKm: 0,
    summaryExplanation: 'Elevated topography well above coastal flood inundation envelope.',
    factors: [{ name: 'Elevation', detail: '+14 m MSL', percentage: 100 }],
    facilities: [],
    actions: [],
    svgPoints: '500,340 700,335 690,450 490,440',
  },

  // 11. ZONE K
  {
    id: 'K',
    name: 'Zone K',
    locality: 'Kankanady Sector',
    ward: 'Ward 31',
    rank: 11,
    severity: 'LOW',
    probability: 8.7,
    depth: '0.00–0.04 m',
    onset: '17:00',
    peak: '17:40',
    peakDepth: '0.04 m',
    population: 120,
    facilitiesCount: 0,
    buildingsExposed: 2,
    roadsAffectedKm: 0,
    summaryExplanation: 'Inland terrain unaffected by coastal surge.',
    factors: [{ name: 'Inland', detail: 'Dry Sector', percentage: 100 }],
    facilities: [],
    actions: [],
    svgPoints: '710,345 890,350 880,480 700,460',
  },
];

// --- ROAD IMPACT DETAILS FOR ZONE B & OTHERS ---
export interface AffectedRoad {
  id: string;
  name: string;
  impactLevel: 'HIGH IMPACT' | 'MODERATE IMPACT' | 'LOW IMPACT';
  expectedDepth: string;
  zoneId: string;
}

export const DEMO_ROADS: AffectedRoad[] = [
  { id: 'r12', name: 'Road R12', impactLevel: 'HIGH IMPACT', expectedDepth: '0.62 m', zoneId: 'B' },
  { id: 'r18', name: 'Road R18', impactLevel: 'MODERATE IMPACT', expectedDepth: '0.35 m', zoneId: 'B' },
  { id: 'r21', name: 'Road R21', impactLevel: 'MODERATE IMPACT', expectedDepth: '0.28 m', zoneId: 'B' },
  { id: 'r24', name: 'Road R24', impactLevel: 'LOW IMPACT', expectedDepth: '0.14 m', zoneId: 'B' },
];

// --- ALERTS MOCK ---
export interface DemoAlert {
  id: string;
  title: string;
  message: string;
  action: string;
  severity: SeverityLevel;
  status: 'Pending acknowledgement' | 'Acknowledged';
  timestamp: string;
  zoneId: string;
}

export const DEMO_ALERTS: DemoAlert[] = [
  {
    id: 'alert-1',
    title: 'Zone B flood onset approaching',
    message: 'Localized flooding may begin around 14:30. Expected depth 0.31–0.71 m.',
    action: 'Avoid Road R12',
    severity: 'CRITICAL',
    status: 'Pending acknowledgement',
    timestamp: '14:26',
    zoneId: 'B',
  },
  {
    id: 'alert-2',
    title: 'Zone F wave runup warning',
    message: 'Estuarine swell peak expected at 15:20. Low-lying spits vulnerable.',
    action: 'Alert Coast Guard detachment',
    severity: 'HIGH',
    status: 'Pending acknowledgement',
    timestamp: '14:20',
    zoneId: 'F',
  },
  {
    id: 'alert-3',
    title: 'Zone C culvert water ponding',
    message: 'Drainage culvert silt accumulation slowing gravity outfall.',
    action: 'Deploy portable dewatering pump',
    severity: 'HIGH',
    status: 'Acknowledged',
    timestamp: '14:15',
    zoneId: 'C',
  },
];

// --- SCENARIO / WHAT-IF DATA ---
export interface DemoScenario {
  name: string;
  description: string;
  baselineRainfall: string;
  scenarioRainfall: string;
  baseline: {
    buildings: number;
    roads: number;
    population: number;
    facilities: number;
  };
  scenario: {
    buildings: number;
    roads: number;
    population: number;
    facilities: number;
  };
  result: string;
}

export const DEMO_SCENARIO: DemoScenario = {
  name: 'Heavier Rainfall',
  description: 'Simulated 30% surge in localized thunderstorm convective cell precipitation',
  baselineRainfall: '85 mm / 3 hr',
  scenarioRainfall: '110 mm / 3 hr',
  baseline: {
    buildings: 73,
    roads: 2,
    population: 1820,
    facilities: 0,
  },
  scenario: {
    buildings: 121,
    roads: 5,
    population: 3240,
    facilities: 1,
  },
  result: 'Zone B becomes the highest-priority response zone with critical hospital access threatened.',
};

// --- CITIZEN ALERT PREVIEW ---
export interface CitizenAlertPreview {
  headline: string;
  message: string;
  expectedDepth: string;
  instruction: string;
  ctaText: string;
}

export const DEMO_CITIZEN_ALERT: CitizenAlertPreview = {
  headline: 'Flood warning for your area',
  message: 'Your area may experience flooding within ~30 minutes.',
  expectedDepth: '0.4–0.7 m',
  instruction: 'Avoid Road R12.',
  ctaText: 'View safe route',
};
