"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Waves,
  Building2,
  Hospital,
  Flame,
  ArrowUp,
  Home,
  ShieldCheck,
  Zap,
  Stethoscope,
  Search,
  ArrowUpDown,
  RefreshCw,
  Plus,
  Minus,
  Maximize,
  RadioTower,
  Route,
  AlertTriangle,
  CheckCircle2,
  Radio,
  ExternalLink,
  ChevronRight,
  Info,
} from "lucide-react";
import { TopHeader } from "@/components/dashboard/TopHeader";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { ShortcutsModal } from "@/components/dashboard/ShortcutsModal";
import { ScenarioModal } from "@/components/dashboard/ScenarioModal";
import { apiClient } from "@/lib/api/client";
import Link from "next/link";

interface FacilityItem {
  id: string;
  name: string;
  category: "medical" | "fire" | "shelter" | "security" | "utilities";
  zoneId: string;
  desc: string;
  severity: "critical" | "high" | "elevated";
  onset: string;
  timeText?: string;
  depth: string;
  depthDesc?: string;
  peak?: string;
  peakDesc?: string;
  routeStatus: "Route Clear" | "Potentially Affected" | "At Risk";
  routeDesc?: string;
  capacity?: string;
  rationale: string;
  contingency?: string;
  x: number;
  y: number;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  borderColor: string;
  badgeBg: string;
}

