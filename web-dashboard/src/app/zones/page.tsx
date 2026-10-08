"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Shield, 
  Droplets, 
  Bell, 
  Search, 
  TableProperties, 
  Columns, 
  Download, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle, 
  ChevronRight,
  Map as MapIcon, 
  Wrench, 
  Hospital, 
  Zap, 
  GraduationCap,
  CloudRain,
  Waves,
  Radio,
  FileText,
  ExternalLink
} from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TopHeader } from "@/components/dashboard/TopHeader";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { ShortcutsModal } from "@/components/dashboard/ShortcutsModal";
import { ScenarioModal } from "@/components/dashboard/ScenarioModal";
import { apiClient } from "@/lib/api/client";

interface ZoneItem {
  id: string;
  name: string;
  locality: string;
  rank: number;
  severity: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'LOW';
  probability: number;
  depth: string;
  onset: string;
  peak: string;
  pop: string;
  facil: number;
  rationale?: string;
  actionText?: string;
}

const ZONES_DATA: ZoneItem[] = [
  { 
    id: 'B', 
    name: 'Zone B', 
    locality: 'Panambur Coast', 
    rank: 1, 
    severity: 'CRITICAL', 
    probability: 84.7, 
    depth: '0.31–0.71 m', 
    onset: '14:30', 
    peak: '15:10', 
    pop: '4,820', 
    facil: 3,
    rationale: 'Heavy localized precipitation coinciding with high spring tide over low-lying coastal terrain.',
    actionText: 'Immediate deploy: Verify City Hospital access corridor via NH-66 bypass. Deploy 2 high-capacity dewatering pumps to Sluice Gate 4.'
  },
  { 
    id: 'F', 
    name: 'Zone F', 
    locality: 'Tannirbhavi', 
    rank: 2, 
    severity: 'HIGH', 
    probability: 72.0, 
    depth: '0.22–0.55 m', 
    onset: '14:50', 
    peak: '15:30', 
    pop: '3,960', 
    facil: 2,
    rationale: 'Estuary funneling effect amplifying tide surges along narrow rivermouth channels.',
    actionText: 'Deploy sandbags to Tannirbhavi Coast Guard approach road. Secure fishing vessel moorings.'
  },
  { 
    id: 'C', 
    name: 'Zone C', 
    locality: 'Surathkal Coastal', 
    rank: 3, 
    severity: 'HIGH', 
    probability: 61.0, 
    depth: '0.18–0.46 m', 
    onset: '15:05', 
    peak: '15:45', 
    pop: '2,410', 
    facil: 1,
    rationale: 'High velocity overland runoff intersecting coastal dune swale barriers.',
    actionText: 'Monitor Surathkal 110kV Substation drainage perimeter trenches. Pre-stage isolation breakers.'
  },
  { 
    id: 'H', 
    name: 'Zone H', 
    locality: 'Bengre Spit', 
    rank: 4, 
    severity: 'ELEVATED', 
    probability: 38.0, 
    depth: '0.08–0.25 m', 
    onset: '15:40', 
    peak: '16:15', 
    pop: '1,650', 
    facil: 1,
    rationale: 'Tidal backwater pooling around low perimeter fishing jetty boardwalks.',
    actionText: 'Alert Bengre Community Health Center staff. Stage inflatable rescue zodiac at North Jetty.'
  },
  { 
    id: 'A', 
    name: 'Zone A', 
    locality: 'Ullal Estuary', 
    rank: 5, 
    severity: 'ELEVATED', 
    probability: 33.0, 
    depth: '0.05–0.20 m', 
    onset: '15:50', 
    peak: '16:30', 
    pop: '1,120', 
    facil: 0,
    rationale: 'Moderate tidal swell backflow reaching agricultural buffer embankments.',
    actionText: 'Close sluice gate A-2 to prevent saltwater intrusion into urban stormwater drains.'
  },
  { 
    id: 'D', 
    name: 'Zone D', 
    locality: 'Kulur Bridge Sector', 
    rank: 6, 
    severity: 'LOW', 
    probability: 18.2, 
    depth: '< 0.10 m', 
    onset: '16:15', 
    peak: '17:00', 
    pop: '840', 
    facil: 0,
    rationale: 'Bridge abutment stormwater clearing adequately with nominal current velocity.',
    actionText: 'Maintain automated sensor telemetry watch. No immediate deployment needed.'
  },
  { 
    id: 'E', 
    name: 'Zone E', 
    locality: 'Baikampady Industrial', 
    rank: 7, 
    severity: 'LOW', 
    probability: 14.5, 
    depth: '< 0.10 m', 
    onset: '16:30', 
    peak: '17:15', 
    pop: '1,450', 
    facil: 1,
    rationale: 'Industrial park stormwater drains functioning at 45% capacity.',
    actionText: 'Routine inspection of Baikampady storm culvert outlet.'
  },
  { 
    id: 'G', 
    name: 'Zone G', 
    locality: 'Kodialbail Urban', 
    rank: 8, 
    severity: 'LOW', 
    probability: 11.0, 
    depth: 'Trace', 
    onset: '17:00', 
    peak: '17:40', 
    pop: '3,200', 
    facil: 0,
    rationale: 'Elevated terrain buffer absorbing runoff without surface pooling.',
    actionText: 'Keep Kodialbail Relief Center in standby readiness.'
  },
  { 
    id: 'I', 
    name: 'Zone I', 
    locality: 'Bolar Ferry Point', 
    rank: 9, 
    severity: 'LOW', 
    probability: 8.4, 
    depth: 'Trace', 
    onset: '17:20', 
    peak: '18:00', 
    pop: '910', 
    facil: 0,
    rationale: 'Ferry slipway elevated above predicted peak high tide mark.',
    actionText: 'Standard maritime advisory issued to ferry operators.'
  },
  { 
    id: 'J', 
    name: 'Zone J', 
    locality: 'Kadri Hills Escarpment', 
    rank: 10, 
    severity: 'LOW', 
    probability: 5.1, 
    depth: 'Nominal', 
    onset: '--:--', 
    peak: '--:--', 
    pop: '420', 
    facil: 0,
    rationale: 'High natural elevation (32m AMSL) fully isolated from tidal surge.',
    actionText: 'Designated upland staging assembly point.'
  },
];

