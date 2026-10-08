'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Droplets, 
  Bell, 
  User, 
  LayoutDashboard, 
  Grid, 
  Building2, 
  Siren, 
  Route, 
  Radio, 
  FileText, 
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
  RefreshCw
} from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { apiClient } from "@/lib/api/client";

const DEFAULT_ZONES = [
  { id: 'B', name: 'Zone B', locality: 'Panambur Coast', rank: 1, severity: 'CRITICAL', probability: 84.7, depth: '0.31–0.71 m', onset: '14:30', peak: '15:10', pop: '4,820', facil: 3 },
  { id: 'F', name: 'Zone F', locality: 'Tannirbhavi', rank: 2, severity: 'HIGH', probability: 72.0, depth: '0.22–0.55 m', onset: '14:50', peak: '15:30', pop: '3,960', facil: 2 },
  { id: 'C', name: 'Zone C', locality: 'Surathkal Coastal', rank: 3, severity: 'HIGH', probability: 61.0, depth: '0.18–0.46 m', onset: '15:05', peak: '15:45', pop: '2,410', facil: 1 },
  { id: 'H', name: 'Zone H', locality: 'Bengre Spit', rank: 4, severity: 'ELEVATED', probability: 38.0, depth: '0.08–0.25 m', onset: '15:40', peak: '16:15', pop: '1,650', facil: 1 },
  { id: 'A', name: 'Zone A', locality: 'Ullal Estuary', rank: 5, severity: 'ELEVATED', probability: 33.0, depth: '0.05–0.20 m', onset: '15:50', peak: '16:30', pop: '1,120', facil: 0 },
  { id: 'D', name: 'Zone D', locality: 'Kulur Bridge Sector', rank: 6, severity: 'LOW', probability: 18.2, depth: '< 0.10 m', onset: '16:15', peak: '17:00', pop: '840', facil: 0 },
  { id: 'E', name: 'Zone E', locality: 'Baikampady Industrial', rank: 7, severity: 'LOW', probability: 14.5, depth: '< 0.10 m', onset: '16:30', peak: '17:15', pop: '1,450', facil: 1 },
  { id: 'G', name: 'Zone G', locality: 'Kodialbail Urban', rank: 8, severity: 'LOW', probability: 11.0, depth: 'Trace', onset: '17:00', peak: '17:40', pop: '3,200', facil: 0 },
  { id: 'I', name: 'Zone I', locality: 'Bolar Ferry Point', rank: 9, severity: 'LOW', probability: 8.4, depth: 'Trace', onset: '17:20', peak: '18:00', pop: '910', facil: 0 },
  { id: 'J', name: 'Zone J', locality: 'Kadri Hills Escarpment', rank: 10, severity: 'LOW', probability: 5.1, depth: 'Nominal', onset: '--:--', peak: '--:--', pop: '420', facil: 0 },
];