const FACILITIES_DATA: FacilityItem[] = [
  {
    id: "city-hospital",
    name: "City Hospital",
    category: "medical",
    zoneId: "B",
    desc: "Hospital / Level-1 Trauma Center · Zone B (Panambur Coast)",
    severity: "critical",
    onset: "14:40",
    timeText: "T-Minus 14 Min",
    depth: "0.4 – 0.7 m",
    depthDesc: "Basement Sump At Risk",
    peak: "15:15 hrs",
    peakDesc: "Duration ~85m",
    routeStatus: "Potentially Affected",
    routeDesc: "NH-66 North spur inundation predicted at 14:50",
    rationale:
      "Low surface elevation (1.8m AMSL), immediate proximity to Gurupura backwaters, local stormwater culvert discharge capacity exceeded by 210%.",
    contingency:
      "Backup diesel power generators on ground floor elevated 0.5m pad. ICU on 2nd floor secure; ground ER triaging transfer protocols.",
    x: 375,
    y: 250,
    icon: Hospital,
    iconColor: "text-red-600",
    borderColor: "bg-red-600",
    badgeBg: "bg-red-600",
  },
  {
    id: "panambur-fire",
    name: "Panambur Fire Station",
    category: "fire",
    zoneId: "B",
    desc: "Fire & Rescue Logistics · Zone B (Harbor Perimeter)",
    severity: "high",
    onset: "14:55",
    timeText: "T-Minus 29 Min",
    depth: "0.2 – 0.5 m",
    depthDesc: "Vehicle yard pooling",
    peak: "15:25 hrs",
    peakDesc: "Duration ~60m",
    routeStatus: "Route Clear",
    rationale:
      "Surface runoff accumulation on station vehicle yard. Heavy responder deployment bays fully operational; Zodiac boats pre-staged.",
    contingency:
      "Zodiac rescue inflatable boats stationed at slipway. High-clearance tactical 4x4 trucks prioritized for coastal dispatch.",
    x: 330,
    y: 195,
    icon: Flame,
    iconColor: "text-orange-600",
    borderColor: "bg-orange-600",
    badgeBg: "bg-orange-600",
  },
  {
    id: "govt-school-4",
    name: "Govt. Higher Primary School (Shelter #4)",
    category: "shelter",
    zoneId: "B",
    desc: "Designated Evacuation Shelter · Zone B (Panambur Ward)",
    severity: "high",
    onset: "15:00",
    timeText: "T-Minus 34 Min",
    depth: "0.15 – 0.4 m",
    depthDesc: "Ground courtyard pooling",
    capacity: "600 PAX Capacity",
    routeStatus: "Route Clear",
    rationale:
      "Ground floor courtyard vulnerable to shallow pooling. Shelter multi-purpose hall on 1st floor certified secure for displaced residents.",
    contingency:
      "Drinking water tankers staged on upper terrace. 1st floor classrooms pre-fitted with emergency power bank stations.",
    x: 435,
    y: 295,
    icon: Home,
    iconColor: "text-orange-600",
    borderColor: "bg-orange-600",
    badgeBg: "bg-orange-600",
  },
  {
    id: "tannirbhavi-cg",
    name: "Tannirbhavi Coast Guard Station",
    category: "security",
    zoneId: "F",
    desc: "Security & Marine Defense · Zone F (Sand Spit Sector)",
    severity: "high",
    onset: "15:10",
    timeText: "T-Minus 44 Min",
    depth: "0.25 – 0.45 m",
    depthDesc: "Perimeter spit swash",
    peak: "15:35 hrs",
    peakDesc: "Duration ~45m",
    routeStatus: "At Risk",
    routeDesc: "Sand spit road access vulnerable to surge overtopping",
    rationale:
      "Wave overtopping along Bengre peninsula roadway. Marine jetty operations unaffected; land bridge access vulnerable after 15:30.",
    contingency:
      "Amphibious patrol vehicles stationed at dockside. Direct satellite backup link active to Mangaluru Coast Guard HQ.",
    x: 310,
    y: 430,
    icon: ShieldCheck,
    iconColor: "text-orange-600",
    borderColor: "bg-orange-600",
    badgeBg: "bg-orange-600",
  },
  {
    id: "surathkal-substation",
    name: "Surathkal Sub-Station 110kV",
    category: "utilities",
    zoneId: "C",
    desc: "Critical Power Utility · Zone C (North Industrial Grid)",
    severity: "high",
    onset: "15:20",
    timeText: "T-Minus 54 Min",
    depth: "0.20 – 0.40 m",
    depthDesc: "Switchyard trench runoff",
    peak: "15:50 hrs",
    peakDesc: "Duration ~40m",
    routeStatus: "Route Clear",
    rationale:
      "Switchyard drainage trenches at 88% capacity. Automated high-voltage breaker isolation staged if threshold breaches 0.45m.",
    contingency:
      "Automated SCADA feed monitored from MESCOM central control. Standby bypass to Surathkal East 66kV feeder ready.",
    x: 470,
    y: 145,
    icon: Zap,
    iconColor: "text-orange-600",
    borderColor: "bg-orange-600",
    badgeBg: "bg-orange-600",
  },
  {
    id: "bengre-chc",
    name: "Bengre Community Health Center",
    category: "medical",
    zoneId: "H",
    desc: "Primary Medical Clinic · Zone H (Estuary South)",
    severity: "elevated",
    onset: "15:55",
    timeText: "T-Minus 89 Min",
    depth: "0.10 – 0.25 m",
    depthDesc: "Entry ramp threshold safe",
    routeStatus: "Route Clear",
    rationale:
      "High tide harmonic back-flow via fishing harbor basin. Facility threshold elevated by 0.35m steps; patient triage operational.",
    contingency:
      "Portable oxygen supply and medication stock relocated to upper medical store room.",
    x: 295,
    y: 570,
    icon: Stethoscope,
    iconColor: "text-amber-600",
    borderColor: "bg-amber-600",
    badgeBg: "bg-amber-600",
  },
  {
    id: "st-aloysius-hall",
    name: "Kodialbail Community Relief Center",
    category: "shelter",
    zoneId: "A",
    desc: "Secondary Shelter Reserve · Zone A (Urban Buffer)",
    severity: "elevated",
    onset: "16:10",
    timeText: "T-Minus 104 Min",
    depth: "0.05 – 0.15 m",
    capacity: "1,250 PAX Capacity",
    routeStatus: "Route Clear",
    rationale:
      "Storm drain surge capacity optimal. Standby emergency kitchen, generator units fueled for 72hr sustained operation.",
    contingency:
      "Community volunteers checked in. Food supply buffer for 3 days securely stored on site.",
    x: 510,
    y: 495,
    icon: Building2,
    iconColor: "text-amber-600",
    borderColor: "bg-amber-600",
    badgeBg: "bg-amber-600",
  },
];