export default function ZonesPage() {
  const [zonesList, setZonesList] = useState<ZoneItem[]>(ZONES_DATA);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('B');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortKey, setSortKey] = useState<string>('rank');

  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [scenarioModalOpen, setScenarioModalOpen] = useState(false);

  // Active sync with backend replay simulation
  React.useEffect(() => {
    let mounted = true;
    console.info('[ZonesPage] Fetching simulation replay zones from API...');
    apiClient
      .fetchReplayEvent('mangaluru-historical-2018')
      .then((resp) => {
        if (mounted && resp?.success && resp.event?.timesteps) {
          const firstStep = Object.values(resp.event.timesteps)[0];
          if (firstStep?.zones && firstStep.zones.length > 0) {
            const mapped: ZoneItem[] = firstStep.zones.map((z, idx) => {
              const fallback = ZONES_DATA.find((item) => item.id === z.id);
              return {
                id: z.id,
                name: z.name,
                locality: z.locality,
                rank: z.rank || idx + 1,
                severity: z.severity,
                probability: z.probability,
                depth: z.depth,
                onset: z.onset,
                peak: z.peak,
                pop: (z.population || 1000).toLocaleString(),
                facil: z.facilitiesCount || (z.facilities?.length ?? 0),
                rationale: fallback?.rationale || z.summaryExplanation,
                actionText: fallback?.actionText,
              };
            });
            setZonesList(mapped);
          }
        }
      })
      .catch((err) => {
        console.warn('[ZonesPage] API fetch fallback to defaults:', err);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const selectedZone = zonesList.find((z) => z.id === selectedZoneId) || zonesList[0];

  const filteredZones = zonesList
    .filter((z) => {
      if (severityFilter === 'ALL') return true;
      return z.severity === severityFilter;
    })
    .filter((z) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        z.id.toLowerCase().includes(q) ||
        z.name.toLowerCase().includes(q) ||
        z.locality.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortKey === 'rank') return a.rank - b.rank;
      if (sortKey === 'probability') return b.probability - a.probability;
      if (sortKey === 'onset') return a.onset.localeCompare(b.onset);
      if (sortKey === 'population') {
        const popA = parseInt(a.pop.replace(/,/g, ''), 10) || 0;
        const popB = parseInt(b.pop.replace(/,/g, ''), 10) || 0;
        return popB - popA;
      }
      return 0;
    });

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-100 flex flex-col font-sans antialiased text-slate-900 select-none">
      {/* Top Header */}
      <TopHeader
        onOpenShortcuts={() => setShortcutsModalOpen(true)}
        currentTime="14:26"
        isSimulation={true}
      />

      {/* Main Layout Shell */}
      <div className="flex flex-1 pt-14 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar onOpenScenario={() => setScenarioModalOpen(true)} />

        {/* Main Content Area */}
        <div className="flex-1 ml-[220px] lg:ml-[232px] flex flex-col h-[calc(100vh-3.5rem)] overflow-y-auto bg-slate-50">
          <main className="w-full flex flex-col min-h-full">
            <div className="bg-amber-50 border-b border-amber-300 px-6 py-3 text-sm text-amber-950"><strong>ILLUSTRATIVE / UNVALIDATED DATASET.</strong> This directory and its hardcoded fallback zones, example risk percentages and sensor status are not linked to a selected simulation run. <Link href="/?compare=1" className="font-bold underline">Compare real runs in Overview</Link>.</div>
            {/* Sector Header Banner */}
            <div className="px-6 py-4 bg-white border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-2xs">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5 text-xs">
                  <Link href="/" className="uppercase tracking-widest text-slate-500 font-semibold hover:text-blue-700 transition-colors">
                    Command Center
                  </Link>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-bold text-slate-900">Mangaluru Coast 12-Z Matrix</span>
                </div>
                <h1 className="text-xl lg:text-2xl text-slate-900 font-bold tracking-tight">Zones Directory</h1>
                <p className="text-xs text-slate-500">
                  <span className="font-semibold text-slate-900">12 zones monitored</span> ·
                  <span className="text-red-600 font-semibold ml-1">1 critical</span> ·
                  <span className="text-orange-600 font-semibold ml-1">2 high</span> ·
                  <span className="text-yellow-700 font-semibold ml-1">2 elevated</span> ·
                  <span className="text-sky-700 font-semibold ml-1">7 low</span> · Mangaluru Coastal Sector
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Link href={`/?zone=${selectedZone.id}`}>
                  <Button className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-xs">
                    <MapIcon className="w-4 h-4 text-sky-400" />
                    <span>View Selected ({selectedZone.name}) on Demo Map</span>
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-1.5 bg-white border-slate-200"
                  onClick={() => alert("Exporting hydrographic zones dataset: TideMesh_Zones_1426.csv")}
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  <span>Export CSV</span>
                </Button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 flex-1 max-w-md relative">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                <Input 
                  className="pl-9 h-9 bg-white border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus-visible:ring-1 focus-visible:ring-slate-900" 
                  placeholder="Search zone ID, name, or locality..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center bg-white p-0.5 rounded-md border border-slate-200 shadow-2xs">
                  {(['ALL', 'CRITICAL', 'HIGH', 'ELEVATED', 'LOW'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setSeverityFilter(lvl)}
                      className={`px-2.5 py-1 text-xs rounded transition-colors font-semibold cursor-pointer ${
                        severityFilter === lvl 
                          ? 'bg-slate-900 text-white shadow-xs' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>

                <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 uppercase font-bold text-[10px]">Sort:</span>
                  <Select value={sortKey} onValueChange={setSortKey}>
                    <SelectTrigger className="w-[180px] h-8.5 bg-white border-slate-200 text-xs">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rank">Priority Rank (Highest)</SelectItem>
                      <SelectItem value="probability">Illustrative risk % (Desc)</SelectItem>
                      <SelectItem value="onset">Onset Time (Earliest)</SelectItem>
                      <SelectItem value="population">Population Exposed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Split Content: Priority Matrix (Left) & Zone Dossier (Right) */}
            <div className="p-5 grid grid-cols-1 xl:grid-cols-12 gap-5 items-start flex-1">
              {/* Left Column: Zones Priority Matrix */}
              <div className="xl:col-span-8 bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden flex flex-col">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <TableProperties className="w-4 h-4 text-blue-700" />
                    <span className="text-xs text-slate-900 font-bold uppercase tracking-wider">Hydro-Impact Priority Matrix</span>
                    <span className="text-[11px] text-slate-400 ml-2 font-mono">(Model Run 14:24 IST)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                    <span className="text-[11px] text-slate-600 uppercase font-bold">Tide Rising +1.42m</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/75">
                      <TableRow className="uppercase text-[11px] text-slate-500 font-bold border-b border-slate-200">
                        <TableHead className="text-center w-12 py-2">Rank</TableHead>
                        <TableHead className="min-w-[140px] py-2">Zone & Locality</TableHead>
                        <TableHead className="min-w-[100px] py-2">Tier Alert</TableHead>
                        <TableHead className="min-w-[120px] py-2">Illustrative risk %</TableHead>
                        <TableHead className="min-w-[95px] py-2">Depth Range</TableHead>
                        <TableHead className="min-w-[75px] py-2">Onset</TableHead>
                        <TableHead className="min-w-[75px] py-2">Peak</TableHead>
                        <TableHead className="min-w-[100px] py-2">Pop. Exposed</TableHead>
                        <TableHead className="text-center w-14 py-2">Facil.</TableHead>
                        <TableHead className="text-right pr-4 py-2">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="text-xs">
                      {filteredZones.map((zone) => {
                        let alertColor = '';
                        let badgeBg = '';
                        let rowStyle = '';
                        let icon = null;

                        switch(zone.severity) {
                          case 'CRITICAL':
                            alertColor = 'text-red-700 border-red-300';
                            badgeBg = 'bg-red-50';
                            rowStyle = zone.id === selectedZoneId 
                              ? 'border-l-4 border-l-red-600 bg-red-50/30' 
                              : 'border-l-4 border-l-red-600 hover:bg-slate-50';
                            icon = <AlertCircle className="w-3 h-3 text-red-600" />;
                            break;
                          case 'HIGH':
                            alertColor = 'text-orange-700 border-orange-300';
                            badgeBg = 'bg-orange-50';
                            rowStyle = zone.id === selectedZoneId 
                              ? 'border-l-4 border-l-orange-500 bg-orange-50/20' 
                              : 'border-l-4 border-l-transparent hover:bg-slate-50';
                            icon = <AlertTriangle className="w-3 h-3 text-orange-600" />;
                            break;
                          case 'ELEVATED':
                            alertColor = 'text-yellow-800 border-yellow-300';
                            badgeBg = 'bg-yellow-50';
                            rowStyle = zone.id === selectedZoneId 
                              ? 'border-l-4 border-l-yellow-500 bg-yellow-50/20' 
                              : 'border-l-4 border-l-transparent hover:bg-slate-50';
                            icon = <Info className="w-3 h-3 text-yellow-600" />;
                            break;
                          case 'LOW':
                            alertColor = 'text-sky-700 border-sky-300';
                            badgeBg = 'bg-sky-50';
                            rowStyle = zone.id === selectedZoneId 
                              ? 'border-l-4 border-l-sky-500 bg-sky-50/20' 
                              : 'border-l-4 border-l-transparent hover:bg-slate-50';
                            icon = <CheckCircle className="w-3 h-3 text-sky-600" />;
                            break;
                        }

                        return (
                          <TableRow 
                            key={zone.id} 
                            onClick={() => setSelectedZoneId(zone.id)}
                            className={`${rowStyle} cursor-pointer transition-colors border-b border-slate-100`}
                          >
                            <TableCell className="text-center py-2.5">
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${
                                zone.rank === 1 ? 'bg-red-600 text-white' : zone.rank <= 3 ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'
                              }`}>
                                #{zone.rank}
                              </span>
                            </TableCell>
                            <TableCell className="py-2.5">
                              <div className="font-bold text-slate-900">{zone.name}</div>
                              <div className="text-[11px] text-slate-500">{zone.locality}</div>
                            </TableCell>
                            <TableCell className="py-2.5">
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border ${badgeBg} ${alertColor} text-[10px] font-bold`}>
                                {icon} {zone.severity}
                              </span>
                            </TableCell>
                            <TableCell className="py-2.5">
                              <div className="flex items-center justify-between font-bold text-slate-900 mb-0.5 text-xs">
                                <span>{zone.probability}%</span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className={`h-1.5 rounded-full ${
                                    zone.severity === 'CRITICAL' ? 'bg-red-600' : 
                                    zone.severity === 'HIGH' ? 'bg-orange-600' : 
                                    zone.severity === 'ELEVATED' ? 'bg-yellow-600' : 'bg-sky-600'
                                  }`} 
                                  style={{ width: `${zone.probability}%` }}
                                />
                              </div>
                            </TableCell>
                            <TableCell className="py-2.5 font-mono text-xs font-medium text-slate-900">{zone.depth}</TableCell>
                            <TableCell className={`py-2.5 font-mono text-xs font-bold ${zone.severity === 'CRITICAL' ? 'text-red-600' : zone.severity === 'HIGH' ? 'text-orange-600' : 'text-slate-600'}`}>
                              {zone.onset}
                            </TableCell>
                            <TableCell className="py-2.5 font-mono text-xs text-slate-500">{zone.peak}</TableCell>
                            <TableCell className="py-2.5">
                              <span className="font-semibold text-slate-900">{zone.pop}</span> <span className="text-[10px] text-slate-400">est.</span>
                            </TableCell>
                            <TableCell className="text-center py-2.5">
                              <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-xs font-semibold ${
                                zone.facil > 0 
                                  ? (zone.severity === 'CRITICAL' ? 'text-red-700 bg-red-100 border border-red-200 font-bold' : 'text-slate-900 bg-slate-100') 
                                  : 'text-slate-400'
                              }`}>
                                {zone.facil}
                              </span>
                            </TableCell>
                            <TableCell className="text-right pr-4 py-2.5">
                              <Button 
                                variant={zone.id === selectedZoneId ? 'default' : 'ghost'} 
                                size="sm" 
                                className={`h-6 px-2 text-xs font-semibold ${
                                  zone.id === selectedZoneId ? 'bg-slate-900 text-white' : 'text-blue-700 hover:bg-slate-200'
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedZoneId(zone.id);
                                }}
                              >
                                {zone.id === selectedZoneId ? 'Active' : 'Inspect'} <ChevronRight className="w-3 h-3 ml-0.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span>Showing {filteredZones.length} of 10 configured operational sectors</span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1 text-slate-900">
                      <Wrench className="w-3.5 h-3.5 text-slate-500" /> Hydro Calibration: 98.4%
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">Click any row to view its live dossier</div>
                </div>
              </div>

              {/* Right Column: Dynamic Zone Dossier for selectedZone */}
              <div className="xl:col-span-4 flex flex-col gap-4">
                <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden flex flex-col">
                  {/* Dossier Header */}
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapIcon className="w-4 h-4 text-blue-700" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Zone Dossier: {selectedZone.name}
                      </span>
                    </div>
                    <Badge 
                      variant="destructive" 
                      className={`text-[10px] font-bold px-1.5 py-0.5 h-auto leading-none border ${
                        selectedZone.severity === 'CRITICAL' 
                          ? 'bg-red-100 text-red-700 border-red-300' 
                          : selectedZone.severity === 'HIGH'
                          ? 'bg-orange-100 text-orange-700 border-orange-300'
                          : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                      }`}
                    >
                      {selectedZone.severity}
                    </Badge>
                  </div>

                  <div className="p-4 flex flex-col gap-3.5">
                    {/* Simulated Map Snapshot */}
                    <div className="relative w-full h-44 bg-slate-900 rounded-lg overflow-hidden border border-slate-200">
                      <div className="w-full h-full bg-cover bg-center opacity-70" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCN-KPbU3UTNcMz7jMjoiYE-fERM1S8zj1LNt_L6KMUtU9rzWRHCkGMweipes9fs192uTISvmH4FBHtotx4Kp2OXS9MW4gAnAt-erNkCwv0BdrLmPUvjX8jKKeXxrXnKU9j3YSqJCn3mLSy5knGz-ryREKztvzT97jbQSIl7gLQVwx0ke2vyIEqBb2weKk_3MfNZdvbll9u5WJQfLBi0hbEZwA6ckbQg1mxyMo3JXo')" }}></div>
                      <div className="absolute inset-0 bg-slate-900/40 pointer-events-none"></div>

                      <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm px-2 py-0.5 rounded border border-slate-700 text-[10px] font-mono text-white">
                        {selectedZone.name} · {selectedZone.locality}
                      </div>

                      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-sm px-2 py-0.5 rounded border border-slate-700 text-[10px] text-white font-medium">
                        <Waves className="w-3 h-3 text-sky-400" />
                        <span>Depth: {selectedZone.depth}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-amber-300">Onset: {selectedZone.onset}</span>
                      </div>
                    </div>

                    {/* Inundation Drivers */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Primary Inundation Drivers</span>
                        <span className="text-xs font-mono text-slate-900 font-bold">Risk: {selectedZone.probability}%</span>
                      </div>
                      <div className="space-y-1.5">
                        <div>
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="text-slate-800 font-medium flex items-center gap-1 text-[11px]"><CloudRain className="w-3 h-3 text-slate-400" /> Heavy Rainfall</span>
                            <span className="font-mono font-bold text-slate-900 text-[11px]">41%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '41%' }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="text-slate-800 font-medium flex items-center gap-1 text-[11px]"><Waves className="w-3 h-3 text-slate-400" /> High Spring Tide</span>
                            <span className="font-mono font-bold text-slate-900 text-[11px]">29%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '29%' }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="text-slate-800 font-medium flex items-center gap-1 text-[11px]"><MapIcon className="w-3 h-3 text-slate-400" /> Low Coast Elevation</span>
                            <span className="font-mono font-bold text-slate-900 text-[11px]">19%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '19%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Prescribed Action */}
                    <div className="p-2.5 bg-red-50 border border-red-200 rounded-md flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-red-700 text-xs font-bold uppercase tracking-wide">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                        <span>Prescribed Action</span>
                      </div>
                      <p className="text-xs text-red-900 font-medium leading-relaxed">
                        {selectedZone.actionText || 'Monitor zone telemetry and prepare rapid barrier deployment.'}
                      </p>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="p-2 bg-slate-50 rounded border border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Pop. Exposed</span>
                        <span className="text-base text-slate-900 font-bold block">{selectedZone.pop}</span>
                        <span className="text-[10px] text-slate-500 font-medium block">Residents in ward</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Facilities</span>
                        <span className="text-base text-slate-900 font-bold block">{selectedZone.facil} Critical</span>
                        <span className="text-[10px] text-slate-500 font-medium block">Active watch</span>
                      </div>
                    </div>

                    {/* Action Link Buttons */}
                    <div className="flex flex-col gap-2 pt-1">
                      <Link href={`/?zone=${selectedZone.id}`}>
                        <Button className="w-full h-8.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-1.5 text-xs shadow-xs">
                          <ExternalLink className="w-3.5 h-3.5" /> Open {selectedZone.name} in Live Overview
                        </Button>
                      </Link>
                      <Link href="/critical-facilities">
                        <Button variant="outline" className="w-full h-8 text-slate-700 font-medium flex items-center justify-center gap-1.5 bg-white text-xs border-slate-200">
                          <Hospital className="w-3.5 h-3.5 text-slate-500" /> Inspect Critical Facilities
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Telemetry Health Summary Card */}
                <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-[11px] uppercase font-bold text-slate-900">Illustrative Sensor Status (Unvalidated)</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-semibold">8/8 Gauges Active</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 text-center">
                    <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                      <span className="block text-[9px] text-slate-400 uppercase font-bold">Buoy 01</span>
                      <span className="font-mono text-xs font-bold text-red-600">CRIT</span>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                      <span className="block text-[9px] text-slate-400 uppercase font-bold">Buoy 02</span>
                      <span className="font-mono text-xs font-bold text-orange-600">HIGH</span>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                      <span className="block text-[9px] text-slate-400 uppercase font-bold">Rain A</span>
                      <span className="font-mono text-xs font-bold text-red-600">94mm</span>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                      <span className="block text-[9px] text-slate-400 uppercase font-bold">Doppler</span>
                      <span className="font-mono text-xs font-bold text-emerald-600">OK</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
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