export default function ZonesPage() {
  const [zonesList, setZonesList] = useState(DEFAULT_ZONES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    console.info('[ZonesPage] Fetching simulation replay zones from API...');
    apiClient
      .fetchReplayEvent('mangaluru-historical-2018')
      .then((resp) => {
        if (mounted && resp?.success && resp.event?.timesteps) {
          const firstStep = Object.values(resp.event.timesteps)[0];
          if (firstStep?.zones && firstStep.zones.length > 0) {
            const mapped = firstStep.zones.map((z, idx) => ({
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
            }));
            setZonesList(mapped);
          }
        }
      })
      .catch((err) => {
        console.warn('[ZonesPage] API fetch fallback to defaults:', err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900 antialiased flex flex-col">
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 z-40 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className="text-blue-700 w-5 h-5" />
            <span className="text-lg font-semibold tracking-tight text-slate-900">CoastShield AI</span>
          </div>
          <div className="h-4 w-px bg-slate-300"></div>
          <div className="flex items-center gap-1">
            <Droplets className="text-slate-900 w-4 h-4" />
            <span className="text-sm font-bold text-blue-800">Coastal Flood Event — Mangaluru Coast</span>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-100 px-2 py-1 rounded">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-700">LIVE · Updated 14:26 (2 min ago)</span>
          </div>
          <div className="bg-slate-50 px-2 py-1 rounded border border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Model: <strong className="text-slate-900 font-semibold">v1.2</strong></span>
          </div>
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-900 text-xs font-semibold">
            <Building2 className="w-4 h-4 mr-1 text-slate-500" />
            <span>EOC STATUS: FULL ACTIVATION</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center p-1.5 text-slate-500 hover:text-slate-900 cursor-pointer rounded hover:bg-slate-100 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-white text-[9px] font-bold">3</span>
          </div>
          <div className="h-4 w-px bg-slate-300"></div>
          <div className="flex items-center gap-2">
            <div className="flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-900">R. Shetty</span>
              <span className="text-[10px] text-slate-500">Duty Officer · EOC Shift 1</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center">
              <User className="text-white w-4 h-4" />
            </div>
          </div>
        </div>
      </header>

      {/* Reusable Sidebar Navigation */}
      <Sidebar />

      <div className="pl-[232px] pt-14 w-full flex-1">
        <main className="w-full h-full flex flex-col">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1">
                <span className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Operational Sector</span>
                <span className="text-slate-400 text-[12px]">•</span>
                <span className="text-xs font-bold text-slate-900">Mangaluru Coast 12-Z</span>
              </div>
              <h1 className="text-2xl text-slate-900 font-bold tracking-tight">Zones</h1>
              <p className="text-xs text-slate-500">
                <span className="font-semibold text-slate-900">12 zones monitored</span> ·
                <span className="text-red-600 font-semibold ml-1">1 critical</span> ·
                <span className="text-orange-600 font-semibold ml-1">2 high</span> ·
                <span className="text-yellow-700 font-semibold ml-1">2 elevated</span> ·
                <span className="text-sky-700 font-semibold ml-1">7 low</span> · Mangaluru Coastal Sector
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center bg-white rounded-lg border border-slate-200 p-0.5 shadow-sm">
                <button className="flex items-center gap-1 px-2 py-1 rounded bg-blue-100 text-blue-800 text-sm font-semibold">
                  <TableProperties className="w-4 h-4" />
                  <span>Dense Matrix</span>
                </button>
                <button className="flex items-center gap-1 px-2 py-1 rounded text-slate-500 hover:text-slate-900 text-sm font-semibold">
                  <Columns className="w-4 h-4" />
                  <span>Dual Mode</span>
                </button>
              </div>
              <Button variant="outline" className="flex items-center gap-1 bg-white">
                <Download className="w-4 h-4 text-slate-500" />
                <span>Export Zones Matrix (CSV)</span>
              </Button>
              <Button variant="destructive" className="flex items-center gap-1">
                <Radio className="w-4 h-4" />
                <span>Broadcast Alert</span>
              </Button>
            </div>
          </div>

          <div className="px-6 py-2 bg-white border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1 max-w-xl relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
              <Input className="pl-9 h-9 bg-slate-50" placeholder="Search zone ID, ward name, or locality..." />
              <span className="absolute right-2.5 top-2 text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-semibold">⌘K</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center bg-slate-50 p-0.5 rounded border border-slate-200">
                <button className="px-2.5 py-1 text-xs rounded bg-white font-bold text-slate-900 shadow-sm">ALL (12)</button>
                <button className="px-2.5 py-1 text-xs rounded text-red-600 hover:bg-slate-100 font-medium">CRITICAL (1)</button>
                <button className="px-2.5 py-1 text-xs rounded text-orange-600 hover:bg-slate-100 font-medium">HIGH (2)</button>
                <button className="px-2.5 py-1 text-xs rounded text-yellow-700 hover:bg-slate-100 font-medium">ELEVATED (2)</button>
                <button className="px-2.5 py-1 text-xs rounded text-sky-700 hover:bg-slate-100 font-medium">LOW (7)</button>
              </div>
              <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 uppercase font-semibold">Sort:</span>
                <Select defaultValue="rank">
                  <SelectTrigger className="w-[180px] h-9 bg-slate-50">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rank">Priority Rank (Highest)</SelectItem>
                    <SelectItem value="probability">Flood Probability (Desc)</SelectItem>
                    <SelectItem value="onset">Onset Time (Earliest)</SelectItem>
                    <SelectItem value="population">Population Exposed (Desc)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start flex-1 overflow-auto">
            <div className="xl:col-span-8 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <TableProperties className="w-4 h-4 text-blue-700" />
                  <span className="text-sm text-slate-900 font-semibold uppercase tracking-wider">Hydro-Impact Priority Matrix</span>
                  <span className="text-xs text-slate-500 ml-2">(Model Run 14:24 IST)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                  <span className="text-xs text-slate-500 uppercase font-semibold">Tide Rising +1.42m</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow className="uppercase text-xs text-slate-500 font-semibold border-b border-slate-200">
                      <TableHead className="text-center w-12 py-2">Rank</TableHead>
                      <TableHead className="min-w-[140px] py-2">Zone &amp; Locality</TableHead>
                      <TableHead className="min-w-[110px] py-2">Tier Alert</TableHead>
                      <TableHead className="min-w-[130px] py-2">Flood Prob.</TableHead>
                      <TableHead className="min-w-[100px] py-2">Depth Range</TableHead>
                      <TableHead className="min-w-[80px] py-2">Onset</TableHead>
                      <TableHead className="min-w-[80px] py-2">Peak</TableHead>
                      <TableHead className="min-w-[105px] py-2">Pop. Exposed</TableHead>
                      <TableHead className="text-center w-16 py-2">Facil.</TableHead>
                      <TableHead className="text-right pr-4 py-2">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-sm">
                    {zonesList.map((zone) => {
                      let alertColor = '';
                      let badgeBg = '';
                      let rowStyle = '';
                      let icon = null;

                      switch(zone.severity) {
                        case 'CRITICAL':
                          alertColor = 'text-red-600 border-red-300';
                          badgeBg = 'bg-red-50';
                          rowStyle = 'border-l-4 border-l-red-600 bg-red-50/20';
                          icon = <AlertCircle className="w-3 h-3" />;
                          break;
                        case 'HIGH':
                          alertColor = 'text-orange-600 border-orange-300';
                          badgeBg = 'bg-orange-50';
                          rowStyle = 'border-l-4 border-l-transparent hover:bg-slate-50';
                          icon = <AlertTriangle className="w-3 h-3" />;
                          break;
                        case 'ELEVATED':
                          alertColor = 'text-yellow-700 border-yellow-300';
                          badgeBg = 'bg-yellow-50';
                          rowStyle = 'border-l-4 border-l-transparent hover:bg-slate-50';
                          icon = <Info className="w-3 h-3" />;
                          break;
                        case 'LOW':
                          alertColor = 'text-sky-700 border-sky-300';
                          badgeBg = 'bg-sky-50';
                          rowStyle = 'border-l-4 border-l-transparent hover:bg-slate-50';
                          icon = <CheckCircle className="w-3 h-3" />;
                          break;
                      }

                      return (
                        <TableRow key={zone.id} className={`${rowStyle} cursor-pointer transition-colors border-b border-slate-100`}>
                          <TableCell className="text-center py-2.5">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${zone.rank === 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                              #{zone.rank}
                            </span>
                          </TableCell>
                          <TableCell className="py-2.5">
                            <div className="font-bold text-slate-900">{zone.name}</div>
                            <div className="text-xs text-slate-500">{zone.locality}</div>
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
                              <div className={`h-1.5 rounded-full ${zone.severity === 'CRITICAL' ? 'bg-red-600' : zone.severity === 'HIGH' ? 'bg-orange-600' : zone.severity === 'ELEVATED' ? 'bg-yellow-700' : 'bg-sky-700'}`} style={{ width: `${zone.probability}%` }}></div>
                            </div>
                          </TableCell>
                          <TableCell className="py-2.5 font-mono text-[12px] font-medium text-slate-900">{zone.depth}</TableCell>
                          <TableCell className={`py-2.5 font-mono text-[12px] font-bold ${zone.severity === 'CRITICAL' ? 'text-red-600' : zone.severity === 'HIGH' ? 'text-orange-600' : 'text-slate-500'}`}>{zone.onset}</TableCell>
                          <TableCell className="py-2.5 font-mono text-[12px] text-slate-500">{zone.peak}</TableCell>
                          <TableCell className="py-2.5">
                            <span className="font-semibold text-slate-900">{zone.pop}</span> <span className="text-[10px] text-slate-500">est.</span>
                          </TableCell>
                          <TableCell className="text-center py-2.5">
                            <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-slate-100 text-xs font-semibold ${zone.facil > 0 ? (zone.severity === 'CRITICAL' ? 'text-red-600 border border-red-200' : 'text-slate-900') : 'text-slate-500'}`}>
                              {zone.facil}
                            </span>
                          </TableCell>
                          <TableCell className="text-right pr-4 py-2.5">
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs font-semibold text-blue-700 hover:bg-slate-200 ml-auto">
                              Inspect <ChevronRight className="w-3 h-3 ml-1" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-slate-500 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span>Showing 10 of 12 zones (2 buffer zones static)</span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1 text-slate-900">
                    <Wrench className="w-3 h-3 text-slate-500" /> Hydro Calibration: 98.4%
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" disabled className="h-6 text-xs px-2 bg-white">Previous</Button>
                  <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[11px] font-bold">1</span>
                  <Button variant="outline" size="sm" className="h-6 text-xs px-2 bg-white">Next</Button>
                </div>
              </div>
            </div>

            <div className="xl:col-span-4 flex flex-col gap-4">
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapIcon className="w-4 h-4 text-blue-700" />
                    <span className="text-sm font-semibold uppercase text-slate-900">Zone Dossier: Zone B</span>
                  </div>
                  <Badge variant="destructive" className="text-[10px] font-bold px-1.5 py-0.5 h-auto leading-none bg-red-100 text-red-600 border border-red-300 hover:bg-red-100">
                    <AlertCircle className="w-3 h-3 mr-1" /> CRITICAL
                  </Badge>
                </div>
                <div className="p-4 flex flex-col gap-4">
                  <div className="relative w-full h-48 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                    <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCN-KPbU3UTNcMz7jMjoiYE-fERM1S8zj1LNt_L6KMUtU9rzWRHCkGMweipes9fs192uTISvmH4FBHtotx4Kp2OXS9MW4gAnAt-erNkCwv0BdrLmPUvjX8jKKeXxrXnKU9j3YSqJCn3mLSy5knGz-ryREKztvzT97jbQSIl7gLQVwx0ke2vyIEqBb2weKk_3MfNZdvbll9u5WJQfLBi0hbEZwA6ckbQg1mxyMo3JXo')" }}></div>
                    <div className="absolute inset-0 bg-[#001d31]/20 pointer-events-none"></div>
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 320 220">
                      <defs>
                        <pattern id="redHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                          <line x1="0" y1="0" x2="0" y2="8" stroke="#DC2626" strokeWidth="1.8" strokeOpacity="0.75" />
                        </pattern>
                      </defs>
                      <polygon points="50,40 180,25 280,75 270,170 140,195 40,140" fill="url(#redHatch)" stroke="#DC2626" strokeWidth="2.5" strokeDasharray="4 2" />
                    </svg>
                    
                    <div className="absolute top-6 left-12 group cursor-pointer">
                      <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white shadow-md border-2 border-white">
                        <Hospital className="w-3 h-3" />
                      </div>
                      <span className="absolute left-7 top-0.5 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap shadow opacity-0 group-hover:opacity-100 transition-opacity">City Trauma Wing</span>
                    </div>
                    
                    <div className="absolute top-20 left-32 group cursor-pointer">
                      <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white shadow-md border-2 border-white">
                        <Zap className="w-3 h-3" />
                      </div>
                      <span className="absolute left-7 top-0.5 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap shadow opacity-0 group-hover:opacity-100 transition-opacity">Substation 11kV</span>
                    </div>
                    
                    <div className="absolute bottom-10 right-16 group cursor-pointer">
                      <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white shadow-md border-2 border-white">
                        <GraduationCap className="w-3 h-3" />
                      </div>
                      <span className="absolute right-7 top-0.5 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap shadow opacity-0 group-hover:opacity-100 transition-opacity">Govt Model School (Shelter)</span>
                    </div>
                    
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded border border-slate-200 text-[10px] font-mono text-slate-900">
                      Polygon Area: 4.82 km² · Grid 13.01N, 74.80E
                    </div>
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-white/90 px-1.5 py-0.5 rounded border border-slate-200 text-[10px] font-semibold text-red-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
                      3 Critical Infrastructure Assets at Risk
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Primary Flood Inundation Drivers</span>
                      <span className="text-xs font-mono text-slate-900 font-bold">Composite Score: 88/100</span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-900 font-medium flex items-center gap-1"><CloudRain className="w-3.5 h-3.5 text-slate-500" /> Heavy Coastal Rainfall</span>
                          <span className="font-mono font-bold text-slate-900">41% weight</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '41%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-900 font-medium flex items-center gap-1"><Waves className="w-3.5 h-3.5 text-slate-500" /> Astronomical High Tide Peak</span>
                          <span className="font-mono font-bold text-slate-900">29% weight</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '29%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-900 font-medium flex items-center gap-1"><MapIcon className="w-3.5 h-3.5 text-slate-500" /> Low Elevation Topography (0.8m MSL)</span>
                          <span className="font-mono font-bold text-slate-900">19% weight</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '19%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-900 font-medium flex items-center gap-1"><Wrench className="w-3.5 h-3.5 text-slate-500" /> Culvert Siltation &amp; Sluice Choke</span>
                          <span className="font-mono font-bold text-slate-900">11% weight</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '11%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 bg-red-50 border border-red-300 rounded-lg flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-red-600 text-xs font-bold uppercase tracking-wide">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Prescribed Operational Action</span>
                    </div>
                    <p className="text-sm text-red-800 font-medium leading-relaxed">
                      Immediate deploy: Verify City Hospital access corridor via NH-66 bypass. Deploy 2 high-capacity dewatering pumps to Sluice Gate 4 immediately.
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-red-300/40 text-[11px] text-slate-500">
                      <span>Authority: NDMA SOP §4.2</span>
                      <span className="font-semibold text-red-600">ETA to Inundation: 04 min</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2 bg-slate-50 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Max Predicted Surge</span>
                      <span className="text-lg text-slate-900 font-bold block">0.71 m</span>
                      <span className="text-[10px] text-red-600 font-medium block">Over seawall crest</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Resident Evac Status</span>
                      <span className="text-lg text-slate-900 font-bold block">18% Compliant</span>
                      <span className="text-[10px] text-orange-600 font-medium block">868 moved to shelter</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <Button className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2">
                      <FileText className="w-4 h-4" /> View Dedicated Zone Dossier
                    </Button>
                    <Button variant="outline" className="w-full h-8 text-slate-900 font-medium flex items-center justify-center gap-1 bg-white">
                      <Bell className="w-4 h-4 text-slate-500" /> Dispatch SMS Broadcast to Sector (4,820 Residents)
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-slate-500" />
                    <span className="text-xs uppercase font-bold text-slate-900">Sector Telemetry Node Health</span>
                  </div>
                  <span className="text-xs text-slate-500">8/8 Gauges Active</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                    <span className="block text-[10px] text-slate-500 uppercase mb-0.5">Tide Buoy 01</span>
                    <span className="font-mono text-[12px] font-bold text-red-600">CRIT</span>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                    <span className="block text-[10px] text-slate-500 uppercase mb-0.5">Tide Buoy 02</span>
                    <span className="font-mono text-[12px] font-bold text-orange-600">HIGH</span>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                    <span className="block text-[10px] text-slate-500 uppercase mb-0.5">Rain Stn A</span>
                    <span className="font-mono text-[12px] font-bold text-red-600">94mm/h</span>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                    <span className="block text-[10px] text-slate-500 uppercase mb-0.5">Doppler S2</span>
                    <span className="font-mono text-[12px] font-bold text-slate-900">OK</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
