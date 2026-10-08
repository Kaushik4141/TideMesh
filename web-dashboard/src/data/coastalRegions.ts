export interface CoastalRegion {
  id: string;
  name: string;
  state: string;
  center: [number, number]; // [lng, lat]
  zoom: number;
  status: 'active_simulation' | 'telemetry_connected' | 'onboarding';
  statusLabel: string;
  primaryRivers: string[];
  coastalRiskType: string;
  description: string;
}

export const INDIA_COASTAL_REGIONS: CoastalRegion[] = [
  {
    id: 'mangaluru',
    name: 'Mangaluru Coastal Plain',
    state: 'Karnataka',
    center: [74.825, 12.895],
    zoom: 12.2,
    status: 'active_simulation',
    statusLabel: 'Active SFINCS 2D Solver & Replay',
    primaryRivers: ['Netravati River', 'Gurupura (Phalguni) River'],
    coastalRiskType: 'Estuarine Tidal Backwater & Monsoon Flash Flooding',
    description: 'High-resolution 50m hydrodynamic model domain with calibrated 2018 Cyclone Mekunu replay sequence.',
  },
  {
    id: 'mumbai',
    name: 'Mumbai Island & Creek Basin',
    state: 'Maharashtra',
    center: [72.855, 19.065],
    zoom: 11.8,
    status: 'telemetry_connected',
    statusLabel: 'Live Weather Telemetry Active',
    primaryRivers: ['Mithi River', 'Mahim Creek', 'Thane Creek'],
    coastalRiskType: 'Urban Tidal Surcharge & Extreme Sea Setup',
    description: 'Vulnerable low-lying estuarine corridor (Bandra-Kurla Complex, Dharavi, Mahim) prone to extreme monsoon high tides.',
  },
  {
    id: 'chennai',
    name: 'Chennai Coastal Basin',
    state: 'Tamil Nadu',
    center: [80.245, 13.010],
    zoom: 11.8,
    status: 'telemetry_connected',
    statusLabel: 'Live Weather Telemetry Active',
    primaryRivers: ['Adyar River', 'Cooum River', 'Buckingham Canal'],
    coastalRiskType: 'Bay of Bengal Cyclonic Storm Surge & River Outflow Congestion',
    description: 'Low-gradient coastal plain with barrier bar sedimentation impeding river discharge during North-East Monsoon cyclones.',
  },
  {
    id: 'kochi',
    name: 'Kochi Backwaters (Vembanad)',
    state: 'Kerala',
    center: [76.265, 9.975],
    zoom: 11.6,
    status: 'telemetry_connected',
    statusLabel: 'Live Weather Telemetry Active',
    primaryRivers: ['Periyar River', 'Muvattupuzha River', 'Vembanad Estuary'],
    coastalRiskType: 'Estuarine Lake Surge & Barrier Island Breaches',
    description: 'Tidal backwater network interconnected through Vembanad Lake and Kochi Harbour inlet.',
  },
  {
    id: 'kolkata',
    name: 'Kolkata & Hooghly Delta',
    state: 'West Bengal',
    center: [88.340, 22.520],
    zoom: 11.4,
    status: 'onboarding',
    statusLabel: 'Regional DEM Calibration',
    primaryRivers: ['Hooghly River (Ganga Delta)', 'Rupnarayan River'],
    coastalRiskType: 'Tidal Bore Amplification & Super-Cyclone Storm Surge',
    description: 'Tidally dominated mega-delta vulnerable to Bay of Bengal cyclonic surges funneled upstream through the Hooghly.',
  },
];
