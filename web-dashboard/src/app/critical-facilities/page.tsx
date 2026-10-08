"use client";

import React, { useState } from "react";
import {
  Shield,
  Waves,
  Building2,
  Bell,
  User,
  LayoutDashboard,
  Grid,
  Hospital,
  Siren,
  Route,
  Radio,
  FileText,
  AlertTriangle,
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
} from "lucide-react";

export default function CriticalFacilitiesPage() {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("severity");
  const [activeFacility, setActiveFacility] = useState("city-hospital");
  const [layers, setLayers] = useState({ routes: true, contours: true, hydro: true });
  const [mapZoom, setMapZoom] = useState(1);

  const facilities = [
    {
      id: "city-hospital",
      name: "City Hospital",
      category: "medical",
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
      icon: Hospital,
      iconColor: "text-red-600",
      borderColor: "bg-red-600",
    },
    {
      id: "panambur-fire",
      name: "Panambur Fire Station",
      category: "fire",
      desc: "Fire & Rescue Logistics · Zone B (Harbor Perimeter)",
      severity: "high",
      onset: "14:55",
      depth: "0.2 – 0.5 m",
      routeStatus: "Route Clear",
      rationale:
        "Surface runoff accumulation on station vehicle yard. Heavy responder deployment bays fully operational; Zodiac boats pre-staged.",
      icon: Flame,
      iconColor: "text-slate-900",
      borderColor: "bg-slate-900",
    },
    {
      id: "govt-school-4",
      name: "Govt. Higher Primary School (Designated Shelter #4)",
      category: "shelter",
      desc: "School / Evacuation Shelter · Zone B",
      severity: "high",
      onset: "15:00",
      depth: "0.15 – 0.4 m",
      capacity: "600 PAX",
      routeStatus: "Route Clear",
      rationale:
        "Ground floor courtyard vulnerable to shallow pooling. Shelter multi-purpose hall on 1st floor certified secure for displaced residents.",
      icon: Home,
      iconColor: "text-slate-900",
      borderColor: "bg-slate-900",
    },
    {
      id: "tannirbhavi-cg",
      name: "Tannirbhavi Coast Guard Station",
      category: "security",
      desc: "Security & Marine Defense · Zone F (Sand Spit Sector)",
      severity: "high",
      onset: "15:10",
      depth: "0.25 – 0.45 m",
      routeStatus: "At Risk",
      rationale:
        "Wave overtopping along Bengre peninsula roadway. Marine jetty operations unaffected; land bridge vulnerable after 15:30.",
      icon: ShieldCheck,
      iconColor: "text-slate-900",
      borderColor: "bg-slate-900",
    },
    {
      id: "surathkal-substation",
      name: "Surathkal Sub-Station 110kV",
      category: "utilities",
      desc: "Critical Power Utility · Zone C (North Industrial Grid)",
      severity: "high",
      onset: "15:20",
      depth: "0.20 – 0.40 m",
      routeStatus: "Route Clear",
      rationale:
        "Switchyard drainage trenches at 88% capacity. Automated high-voltage breaker isolation staged if threshold breaches 0.45m.",
      icon: Zap,
      iconColor: "text-slate-900",
      borderColor: "bg-slate-900",
    },
    {
      id: "bengre-chc",
      name: "Bengre Community Health Center",
      category: "medical",
      desc: "Primary Medical Clinic · Zone H (Estuary South)",
      severity: "elevated",
      onset: "15:55",
      depth: "0.10 – 0.25 m",
      routeStatus: "Route Clear",
      rationale:
        "High tide harmonic back-flow via fishing harbor basin. Facility threshold elevated by 0.35m steps; patient triage operational.",
      icon: Stethoscope,
      iconColor: "text-slate-500",
      borderColor: "bg-slate-500",
    },
    {
      id: "st-aloysius-hall",
      name: "Kodialbail Community Relief Center",
      category: "shelter",
      desc: "Secondary Shelter Reserve · Zone A (Urban Buffer)",
      severity: "elevated",
      onset: "16:10",
      depth: "0.05 – 0.15 m",
      capacity: "1,250 PAX",
      routeStatus: "Route Clear",
      rationale:
        "Storm drain surge capacity optimal. Standby emergency kitchen, generator units fueled for 72hr sustained operation.",
      icon: Building2,
      iconColor: "text-slate-500",
      borderColor: "bg-slate-500",
    },
  ];

  const filteredFacilities = facilities
    .filter((f) => filter === "all" || f.category === filter)
    .filter(
      (f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.desc.toLowerCase().includes(searchQuery.toLowerCase())
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

  const toggleLayer = (layer: keyof typeof layers) => {
    setLayers({ ...layers, [layer]: !layers[layer] });
  };

  return (
    <div className="bg-slate-50 font-sans text-slate-900 antialiased min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-300 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Shield className="text-slate-900 w-5 h-5" />
            <span className="text-base font-semibold text-slate-900 tracking-tight">TideMesh</span>
          </div>
          <div className="h-4 w-px bg-slate-300"></div>
          <div className="flex items-center gap-1">
            <Waves className="text-slate-900 w-4 h-4" />
            <span className="text-sm text-slate-900 font-bold">Coastal Flood Event — Mangaluru Coast</span>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-600 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-900 font-bold">LIVE · Updated 14:26 (2 min ago)</span>
          </div>
          <div className="bg-slate-50 px-2 py-1 rounded border border-slate-300">
            <span className="text-[10px] text-slate-600 font-medium">
              Model: <strong className="text-slate-900 font-semibold">v1.2</strong>
            </span>
          </div>
          <div className="flex items-center bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-900 text-[10px] font-bold">
            <Building2 className="w-4 h-4 mr-1 text-slate-600" />
            <span>EOC STATUS: FULL ACTIVATION</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center p-1.5 text-slate-600 hover:text-slate-900 cursor-pointer rounded hover:bg-slate-200 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-white text-[9px] font-bold">
              3
            </span>
          </div>
          <div className="h-4 w-px bg-slate-300"></div>
          <div className="flex items-center gap-2">
            <div className="flex flex-col text-right">
              <span className="text-xs text-slate-900 font-semibold">R. Shetty</span>
              <span className="text-[10px] text-slate-600">Duty Officer · EOC Shift 1</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center">
              <User className="text-white w-4 h-4" />
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="fixed left-0 top-14 bottom-0 w-[232px] bg-white border-r border-slate-300 z-30 flex flex-col justify-between">
        <div className="flex flex-col pt-2">
          <nav className="flex flex-col gap-0.5 px-1">
            <a href="#" className="flex items-center justify-between px-3 py-2 rounded text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors text-xs border-l-4 border-transparent">
              <div className="flex items-center gap-2"><LayoutDashboard className="w-4 h-4" /><span>Overview</span></div>
            </a>
            <a href="#" className="flex items-center justify-between px-3 py-2 rounded text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors text-xs border-l-4 border-transparent">
              <div className="flex items-center gap-2"><Grid className="w-4 h-4" /><span>Zones</span></div>
              <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-bold">12</span>
            </a>
            <a href="#" className="flex items-center justify-between px-3 py-2 rounded transition-colors bg-blue-100 text-blue-900 border-l-4 border-slate-900 font-semibold text-xs">
              <div className="flex items-center gap-2"><Hospital className="w-4 h-4" /><span>Critical Facilities</span></div>
              <span className="px-1.5 py-0.5 bg-slate-300 text-slate-900 rounded text-[10px] font-bold">7</span>
            </a>
            <a href="#" className="flex items-center justify-between px-3 py-2 rounded text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors text-xs border-l-4 border-transparent">
              <div className="flex items-center gap-2"><Siren className="w-4 h-4" /><span>Response & Actions</span></div>
              <span className="px-1.5 py-0.5 bg-red-100 text-red-900 rounded text-[10px] font-bold">3 Pending</span>
            </a>
            <a href="#" className="flex items-center justify-between px-3 py-2 rounded text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors text-xs border-l-4 border-transparent">
              <div className="flex items-center gap-2"><Route className="w-4 h-4" /><span>Evacuation Routes</span></div>
            </a>
            <a href="#" className="flex items-center justify-between px-3 py-2 rounded text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors text-xs border-l-4 border-transparent">
              <div className="flex items-center gap-2"><Radio className="w-4 h-4" /><span>Sensor Telemetry</span></div>
            </a>
            <a href="#" className="flex items-center justify-between px-3 py-2 rounded text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors text-xs border-l-4 border-transparent">
              <div className="flex items-center gap-2"><FileText className="w-4 h-4" /><span>Reports & Briefings</span></div>
            </a>
          </nav>
        </div>
        <div className="p-2 m-1 mb-2 bg-slate-100 border border-slate-300 rounded-lg">
          <div className="flex items-center justify-between pb-1 border-b border-slate-300 mb-1">
            <span className="text-[10px] text-slate-600 uppercase font-bold">Data Engine</span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              <span className="text-[10px] text-slate-900 font-semibold">ONLINE</span>
            </div>
          </div>
          <div className="space-y-1 text-xs text-slate-600">
            <div className="flex justify-between"><span>Telemetry Feed:</span><span className="text-[10px] text-slate-900 font-bold">99.8%</span></div>
            <div className="flex justify-between"><span>Hydro Model:</span><span className="text-[10px] text-slate-900 font-bold">v1.2 Active</span></div>
            <div className="flex justify-between"><span>Model Run:</span><span className="text-[10px] text-slate-900 font-bold">14:24</span></div>
          </div>
          <div className="mt-2 pt-1 border-t border-slate-300 flex items-center justify-between">
            <span className="text-[10px] text-slate-600 font-bold">EOC Hotline:</span>
            <span className="text-xs text-slate-900 font-bold">1077</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="pl-[232px]">
        <main className="w-full pt-14 bg-slate-50 min-h-screen flex flex-col">
          <div className="flex flex-col w-full">
            {/* Header & Breadcrumb */}
            <div className="px-4 pt-3 pb-2 bg-white shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 pb-2">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-600 font-bold">
                    <span>Operational Grid</span><span>/</span>
                    <span>Coastal Sector DK-04</span><span>/</span>
                    <span className="text-red-600 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                      Tier-1 Hydro Watch
                    </span>
                  </div>
                  <h1 className="text-2xl text-slate-900 font-semibold tracking-tight mt-0.5">Critical Facilities</h1>
                  <p className="text-sm text-slate-600">7 facilities in flood risk zones · Mangaluru Emergency Sector</p>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded shadow-sm">
                    <span className="text-[10px] text-slate-600 uppercase font-bold">ICU Capacity</span>
                    <span className="text-lg text-slate-900 font-bold">142 Beds</span>
                    <span className="px-1 py-0.5 bg-red-600 text-white rounded text-[9px] uppercase font-bold">Active Watch</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded shadow-sm">
                    <span className="text-[10px] text-slate-600 uppercase font-bold">Shelter Avail.</span>
                    <span className="text-lg text-slate-900 font-bold">1,850 Cap</span>
                    <span className="text-[10px] text-slate-600 font-bold">82% Operational</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 bg-slate-900 text-white rounded shadow-sm">
                    <RefreshCw className="w-4 h-4" />
                    <span className="text-[10px] uppercase tracking-wider font-bold">Telemetry Live · Delta 12s</span>
                  </div>
                </div>
              </div>
              {/* Filters */}
              <div className="pt-2 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 xl:pb-0">
                  <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap font-semibold ${filter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    <span>All Facilities</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${filter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-300 text-slate-900'}`}>7</span>
                  </button>
                  <button onClick={() => setFilter('medical')} className={`px-3 py-1.5 rounded text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap font-semibold ${filter === 'medical' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    <span>Hospitals & Medical</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${filter === 'medical' ? 'bg-slate-800 text-white' : 'bg-slate-300 text-slate-900'}`}>2</span>
                  </button>
                  <button onClick={() => setFilter('fire')} className={`px-3 py-1.5 rounded text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap font-semibold ${filter === 'fire' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    <span>Fire & Rescue</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${filter === 'fire' ? 'bg-slate-800 text-white' : 'bg-slate-300 text-slate-900'}`}>1</span>
                  </button>
                  <button onClick={() => setFilter('security')} className={`px-3 py-1.5 rounded text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap font-semibold ${filter === 'security' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    <span>Police & Security</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${filter === 'security' ? 'bg-slate-800 text-white' : 'bg-slate-300 text-slate-900'}`}>1</span>
                  </button>
                  <button onClick={() => setFilter('shelter')} className={`px-3 py-1.5 rounded text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap font-semibold ${filter === 'shelter' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    <span>Schools & Shelters</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${filter === 'shelter' ? 'bg-slate-800 text-white' : 'bg-slate-300 text-slate-900'}`}>2</span>
                  </button>
                  <button onClick={() => setFilter('utilities')} className={`px-3 py-1.5 rounded text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap font-semibold ${filter === 'utilities' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    <span>Power & Utilities</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${filter === 'utilities' ? 'bg-slate-800 text-white' : 'bg-slate-300 text-slate-900'}`}>1</span>
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <div className="relative flex-1 sm:w-80">
                    <Search className="absolute left-2.5 top-2 w-4 h-4 text-slate-600" />
                    <input
                      type="text"
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 rounded text-sm text-slate-900 placeholder-slate-600 focus:outline-none focus:bg-white shadow-sm"
                      placeholder="Search facility name, type, or zone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 px-2 py-1.5 rounded shadow-sm">
                    <ArrowUpDown className="w-4 h-4 text-slate-600" />
                    <select
                      className="bg-transparent text-[10px] text-slate-900 focus:outline-none cursor-pointer font-bold"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                    >
                      <option value="severity">Sort by: Severity then Onset</option>
                      <option value="onset">Sort by: Estimated Onset</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-0 h-[calc(100vh-188px)] overflow-hidden">
              <section className="lg:col-span-5 xl:col-span-4 h-full overflow-y-auto p-3 space-y-2 bg-slate-50">
                {filteredFacilities.map((facility) => {
                  const Icon = facility.icon;
                  const isActive = activeFacility === facility.id;
                  return (
                    <article
                      key={facility.id}
                      className={`bg-white rounded shadow-sm hover:shadow-md transition-all relative cursor-pointer ${isActive ? 'ring-1 ring-slate-300 shadow-md' : ''}`}
                      onClick={() => setActiveFacility(facility.id)}
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${facility.borderColor}`}></div>
                      <div className="pl-4 pr-3.5 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <Icon className={`${facility.iconColor} w-4 h-4`} />
                              <h2 className="text-base text-slate-900 font-bold tracking-tight">{facility.name}</h2>
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5">{facility.desc}</p>
                          </div>
                          {facility.severity === 'critical' && (
                            <div className="flex flex-col items-end gap-1">
                              <span className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold tracking-wider flex items-center gap-1 shadow-sm">
                                <AlertTriangle className="w-3 h-3" /> CRITICAL
                              </span>
                              <span className="text-[10px] text-red-600 font-semibold">{facility.timeText}</span>
                            </div>
                          )}
                          {facility.severity === 'high' && (
                            <span className="px-2 py-0.5 bg-slate-300 text-slate-900 rounded text-[10px] font-bold tracking-wider flex items-center gap-1">
                              <ArrowUp className="w-3 h-3 text-slate-900" /> HIGH
                            </span>
                          )}
                          {facility.severity === 'elevated' && (
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-[10px] font-bold tracking-wider flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-slate-500"></span> ELEVATED
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-3 p-2 bg-slate-100 rounded">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-600 uppercase font-bold">Expected Depth</span>
                            <span className={`text-lg font-bold tracking-tight ${facility.severity === 'critical' ? 'text-red-600' : 'text-slate-900'}`}>{facility.depth}</span>
                            {facility.depthDesc && <span className="text-xs text-slate-600">{facility.depthDesc}</span>}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-600 uppercase font-bold">Est. Onset</span>
                            <span className="text-lg text-slate-900 font-bold">{facility.onset} hrs</span>
                            {facility.timeText && <span className="text-xs text-red-600 font-medium">({facility.timeText})</span>}
                          </div>
                          <div className="flex flex-col">
                            {facility.peak ? (
                              <>
                                <span className="text-[10px] text-slate-600 uppercase font-bold">Peak Window</span>
                                <span className="text-lg text-slate-900 font-bold">{facility.peak}</span>
                                <span className="text-xs text-slate-600">{facility.peakDesc}</span>
                              </>
                            ) : (
                              <>
                                <span className="text-[10px] text-slate-600 uppercase font-bold">{facility.capacity ? 'Cap Intake' : 'Access Corridor'}</span>
                                {facility.capacity ? (
                                  <p className="text-lg text-slate-900 font-bold">{facility.capacity}</p>
                                ) : (
                                  <p className={`text-[10px] font-bold px-1 py-0.5 rounded text-center mt-1 ${facility.routeStatus === 'Route Clear' ? 'text-sky-400 bg-sky-900' : 'text-red-900 bg-red-100'}`}>
                                    {facility.routeStatus === 'Route Clear' ? '✓ Route Clear' : '⚠️ At Risk'}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {facility.routeDesc && (
                          <div className="mt-2.5 p-2 bg-red-100 text-red-900 rounded flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="text-red-600 w-4 h-4" />
                              <span className="text-xs font-bold">⚠️ Potentially Affected</span>
                            </div>
                            <span className="text-xs">{facility.routeDesc}</span>
                          </div>
                        )}

                        <div className="mt-2.5 text-slate-600 text-xs leading-relaxed">
                          <span className="text-[10px] text-slate-900 uppercase font-bold tracking-wider">Rationale: </span>
                          {facility.rationale}
                        </div>

                        {facility.contingency && (
                          <div className="mt-2.5 p-2 bg-slate-200 rounded flex items-start gap-2">
                            <Shield className="text-slate-600 w-4 h-4 mt-0.5" />
                            <div className="text-xs text-slate-900">
                              <strong className="text-[10px] uppercase text-slate-600">Active Contingency: </strong>
                              {facility.contingency}
                            </div>
                          </div>
                        )}

                        <div className="mt-3 flex items-center justify-end gap-2 pt-2">
                          {facility.severity === 'critical' && (
                            <button
                              onClick={() => alert(`[EOC DEPLOYMENT ORDER ACTIVATED]\n\nDispatching Mobile Hydrologic Inflatable Barrier Units (Pack 4) to: ${facility.name}.\nEstimated Deployment ETA: 8 minutes.\nCrew Frequency: 156.800 MHz.`)}
                              className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-800 transition-colors flex items-center gap-1.5 shadow-sm"
                            >
                              <Siren className="w-4 h-4" /> Deploy Flood Barriers
                            </button>
                          )}
                          <button className="px-3 py-1.5 bg-slate-300 text-slate-900 rounded text-xs font-semibold hover:bg-slate-200 transition-colors flex items-center gap-1">
                            {facility.severity === 'critical' ? <Route className="w-4 h-4" /> : null}
                            {facility.severity === 'critical' ? 'View Route Status' : 'Focus Geometry'}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </section>

              <section className="lg:col-span-5 xl:col-span-6 h-full flex flex-col bg-slate-200 relative overflow-hidden">
                <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm p-1.5 rounded shadow-md pointer-events-auto">
                    <span className="text-[10px] text-slate-600 px-2 uppercase font-bold">Layers:</span>
                    <button
                      onClick={() => toggleLayer('routes')}
                      className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors ${layers.routes ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}
                    >
                      <Route className="w-3.5 h-3.5" /> Evacuation Corridors
                    </button>
                    <button
                      onClick={() => toggleLayer('contours')}
                      className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors ${layers.contours ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}
                    >
                      <Waves className="w-3.5 h-3.5" /> Terrain Contours
                    </button>
                    <button
                      onClick={() => toggleLayer('hydro')}
                      className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors ${layers.hydro ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}
                    >
                      <Waves className="w-3.5 h-3.5" /> Hydro Depth Model
                    </button>
                  </div>
                  <div className="bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded shadow-md flex items-center gap-3 pointer-events-auto">
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] text-slate-900 font-bold tracking-tight">12°54'18"N · 74°49'42"E</span>
                      <span className="text-[9px] text-slate-600">DATUM: WGS84 · EPSG:4326</span>
                    </div>
                    <div className="h-5 w-px bg-slate-300"></div>
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] text-slate-600 uppercase font-bold">Scale</span>
                      <div className="w-12 h-1 bg-slate-900 relative mt-0.5">
                        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[9px] text-slate-900 font-semibold">500m</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full flex-1 relative bg-slate-100 overflow-hidden select-none">
                  <div style={{ transform: `scale(${mapZoom})`, transformOrigin: 'center center', transition: 'transform 0.25s ease-out' }} className="w-full h-full">
                    <svg className="w-full h-full object-cover" viewBox="0 0 1000 700" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id="coastalGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#d5e0f8" strokeWidth="0.75" strokeDasharray="2 2" />
                        </pattern>
                        <linearGradient id="depthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#ba1a1a" stopOpacity="0.25" />
                          <stop offset="50%" stopColor="#545f73" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#d5e0f8" stopOpacity="0.3" />
                        </linearGradient>
                        <linearGradient id="seaWater" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#d5e0f8" />
                          <stop offset="100%" stopColor="#bcc7de" />
                        </linearGradient>
                      </defs>

                      <path d="M 0,0 L 260,0 Q 240,150 250,280 Q 260,420 220,530 Q 180,620 210,700 L 0,700 Z" fill="url(#seaWater)" opacity="0.8" />
                      <path d="M 1000,140 Q 650,150 480,180 Q 340,210 270,270 Q 245,330 250,420 Q 255,510 320,570 Q 450,600 680,630 L 700,680 Q 420,650 280,610 Q 210,540 215,410 Q 220,310 260,240 Q 340,170 510,140 Q 700,110 1000,100 Z" fill="#93ccff" opacity="0.65" />
                      <path d="M 1000,580 Q 750,560 550,580 Q 380,600 240,650 L 220,700 L 1000,700 Z" fill="#93ccff" opacity="0.6" />
                      
                      <rect x="250" y="0" width="750" height="700" fill="url(#coastalGrid)" opacity="0.4" />

                      {layers.contours && (
                        <g id="terrainContoursLayer" opacity="0.7">
                          <path d="M 280,0 Q 320,180 340,300 Q 360,460 310,600 L 330,700" fill="none" stroke="#76777d" strokeWidth="1" strokeDasharray="4 3" />
                          <path d="M 390,0 Q 430,220 460,340 Q 480,500 420,700" fill="none" stroke="#76777d" strokeWidth="1.2" strokeDasharray="6 4" />
                          <path d="M 520,0 Q 560,250 580,380 Q 610,540 570,700" fill="none" stroke="#76777d" strokeWidth="1.5" strokeDasharray="8 4" />
                          <text x="345" y="120" fill="#545f73" fontSize="9" fontWeight="600" fontFamily="Inter">+2.0m</text>
                          <text x="465" y="160" fill="#545f73" fontSize="9" fontWeight="600" fontFamily="Inter">+5.0m</text>
                          <text x="585" y="200" fill="#545f73" fontSize="9" fontWeight="600" fontFamily="Inter">+10.0m</text>
                        </g>
                      )}

                      {layers.routes && (
                        <g id="evacuationRoutesLayer">
                          <path d="M 440,0 L 410,180 L 390,260 L 380,360 L 410,520 L 430,700" fill="none" stroke="#131b2e" strokeWidth="3.5" />
                          <path d="M 330,120 L 320,240 L 300,380 L 340,490 L 380,520" fill="none" stroke="#188ace" strokeWidth="2.5" strokeDasharray="6 3" />
                          <path d="M 405,220 L 395,290" fill="none" stroke="#ba1a1a" strokeWidth="5" strokeLinecap="round" strokeDasharray="2 3" />
                          <text x="415" y="270" fill="#ba1a1a" fontSize="9" fontWeight="700" fontFamily="Inter">NH-66 BREACH SPOT (14:50)</text>
                        </g>
                      )}
                      
                      <g className="cursor-pointer" onClick={() => setActiveFacility('city-hospital')}>
                        <circle cx="370" cy="250" fill="#ba1a1a" fillOpacity="0.25" r="28">
                          <animate attributeName="r" values="16;34;16" dur="2.2s" repeatCount="indefinite" />
                          <animate attributeName="fill-opacity" values="0.4;0.05;0.4" dur="2.2s" repeatCount="indefinite" />
                        </circle>
                        <circle cx="370" cy="250" r="16" fill="#ba1a1a" stroke="#ffffff" strokeWidth="2.5" />
                        <path d="M 367,243 L 373,243 L 373,247 L 377,247 L 377,253 L 373,253 L 373,257 L 367,257 L 367,253 L 363,253 L 363,247 L 367,247 Z" fill="#ffffff" />
                        <g transform="translate(395, 175)">
                          <rect x="0" y="0" width="230" height="100" rx="4" fill="#ffffff" stroke="#ba1a1a" strokeWidth="1.5" />
                          <rect x="0" y="0" width="230" height="22" rx="4" fill="#ba1a1a" />
                          <text x="8" y="15" fill="#ffffff" fontSize="10" fontWeight="700" letterSpacing="0.5" fontFamily="Inter">CITY HOSPITAL · SIMULATION ACTIVE</text>
                          <text x="8" y="38" fill="#191c1e" fontSize="11" fontWeight="700" fontFamily="Inter">Onset in 14 min (14:40)</text>
                          <text x="8" y="52" fill="#545f73" fontSize="10" fontFamily="Inter">Predicted Crest: 0.62m at 15:15</text>
                          <rect x="8" y="60" width="214" height="20" rx="2" fill="#ffdad6" />
                          <text x="14" y="74" fill="#93000a" fontSize="9" fontWeight="700" fontFamily="Inter">NH-66 Cutoff @ 14:50 · Reroute via Beach Rd</text>
                          <text x="8" y="92" fill="#188ace" fontSize="9" fontWeight="600" fontFamily="Inter">Click to deploy primary barrier teams →</text>
                        </g>
                      </g>

                      <g className="cursor-pointer" transform="translate(350, 190)" onClick={() => setActiveFacility('panambur-fire')}>
                        <circle cx="0" cy="0" r="14" fill="#131b2e" stroke="#ffffff" strokeWidth="2" />
                        <rect x="18" y="-12" width="130" height="24" rx="2" fill="#ffffff" stroke="#e0e3e5" strokeWidth="1" />
                        <text x="24" y="4" fill="#191c1e" fontSize="10" fontWeight="700" fontFamily="Inter">Panambur Fire Stn</text>
                      </g>

                    </svg>
                  </div>

                  {/* Legends */}
                  <div className="absolute bottom-16 left-3 bg-white/95 backdrop-blur-sm p-2.5 rounded shadow-md z-20 space-y-1.5 text-[10px]">
                    <div className="font-bold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-300">Facility Categorization</div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="w-3.5 h-3.5 rounded-full bg-red-600 flex items-center justify-center text-white text-[9px] font-bold">+</span>
                      <span>Hospital / Medical Facility</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="w-3.5 h-3.5 rounded-full bg-slate-900 flex items-center justify-center text-white text-[9px] font-bold">▲</span>
                      <span>Fire & Emergency Stations</span>
                    </div>
                  </div>

                  <div className="absolute bottom-16 right-3 flex flex-col gap-1 z-20">
                    <button onClick={() => setMapZoom(mapZoom * 1.15)} className="w-8 h-8 bg-white hover:bg-slate-100 text-slate-900 rounded shadow-md flex items-center justify-center font-bold">
                      <Plus className="w-4 h-4" />
                    </button>
                    <button onClick={() => setMapZoom(mapZoom * 0.85)} className="w-8 h-8 bg-white hover:bg-slate-100 text-slate-900 rounded shadow-md flex items-center justify-center font-bold">
                      <Minus className="w-4 h-4" />
                    </button>
                    <button onClick={() => setMapZoom(1)} className="w-8 h-8 bg-white hover:bg-slate-100 text-slate-900 rounded shadow-md flex items-center justify-center font-bold">
                      <Maximize className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <footer className="h-14 bg-white px-3 flex items-center justify-between z-30 shadow-md">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span className="p-1.5 bg-red-100 text-red-600 rounded flex items-center justify-center animate-pulse">
                      <Route className="w-5 h-5" />
                    </span>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-red-600 font-bold uppercase tracking-wider">Access Advisory DK-ROUTE-01:</span>
                        <span className="text-xs text-slate-900 font-semibold truncate">
                          Access corridor NH-66 to City Hospital at risk in 24 min — Alternative bypass via Beach Road recommended.
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-600">EOC Traffic Command: Traffic diverted at Panambur Junction Circle</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => alert(`[RADIO & POLICE NOTIFICATION SENT]\n\nAdvisory DK-ROUTE-01 transmitted to Mangaluru Traffic HQ and public SMS alert corridor for NH-66 North spur diversion.`)} className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-blue-900 transition-colors flex items-center gap-1 shadow-sm">
                      <RadioTower className="w-4 h-4" /> Transmit Route Advisory
                    </button>
                  </div>
                </footer>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
