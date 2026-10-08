export type SeverityLevel = 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';

export interface FactorContribution {
  name: string;
  detail: string;
  percentage: number;
}

export interface ResponderAction {
  id: string;
  title: string;
  status: 'unassigned' | 'acknowledged' | 'dispatched' | 'done';
  priority?: 'Urgent' | 'High' | 'Normal';
  team?: string;
  assignee?: string;
  timestamp?: string;
}

export interface CriticalFacility {
  id: string;
  name: string;
  category: 'hospital' | 'fire' | 'shelter' | 'security' | 'utility' | 'power' | 'police';
  zoneId: string;
  severity: SeverityLevel;
  depth: string;
  onset: string;
  routeStatus: 'Route Clear' | 'Primary Arterial Clear' | 'At Risk' | 'Submerged';
  warningNote?: string;
  capacity?: string;
  x: number;
  y: number;
}

export interface ZoneData {
  id: string;
  name: string;
  locality: string;
  ward: string;
  rank: number;
  severity: SeverityLevel;
  probability: number; // e.g. 84.7
  depth: string; // e.g. "0.31–0.71 m"
  onset: string; // e.g. "14:30"
  peak: string; // e.g. "15:10"
  peakDepth: string; // e.g. "0.71 m"
  population: number; // e.g. 4820
  facilitiesCount: number;
  buildingsExposed: number;
  roadsAffectedKm: number;
  summaryExplanation: string;
  factors: FactorContribution[];
  facilities: CriticalFacility[];
  actions: ResponderAction[];
  svgPoints: string;
}

export interface KpiSummary {
  highRiskZones: number;
  criticalZones: number;
  exposedPopulation: number;
  facilitiesAffected: number;
  nextOnset: string;
  nextOnsetZone: string;
  nextOnsetTimeRemainingMin: number;
}