export default function CriticalFacilitiesPage() {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"severity" | "onset">("severity");
  const [activeFacilityId, setActiveFacilityId] = useState<string>("city-hospital");
  const [layers, setLayers] = useState({ routes: true, contours: true, hydro: true });
  const [mapZoom, setMapZoom] = useState(1);
  const [notification, setNotification] = useState<string | null>(null);

  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [scenarioModalOpen, setScenarioModalOpen] = useState(false);

  // Active sync with backend replay simulation
  useEffect(() => {
    let mounted = true;
    console.info('[CriticalFacilitiesPage] Fetching simulation replay data from API...');
    apiClient
      .fetchReplayEvent('mangaluru-historical-2018')
      .catch((err) => {
        console.warn('[CriticalFacilitiesPage] Replay fetch notice:', err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  const filteredFacilities = FACILITIES_DATA.filter((f) => {
    if (filter === "all") return true;
    if (filter === "medical") return f.category === "medical";
    if (filter === "fire") return f.category === "fire";
    if (filter === "security") return f.category === "security";
    if (filter === "shelter") return f.category === "shelter";
    if (filter === "utilities") return f.category === "utilities";
    return true;
  })
    .filter(
      (f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.zoneId.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === "severity") {
        const rank: Record<string, number> = { critical: 1, high: 2, elevated: 3 };
        return rank[a.severity] - rank[b.severity];
      } else if (sortOrder === "onset") {
        return a.onset.localeCompare(b.onset);
      }
      return 0;
    });

  const activeFacility =
    FACILITIES_DATA.find((f) => f.id === activeFacilityId) || FACILITIES_DATA[0];

  const handleSelectFacility = (id: string) => {
    setActiveFacilityId(id);
    const cardEl = document.getElementById(`facility-card-${id}`);
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const toggleLayer = (layer: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-100 flex flex-col font-sans antialiased text-slate-900 select-none">
      {/* Top Header */}
      <TopHeader
        onOpenShortcuts={() => setShortcutsModalOpen(true)}
        currentTime="14:26"
        isSimulation={true}
      />

      {/* Main Container */}
      <div className="flex flex-1 pt-14 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar onOpenScenario={() => setScenarioModalOpen(true)} />

        {/* Content Body */}
        <div className="flex-1 ml-[220px] lg:ml-[232px] flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-slate-50">
          <div className="bg-amber-50 border-b border-amber-300 px-5 py-3 text-sm text-amber-950 shrink-0"><strong>ILLUSTRATIVE / UNVALIDATED DATASET.</strong> These facilities and hardcoded fallback impacts, capacity and sensor claims are not linked to a selected run. <Link href="/?compare=1" className="font-bold underline">Compare real run-linked assets in Overview</Link>.</div>
          {/* Header & Sub-Bar */}
          <div className="px-5 py-3 bg-white border-b border-slate-200 shrink-0 shadow-2xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <Link href="/" className="hover:text-blue-700 transition-colors">
                    Command Center
                  </Link>
                  <span>/</span>
                  <span className="text-slate-700">Sector DK-04</span>
                  <span>/</span>
                  <span className="text-red-700 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                    Tier-1 Hydro Watch
                  </span>
                </div>
                <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
                  Critical Facilities
                </h1>
                <p className="text-xs text-slate-500">
                  7 facilities in coastal flood risk zones · Mangaluru Emergency Sector
                </p>
              </div>

              {/* Status Chips */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">
                    ICU Capacity:
                  </span>
                  <span className="text-sm text-slate-900 font-bold">142 Beds</span>
                  <span className="px-1.5 py-0.5 bg-red-600 text-white rounded text-[9px] uppercase font-bold">
                    Active Watch
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">
                    Shelter Avail:
                  </span>
                  <span className="text-sm text-slate-900 font-bold">1,850 Cap</span>
                  <span className="text-[10px] text-slate-600 font-semibold">
                    82% Operational
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 text-white rounded text-[10px] font-bold">
                  <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                  <span>Illustrative telemetry · Unvalidated</span>
                </div>
              </div>
            </div>

            {/* Filters & Search Toolbar */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-2.5">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 xl:pb-0">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-3 py-1.5 rounded text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap font-semibold cursor-pointer ${
                    filter === "all"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <span>All Facilities</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      filter === "all"
                        ? "bg-slate-800 text-white"
                        : "bg-slate-200 text-slate-800"
                    }`}
                  >
                    7
                  </span>
                </button>
                <button
                  onClick={() => setFilter("medical")}
                  className={`px-3 py-1.5 rounded text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap font-semibold cursor-pointer ${
                    filter === "medical"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <Hospital className="w-3.5 h-3.5" />
                  <span>Medical (2)</span>
                </button>
                <button
                  onClick={() => setFilter("fire")}
                  className={`px-3 py-1.5 rounded text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap font-semibold cursor-pointer ${
                    filter === "fire"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Fire & Rescue (1)</span>
                </button>
                <button
                  onClick={() => setFilter("shelter")}
                  className={`px-3 py-1.5 rounded text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap font-semibold cursor-pointer ${
                    filter === "shelter"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Shelters (2)</span>
                </button>
                <button
                  onClick={() => setFilter("security")}
                  className={`px-3 py-1.5 rounded text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap font-semibold cursor-pointer ${
                    filter === "security"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Security (1)</span>
                </button>
                <button
                  onClick={() => setFilter("utilities")}
                  className={`px-3 py-1.5 rounded text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap font-semibold cursor-pointer ${
                    filter === "utilities"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Utilities (1)</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-2.5 top-2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-100 rounded text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-900 border border-slate-200"
                    placeholder="Search facility name or zone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-1 bg-slate-100 px-2 py-1.5 rounded border border-slate-200">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                  <select
                    className="bg-transparent text-[11px] text-slate-800 focus:outline-none cursor-pointer font-semibold"
                    value={sortOrder}
                    onChange={(e) =>
                      setSortOrder(e.target.value as "severity" | "onset")
                    }
                  >
                    <option value="severity">Sort: Severity first</option>
                    <option value="onset">Sort: Earliest Onset</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Toast Notification Banner */}
          {notification && (
            <div className="bg-slate-900 text-white px-4 py-2 text-xs flex items-center justify-between z-30 transition-all">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{notification}</span>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="text-slate-400 hover:text-white text-xs font-bold px-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Split Content: Left List / Right Map */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
            {/* Left Column: Facility Cards */}
            <div className="lg:col-span-5 xl:col-span-5 overflow-y-auto p-3 space-y-2.5 bg-slate-50 border-r border-slate-200">
              {filteredFacilities.map((facility) => {
                const Icon = facility.icon;
                const isActive = activeFacilityId === facility.id;

                return (
                  <article
                    id={`facility-card-${facility.id}`}
                    key={facility.id}
                    onClick={() => handleSelectFacility(facility.id)}
                    className={`bg-white rounded-lg border transition-all cursor-pointer relative overflow-hidden ${
                      isActive
                        ? "border-slate-900 ring-2 ring-slate-900/10 shadow-md"
                        : "border-slate-200 hover:border-slate-300 hover:shadow-xs"
                    }`}
                  >
                    {/* Left Accent Bar */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1.5 ${facility.borderColor}`}
                    />

                    <div className="pl-4 pr-3.5 py-3">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`p-1 rounded ${
                                facility.severity === "critical"
                                  ? "bg-red-50 text-red-600"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </span>
                            <h2 className="text-sm font-bold text-slate-900 tracking-tight truncate">
                              {facility.name}
                            </h2>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                            {facility.desc}
                          </p>
                        </div>

                        {/* Severity Badge */}
                        <div className="shrink-0 flex flex-col items-end gap-0.5">
                          {facility.severity === "critical" && (
                            <span className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold tracking-wider flex items-center gap-1 shadow-2xs">
                              <AlertTriangle className="w-3 h-3" /> CRITICAL
                            </span>
                          )}
                          {facility.severity === "high" && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-800 border border-orange-200 rounded text-[10px] font-bold tracking-wider flex items-center gap-1">
                              <ArrowUp className="w-3 h-3" /> HIGH
                            </span>
                          )}
                          {facility.severity === "elevated" && (
                            <span className="px-2 py-0.5 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded text-[10px] font-bold tracking-wider flex items-center gap-1">
                              ELEVATED
                            </span>
                          )}
                          {facility.timeText && (
                            <span
                              className={`text-[10px] font-semibold ${
                                facility.severity === "critical"
                                  ? "text-red-700"
                                  : "text-slate-600"
                              }`}
                            >
                              {facility.timeText}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stat grid */}
                      <div className="grid grid-cols-3 gap-2 mt-2.5 p-2 bg-slate-50 rounded border border-slate-100 text-xs">
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold">
                            Depth
                          </div>
                          <div
                            className={`font-bold ${
                              facility.severity === "critical"
                                ? "text-red-700"
                                : "text-slate-900"
                            }`}
                          >
                            {facility.depth}
                          </div>
                          {facility.depthDesc && (
                            <div className="text-[10px] text-slate-500 truncate">
                              {facility.depthDesc}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold">
                            Onset
                          </div>
                          <div className="font-bold text-slate-900">
                            {facility.onset} hrs
                          </div>
                          <div className="text-[10px] text-slate-500">Predicted</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold">
                            Access
                          </div>
                          <div
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded inline-block mt-0.5 ${
                              facility.routeStatus === "Route Clear"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-red-50 text-red-800 border border-red-200"
                            }`}
                          >
                            {facility.routeStatus === "Route Clear"
                              ? "✓ Route Clear"
                              : "⚠️ At Risk"}
                          </div>
                        </div>
                      </div>

                      {/* Route warning callout if present */}
                      {facility.routeDesc && (
                        <div className="mt-2 p-1.5 bg-red-50 border border-red-100 text-red-900 rounded text-[11px] flex items-center gap-1.5">
                          <AlertTriangle className="text-red-600 w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{facility.routeDesc}</span>
                        </div>
                      )}

                      {/* Rationale & Contingency */}
                      <div className="mt-2 text-[11px] text-slate-600 leading-snug line-clamp-2">
                        <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">
                          Rationale:{" "}
                        </span>
                        {facility.rationale}
                      </div>

                      {/* Actions row */}
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <Link
                          href={`/?zone=${facility.zoneId}`}
                          className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Zone {facility.zoneId} Overview{" "}
                          <ChevronRight className="w-3 h-3" />
                        </Link>

                        <div className="flex items-center gap-2">
                          {facility.severity === "critical" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                showNotification(
                                  `[ORDER ISSUED] Mobile barrier teams dispatched to ${facility.name} (Zone ${facility.zoneId}). ETA: 8 min.`
                                );
                              }}
                              className="px-2.5 py-1 bg-red-600 text-white rounded text-[11px] font-semibold hover:bg-red-700 transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <Shield className="w-3 h-3" /> Deploy Barriers
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectFacility(facility.id);
                            }}
                            className="px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            Focus Map
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Right Column: Interactive Map with Markers */}
            <div className="lg:col-span-7 xl:col-span-7 flex flex-col bg-slate-200 relative overflow-hidden select-none">
              {/* Map Layer Overlay Header */}
              <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm p-1.5 rounded-md shadow-md border border-slate-200 pointer-events-auto">
                  <span className="text-[10px] text-slate-500 px-1.5 uppercase font-bold">
                    Layers:
                  </span>
                  <button
                    onClick={() => toggleLayer("routes")}
                    className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                      layers.routes
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <Route className="w-3 h-3" /> Evacuation Corridors
                  </button>
                  <button
                    onClick={() => toggleLayer("contours")}
                    className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                      layers.contours
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <Waves className="w-3 h-3" /> Contours
                  </button>
                  <button
                    onClick={() => toggleLayer("hydro")}
                    className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                      layers.hydro
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <Waves className="w-3 h-3" /> Hydro Depth Model
                  </button>
                </div>

                <div className="bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-md shadow-md border border-slate-200 flex items-center gap-3 pointer-events-auto">
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] text-slate-900 font-bold tracking-tight">
                      12°54&apos;18&quot;N · 74°49&apos;42&quot;E
                    </span>
                    <span className="text-[9px] text-slate-500">
                      WGS84 · Mangaluru Sector
                    </span>
                  </div>
                  <div className="h-4 w-px bg-slate-300"></div>
                  <div className="flex flex-col items-center">
                    <span className="text-[8px] text-slate-400 uppercase font-bold">
                      Scale
                    </span>
                    <div className="w-10 h-1 bg-slate-900 relative mt-0.5">
                      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[8px] text-slate-900 font-semibold">
                        500m
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map Canvas */}
              <div className="w-full flex-1 relative bg-slate-100 overflow-hidden">
                <div
                  style={{
                    transform: `scale(${mapZoom})`,
                    transformOrigin: "center center",
                    transition: "transform 0.2s ease-out",
                  }}
                  className="w-full h-full"
                >
                  <svg
                    className="w-full h-full object-cover"
                    viewBox="0 0 1000 700"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <pattern
                        id="facGrid"
                        width="40"
                        height="40"
                        patternUnits="userSpaceOnUse"
                      >
                        <path
                          d="M 40 0 L 0 0 0 40"
                          fill="none"
                          stroke="#cbd5e1"
                          strokeWidth="0.75"
                          strokeDasharray="2 2"
                        />
                      </pattern>
                      <linearGradient
                        id="seaWaterGrad"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.85" />
                        <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.65" />
                      </linearGradient>
                      <pattern
                        id="hatchCritical"
                        width="8"
                        height="8"
                        patternTransform="rotate(45 0 0)"
                        patternUnits="userSpaceOnUse"
                      >
                        <line
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="8"
                          stroke="#DC2626"
                          strokeWidth="1.5"
                          strokeOpacity="0.5"
                        />
                      </pattern>
                    </defs>

                    {/* Sea on West */}
                    <path
                      d="M 0,0 L 250,0 Q 235,160 250,280 Q 260,420 220,530 Q 180,620 210,700 L 0,700 Z"
                      fill="url(#seaWaterGrad)"
                    />
                    <text
                      x="70"
                      y="360"
                      fill="#0369a1"
                      fontSize="14"
                      fontWeight="bold"
                      letterSpacing="3"
                      opacity="0.6"
                      transform="rotate(-90 70 360)"
                    >
                      ARABIAN SEA
                    </text>

                    {/* Estuary / Gurupura River Waterway */}
                    <path
                      d="M 1000,140 Q 650,150 480,180 Q 340,210 270,270 Q 245,330 250,420 Q 255,510 320,570 Q 450,600 680,630 L 700,680 Q 420,650 280,610 Q 210,540 215,410 Q 220,310 260,240 Q 340,170 510,140 Q 700,110 1000,100 Z"
                      fill="#38bdf8"
                      opacity="0.5"
                    />

                    {/* Netravati South Estuary */}
                    <path
                      d="M 1000,580 Q 750,560 550,580 Q 380,600 240,650 L 220,700 L 1000,700 Z"
                      fill="#38bdf8"
                      opacity="0.45"
                    />

                    {/* Background Grid */}
                    <rect
                      x="230"
                      y="0"
                      width="770"
                      height="700"
                      fill="url(#facGrid)"
                      opacity="0.6"
                    />

                    {/* Terrain Contours Layer */}
                    {layers.contours && (
                      <g id="terrainContoursLayer" opacity="0.6">
                        <path
                          d="M 280,0 Q 320,180 340,300 Q 360,460 310,600 L 330,700"
                          fill="none"
                          stroke="#94a3b8"
                          strokeWidth="1"
                          strokeDasharray="4 3"
                        />
                        <path
                          d="M 390,0 Q 430,220 460,340 Q 480,500 420,700"
                          fill="none"
                          stroke="#94a3b8"
                          strokeWidth="1.2"
                          strokeDasharray="6 4"
                        />
                        <path
                          d="M 520,0 Q 560,250 580,380 Q 610,540 570,700"
                          fill="none"
                          stroke="#94a3b8"
                          strokeWidth="1.5"
                          strokeDasharray="8 4"
                        />
                        <text
                          x="345"
                          y="120"
                          fill="#64748b"
                          fontSize="9"
                          fontWeight="600"
                        >
                          +2.0m
                        </text>
                        <text
                          x="465"
                          y="160"
                          fill="#64748b"
                          fontSize="9"
                          fontWeight="600"
                        >
                          +5.0m
                        </text>
                        <text
                          x="585"
                          y="200"
                          fill="#64748b"
                          fontSize="9"
                          fontWeight="600"
                        >
                          +10.0m
                        </text>
                      </g>
                    )}

                    {/* Hydro Depth Simulation Zones (Light Inundation Polygons) */}
                    {layers.hydro && (
                      <g id="hydroFloodLayer">
                        {/* Zone B Critical Polygon with Hatch */}
                        <polygon
                          points="270,180 460,190 480,320 330,340 260,260"
                          fill="url(#hatchCritical)"
                          stroke="#DC2626"
                          strokeWidth="1.5"
                        />
                        {/* Zone F High Polygon */}
                        <polygon
                          points="240,370 380,380 370,490 220,480"
                          fill="#ea580c"
                          fillOpacity="0.2"
                          stroke="#ea580c"
                          strokeWidth="1.5"
                        />
                        {/* Zone C High Polygon */}
                        <polygon
                          points="360,70 560,80 540,180 370,170"
                          fill="#ea580c"
                          fillOpacity="0.18"
                          stroke="#ea580c"
                          strokeWidth="1.5"
                        />
                      </g>
                    )}

                    {/* Evacuation Corridors & Breach Spots */}
                    {layers.routes && (
                      <g id="evacuationRoutesLayer">
                        <path
                          d="M 440,0 L 410,180 L 390,260 L 380,360 L 410,520 L 430,700"
                          fill="none"
                          stroke="#0f172a"
                          strokeWidth="3.5"
                        />
                        <path
                          d="M 330,120 L 320,240 L 300,380 L 340,490 L 380,520"
                          fill="none"
                          stroke="#0284c7"
                          strokeWidth="2.5"
                          strokeDasharray="6 3"
                        />
                        {/* NH-66 Breach indicator */}
                        <path
                          d="M 405,225 L 395,285"
                          fill="none"
                          stroke="#DC2626"
                          strokeWidth="4.5"
                          strokeLinecap="round"
                          strokeDasharray="2 3"
                        />
                        <text
                          x="415"
                          y="265"
                          fill="#DC2626"
                          fontSize="9"
                          fontWeight="bold"
                        >
                          NH-66 BREACH SPOT (14:50)
                        </text>
                      </g>
                    )}

                    {/* All 7 Facility Markers */}
                    {FACILITIES_DATA.map((fac) => {
                      const isSelected = fac.id === activeFacilityId;
                      const isCritical = fac.severity === "critical";

                      return (
                        <g
                          key={fac.id}
                          className="cursor-pointer transition-all"
                          onClick={() => handleSelectFacility(fac.id)}
                        >
                          {/* Animated Radar Pulse for Critical / Selected */}
                          {isSelected && (
                            <circle
                              cx={fac.x}
                              cy={fac.y}
                              r="26"
                              fill={isCritical ? "#DC2626" : "#0284c7"}
                              fillOpacity="0.2"
                            >
                              <animate
                                attributeName="r"
                                values="14;30;14"
                                dur="2s"
                                repeatCount="indefinite"
                              />
                              <animate
                                attributeName="fill-opacity"
                                values="0.35;0.05;0.35"
                                dur="2s"
                                repeatCount="indefinite"
                              />
                            </circle>
                          )}

                          {/* Marker Pin Circle */}
                          <circle
                            cx={fac.x}
                            cy={fac.y}
                            r={isSelected ? "14" : "11"}
                            fill={
                              isCritical
                                ? "#DC2626"
                                : fac.severity === "high"
                                ? "#ea580c"
                                : "#0f172a"
                            }
                            stroke="#ffffff"
                            strokeWidth={isSelected ? "3" : "2"}
                            className="shadow-md"
                          />

                          {/* Marker Icon / Symbol */}
                          {fac.category === "medical" && (
                            <path
                              d={`M ${fac.x - 4},${fac.y - 1.5} h 3 v -3 h 2 v 3 h 3 v 2 h -3 v 3 h -2 v -3 h -3 Z`}
                              fill="#ffffff"
                            />
                          )}
                          {fac.category === "fire" && (
                            <circle
                              cx={fac.x}
                              cy={fac.y}
                              r="3.5"
                              fill="#ffffff"
                            />
                          )}
                          {fac.category === "shelter" && (
                            <path
                              d={`M ${fac.x},${fac.y - 4} L ${fac.x + 4},${
                                fac.y
                              } L ${fac.x + 3},${fac.y + 4} L ${fac.x - 3},${
                                fac.y + 4
                              } L ${fac.x - 4},${fac.y} Z`}
                              fill="#ffffff"
                            />
                          )}
                          {fac.category === "security" && (
                            <path
                              d={`M ${fac.x - 3},${fac.y - 4} L ${fac.x + 3},${
                                fac.y - 4
                              } L ${fac.x + 3},${fac.y + 1} L ${fac.x},${
                                fac.y + 4
                              } L ${fac.x - 3},${fac.y + 1} Z`}
                              fill="#ffffff"
                            />
                          )}
                          {fac.category === "utilities" && (
                            <path
                              d={`M ${fac.x},${fac.y - 4} L ${fac.x - 3},${
                                fac.y
                              } L ${fac.x},${fac.y} L ${fac.x - 1},${
                                fac.y + 4
                              } L ${fac.x + 3},${fac.y} L ${fac.x},${fac.y} Z`}
                              fill="#ffffff"
                            />
                          )}

                          {/* Pin Label (Clean Dark Pill) */}
                          <g
                            transform={`translate(${fac.x + 14}, ${
                              fac.y - 10
                            })`}
                            className="pointer-events-none"
                          >
                            <rect
                              x="0"
                              y="0"
                              width={fac.name.length * 6.5 + 16}
                              height="20"
                              rx="4"
                              fill="#0f172a"
                              fillOpacity={isSelected ? "0.95" : "0.75"}
                            />
                            <text
                              x="8"
                              y="13"
                              fill="#ffffff"
                              fontSize="9.5"
                              fontWeight={isSelected ? "bold" : "600"}
                            >
                              {fac.name.split(" (")[0]}
                            </text>
                          </g>
                        </g>
                      );
                    })}

                    {/* Focused Active Facility Dynamic Callout Card */}
                    {activeFacility && (
                      <g
                        transform={`translate(${
                          activeFacility.x > 500
                            ? activeFacility.x - 240
                            : activeFacility.x + 20
                        }, ${
                          activeFacility.y > 450
                            ? activeFacility.y - 120
                            : activeFacility.y - 30
                        })`}
                        className="transition-all"
                      >
                        {/* Shadow Container */}
                        <rect
                          x="0"
                          y="0"
                          width="230"
                          height="108"
                          rx="6"
                          fill="#ffffff"
                          stroke={
                            activeFacility.severity === "critical"
                              ? "#DC2626"
                              : "#0f172a"
                          }
                          strokeWidth="1.5"
                          filter="drop-shadow(0 4px 6px rgba(0,0,0,0.15))"
                        />
                        {/* Header Banner */}
                        <rect
                          x="0"
                          y="0"
                          width="230"
                          height="22"
                          rx="6"
                          fill={
                            activeFacility.severity === "critical"
                              ? "#DC2626"
                              : "#0f172a"
                          }
                        />
                        <text
                          x="8"
                          y="15"
                          fill="#ffffff"
                          fontSize="9.5"
                          fontWeight="bold"
                          letterSpacing="0.4"
                        >
                          {activeFacility.name.toUpperCase()} · ZONE{" "}
                          {activeFacility.zoneId}
                        </text>

                        {/* Onset countdown */}
                        <text
                          x="10"
                          y="39"
                          fill="#0f172a"
                          fontSize="11"
                          fontWeight="bold"
                        >
                          Onset: {activeFacility.onset} hrs ({activeFacility.timeText})
                        </text>
                        <text
                          x="10"
                          y="54"
                          fill="#475569"
                          fontSize="10"
                          fontWeight="500"
                        >
                          Predicted Depth: {activeFacility.depth}
                        </text>

                        {/* Route status badge inside card */}
                        <rect
                          x="8"
                          y="62"
                          width="214"
                          height="20"
                          rx="3"
                          fill={
                            activeFacility.routeStatus === "Route Clear"
                              ? "#ecfdf5"
                              : "#fef2f2"
                          }
                          stroke={
                            activeFacility.routeStatus === "Route Clear"
                              ? "#a7f3d0"
                              : "#fecaca"
                          }
                          strokeWidth="0.75"
                        />
                        <text
                          x="14"
                          y="76"
                          fill={
                            activeFacility.routeStatus === "Route Clear"
                              ? "#065f46"
                              : "#991b1b"
                          }
                          fontSize="9.5"
                          fontWeight="bold"
                        >
                          {activeFacility.routeStatus === "Route Clear"
                            ? "✓ Evacuation Corridors Intact"
                            : "⚠️ NH-66 Cutoff Imminent · Reroute"}
                        </text>

                        {/* Click CTA */}
                        <text
                          x="10"
                          y="98"
                          fill="#0284c7"
                          fontSize="9"
                          fontWeight="bold"
                        >
                          Selected on map · Synchronized with incident list →
                        </text>
                      </g>
                    )}
                  </svg>
                </div>

                {/* Map Legend */}
                <div className="absolute bottom-16 left-3 bg-white/95 backdrop-blur-sm p-2.5 rounded-md shadow-md border border-slate-200 z-20 space-y-1.5 text-[10px]">
                  <div className="font-bold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-200">
                    Facility Types
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="w-3.5 h-3.5 rounded-full bg-red-600 flex items-center justify-center text-white text-[9px] font-bold">
                      +
                    </span>
                    <span>Hospital / Level-1 Trauma</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="w-3.5 h-3.5 rounded-full bg-orange-600 flex items-center justify-center text-white text-[9px] font-bold">
                      ●
                    </span>
                    <span>Fire / Police / Shelter</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="w-3.5 h-3.5 rounded-full bg-slate-900 flex items-center justify-center text-white text-[9px] font-bold">
                      ⚡
                    </span>
                    <span>Power / Utility Substation</span>
                  </div>
                </div>

                {/* Zoom Controls */}
                <div className="absolute bottom-16 right-3 flex flex-col gap-1 z-20">
                  <button
                    onClick={() => setMapZoom((z) => Math.min(z * 1.2, 2.5))}
                    className="w-8 h-8 bg-white hover:bg-slate-100 text-slate-900 rounded-md shadow-md border border-slate-200 flex items-center justify-center font-bold cursor-pointer"
                    title="Zoom in"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setMapZoom((z) => Math.max(z * 0.8, 0.7))}
                    className="w-8 h-8 bg-white hover:bg-slate-100 text-slate-900 rounded-md shadow-md border border-slate-200 flex items-center justify-center font-bold cursor-pointer"
                    title="Zoom out"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setMapZoom(1)}
                    className="w-8 h-8 bg-white hover:bg-slate-100 text-slate-900 rounded-md shadow-md border border-slate-200 flex items-center justify-center font-bold cursor-pointer"
                    title="Reset view"
                  >
                    <Maximize className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Bottom Access Advisory Footer */}
              <footer className="h-14 bg-white border-t border-slate-200 px-4 flex items-center justify-between z-30 shrink-0 shadow-xs">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <span className="p-1.5 bg-red-100 text-red-600 rounded flex items-center justify-center animate-pulse shrink-0">
                    <Route className="w-4 h-4" />
                  </span>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-red-700 font-bold uppercase tracking-wider shrink-0">
                        Advisory DK-ROUTE-01:
                      </span>
                      <span className="text-xs text-slate-900 font-semibold truncate">
                        NH-66 spur to City Hospital vulnerable at 14:50 — Emergency
                        diversion via Port Beach Road active.
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 truncate">
                      EOC Traffic HQ: Traffic diverted at Panambur Junction Circle
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() =>
                      showNotification(
                        "[DISPATCH BROADCAST] Route Advisory DK-ROUTE-01 broadcasted to Traffic Command and City Police dispatch."
                      )
                    }
                    className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <RadioTower className="w-3.5 h-3.5 text-sky-400" />
                    <span>Transmit Advisory</span>
                  </button>
                </div>
              </footer>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ShortcutsModal
        open={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />
      <ScenarioModal
        open={scenarioModalOpen}
        onClose={() => setScenarioModalOpen(false)}
      />
    </div>
  );
}
