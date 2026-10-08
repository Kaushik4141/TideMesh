// Re-export centralized demo data to keep existing imports completely backward-compatible
export {
  DEMO_ZONES as MOCK_ZONES,
  DEMO_KPI_SUMMARY as INITIAL_KPI_SUMMARY,
  DEMO_FACILITIES as MOCK_FACILITIES,
  DEMO_EVENT,
  DEMO_REPLAY_STATES,
  DEMO_PRIORITIES,
  DEMO_ROADS,
  DEMO_ALERTS,
  DEMO_SCENARIO,
  DEMO_CITIZEN_ALERT,
} from '@/data/demoFloodEvent';

export type {
  DemoFloodEvent,
  ReplayState,
  PriorityItem,
  AffectedRoad,
  DemoAlert,
  DemoScenario,
  CitizenAlertPreview,
} from '@/data/demoFloodEvent';
