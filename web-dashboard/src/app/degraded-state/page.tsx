"use client";

import React, { useState } from "react";
import { 
  Shield, Waves, Bell, User, LayoutDashboard, Grid, Hospital, 
  Siren, Route, Activity, FileText, AlertTriangle, RefreshCw, 
  CheckCircle, Clock, RadioTower, LocateFixed, History, 
  Wrench, Radio, ClipboardCheck, FileEdit, Download, Phone 
} from "lucide-react";

export default function DegradedStatePage() {
  const [retryStatus, setRetryStatus] = useState<"idle" | "loading" | "error">("idle");
  const [acknowledged, setAcknowledged] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<"idle" | "loading" | "done">("idle");

  const handleRetry = () => {
    setRetryStatus("loading");
    setTimeout(() => {
      setRetryStatus("error");
      setTimeout(() => setRetryStatus("idle"), 3000);
    }, 1500);
  };

  const handleDownload = () => {
    setDownloadStatus("loading");
    setTimeout(() => {
      setDownloadStatus("done");
      setTimeout(() => setDownloadStatus("idle"), 2500);
    }, 1200);
  };

  return (
    <div className="bg-slate-50 font-sans text-slate-900 antialiased min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 z-40 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Shield className="text-blue-900 w-[22px] h-[22px]" />
            <span className="text-lg font-semibold text-blue-600 tracking-tight">TideMesh</span>
          </div>
          <div className="h-4 w-px bg-slate-300"></div>
          <div className="flex items-center gap-2">
            <Waves className="text-blue-600 w-[18px] h-[18px]" />
            <span className="text-sm font-semibold text-blue-900">Coastal Flood Event — Mangaluru Coast</span>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-slate-900">LIVE · Updated 14:26 (2 min ago)</span>
          </div>
          <div className="bg-slate-50 px-3 py-1 rounded border border-slate-200">
            <span className="text-xs font-medium text-slate-500">Model: <strong className="text-slate-900 font-semibold">v1.2</strong></span>
          </div>
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded px-3 py-1 text-slate-900 text-xs font-medium">
            <Activity className="w-[16px] h-[16px] mr-1 text-slate-500" />
            <span>EOC STATUS: FULL ACTIVATION</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center p-1.5 text-slate-500 hover:text-slate-900 cursor-pointer rounded hover:bg-slate-200 transition-colors">
            <Bell className="w-[20px] h-[20px]" />
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-white text-[9px] font-bold">3</span>
          </div>
          <div className="h-4 w-px bg-slate-300"></div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col text-right">
              <span className="text-sm font-medium text-slate-900">R. Shetty</span>
              <span className="text-xs font-medium text-slate-500">Duty Officer · EOC Shift 1</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <User className="text-white w-[18px] h-[18px]" />
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="fixed left-0 top-14 bottom-0 w-[232px] bg-white border-r border-slate-200 z-30 flex flex-col justify-between">
        <div className="flex flex-col pt-3">
          <nav className="flex flex-col gap-0.5 px-2">
            <a href="#" className="flex items-center justify-between px-4 py-3 rounded bg-blue-50 text-blue-900 border-l-4 border-blue-600 font-semibold transition-colors">
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-[18px] h-[18px]" />
                <span>Overview</span>
              </div>
            </a>
            <a href="#" className="flex items-center justify-between px-4 py-3 rounded text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors text-sm font-medium border-l-4 border-transparent">
              <div className="flex items-center gap-3">
                <Grid className="w-[18px] h-[18px]" />
                <span>Zones</span>
              </div>
              <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-xs font-medium">12</span>
            </a>
            <a href="#" className="flex items-center justify-between px-4 py-3 rounded text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors text-sm font-medium border-l-4 border-transparent">
              <div className="flex items-center gap-3">
                <Hospital className="w-[18px] h-[18px]" />
                <span>Critical Facilities</span>
              </div>
              <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-xs font-medium">7</span>
            </a>
            <a href="#" className="flex items-center justify-between px-4 py-3 rounded text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors text-sm font-medium border-l-4 border-transparent">
              <div className="flex items-center gap-3">
                <Siren className="w-[18px] h-[18px]" />
                <span>Response &amp; Actions</span>
              </div>
              <span className="px-1.5 py-0.5 bg-red-100 text-red-800 rounded text-xs font-medium">3 Pending</span>
            </a>
            <a href="#" className="flex items-center justify-between px-4 py-3 rounded text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors text-sm font-medium border-l-4 border-transparent">
              <div className="flex items-center gap-3">
                <Route className="w-[18px] h-[18px]" />
                <span>Evacuation Routes</span>
              </div>
            </a>
            <a href="#" className="flex items-center justify-between px-4 py-3 rounded text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors text-sm font-medium border-l-4 border-transparent">
              <div className="flex items-center gap-3">
                <Activity className="w-[18px] h-[18px]" />
                <span>Sensor Telemetry</span>
              </div>
            </a>
            <a href="#" className="flex items-center justify-between px-4 py-3 rounded text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors text-sm font-medium border-l-4 border-transparent">
              <div className="flex items-center gap-3">
                <FileText className="w-[18px] h-[18px]" />
                <span>Reports &amp; Briefings</span>
              </div>
            </a>
          </nav>
        </div>
        <div className="p-3 m-2 mb-3 bg-slate-100 border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2">
            <span className="text-xs font-medium text-slate-500 uppercase">Data Engine</span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <span className="text-xs font-semibold text-slate-900">ONLINE</span>
            </div>
          </div>
          <div className="space-y-1 text-xs text-slate-500">
            <div className="flex justify-between"><span>Telemetry Feed:</span><span className="text-xs font-medium text-slate-900">99.8%</span></div>
            <div className="flex justify-between"><span>Hydro Model:</span><span className="text-xs font-medium text-slate-900">v1.2 Active</span></div>
            <div className="flex justify-between"><span>Model Run:</span><span className="text-xs font-medium text-slate-900">14:24</span></div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">EOC Hotline:</span>
            <span className="text-sm font-bold text-blue-600">1077</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="pl-[232px]">
        <main className="w-full pt-14 bg-slate-50 min-h-screen">
          <div className="flex flex-col w-full">
            
            {/* Banner */}
            <aside className="w-full bg-amber-100 text-amber-900 px-6 py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm transition-all duration-200">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded bg-white flex items-center justify-center shrink-0">
                  <AlertTriangle className="text-slate-500 w-[20px] h-[20px]" />
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
                  <span className="text-sm tracking-wide uppercase font-bold text-amber-900">DEGRADED OPERATIONAL STATE</span>
                  <span className="text-slate-500 text-xs">·</span>
                  <span className="text-sm text-amber-900">Telemetry feed interrupted. Displaying cached state as of <strong className="font-semibold text-blue-600">13:52</strong> (34 min ago). Model: <strong className="font-semibold text-blue-600">v1.2</strong> (Run 13:50 IST).</span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                <button 
                  onClick={handleRetry}
                  disabled={retryStatus !== "idle"}
                  className="h-8 px-4 rounded bg-white hover:bg-slate-200 text-slate-900 text-sm font-medium flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {retryStatus === "idle" && <RefreshCw className="w-[16px] h-[16px] text-slate-500" />}
                  {retryStatus === "loading" && <RefreshCw className="w-[16px] h-[16px] animate-spin text-slate-500" />}
                  {retryStatus === "error" && <RadioTower className="w-[16px] h-[16px] text-red-500" />}
                  <span>
                    {retryStatus === "idle" ? "Retry Live Connection" : retryStatus === "loading" ? "Pinging Sensors..." : "Host Unreachable"}
                  </span>
                </button>
                <button 
                  onClick={() => setAcknowledged(!acknowledged)}
                  className={`h-8 px-4 rounded ${acknowledged ? 'bg-slate-500' : 'bg-blue-100'} hover:${acknowledged ? 'bg-slate-600' : 'bg-blue-200'} ${acknowledged ? 'text-white' : 'text-blue-900'} text-sm font-medium flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer`}
                >
                  <CheckCircle className={`w-[16px] h-[16px] ${acknowledged ? 'text-white' : 'text-blue-600'}`} />
                  <span>{acknowledged ? 'Mode Acknowledged by Shift 1' : 'Acknowledge Degraded Mode'}</span>
                </button>
              </div>
            </aside>

            {/* Ribbon */}
            <div className="bg-white px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-slate-500 text-xs font-medium">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                  <span className="font-semibold text-slate-900">PROTOCOL: SOP-51.4 REVERSION</span>
                </div>
                <span className="hidden sm:inline">|</span>
                <span className="hidden sm:inline">REGIONAL DISASTER COGNIZANCE: DAKSHINA KANNADA EOC</span>
                <span className="hidden md:inline">|</span>
                <span className="hidden md:inline">FALLBACK CARRIER: VHF CHANNEL 4 (156.200 MHz)</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-[14px] h-[14px]" />
                <span>AUTOMATED CYCLES HALTED · MANUAL SYNC ENFORCED</span>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 flex flex-col gap-6">
              
              {/* KPIs */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <article className="bg-white rounded-lg p-4 flex flex-col justify-between shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-[14px] h-[14px]" />
                      <span className="text-xs uppercase tracking-wider font-medium">High-Risk Zones</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">CACHED</span>
                  </div>
                  <div className="my-2">
                    <div className="text-3xl font-bold text-slate-900 tracking-tight">3</div>
                  </div>
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500 pt-1 bg-slate-50 px-1.5 py-0.5 rounded">
                    <span>Observed: 13:52</span>
                    <span className="font-semibold text-slate-900">Bengre, Ullal, Jeppinamogaru</span>
                  </div>
                </article>

                <article className="bg-white rounded-lg p-4 flex flex-col justify-between shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-[14px] h-[14px]" />
                      <span className="text-xs uppercase tracking-wider font-medium">Critical Zones</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">CACHED</span>
                  </div>
                  <div className="my-2">
                    <div className="text-3xl font-bold text-slate-900 tracking-tight">1</div>
                  </div>
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500 pt-1 bg-slate-50 px-1.5 py-0.5 rounded">
                    <span>Est. 13:52</span>
                    <span className="font-semibold text-red-600">Zone B (Netravati Spit)</span>
                  </div>
                </article>

                <article className="bg-white rounded-lg p-4 flex flex-col justify-between shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-[14px] h-[14px]" />
                      <span className="text-xs uppercase tracking-wider font-medium">Population Exposed</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">ESTIMATE</span>
                  </div>
                  <div className="my-2">
                    <div className="text-3xl font-bold text-slate-900 tracking-tight">12,840</div>
                  </div>
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500 pt-1 bg-slate-50 px-1.5 py-0.5 rounded">
                    <span>Census Model S-3</span>
                    <span className="font-semibold text-slate-900">Static Projection</span>
                  </div>
                </article>

                <article className="bg-white rounded-lg p-4 flex flex-col justify-between shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-[14px] h-[14px]" />
                      <span className="text-xs uppercase tracking-wider font-medium">Critical Facilities</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">SURV. CHECK</span>
                  </div>
                  <div className="my-2">
                    <div className="text-3xl font-bold text-slate-900 tracking-tight">7</div>
                  </div>
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500 pt-1 bg-slate-50 px-1.5 py-0.5 rounded">
                    <span>At Risk</span>
                    <span className="font-semibold text-slate-900">2 Substations · 1 Sub-Hospital</span>
                  </div>
                </article>

                <article className="bg-white rounded-lg p-4 flex flex-col justify-between shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-slate-500">
                      <AlertTriangle className="w-[14px] h-[14px]" />
                      <span className="text-xs uppercase tracking-wider font-medium">Next Onset</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">OUTDATED</span>
                  </div>
                  <div className="my-2">
                    <div className="text-3xl font-bold text-slate-500 tracking-tight">14:30 IST</div>
                  </div>
                  <div className="flex items-center justify-between text-xs font-medium text-slate-700 pt-1 bg-slate-200 px-1.5 py-0.5 rounded">
                    <span className="truncate">Delta: +34m elapsed</span>
                    <span className="font-bold text-slate-900">VERIFY MANUALLY</span>
                  </div>
                </article>
              </section>

              {/* Grid 12 cols */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left 8 cols: Map */}
                <div className="lg:col-span-8 flex flex-col gap-3">
                  <div className="relative w-full h-[540px] rounded-xl overflow-hidden shadow-sm bg-slate-300">
                    <div className="w-full h-full bg-cover bg-center filter grayscale-[75%] contrast-95 opacity-85" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCPAWh7i8vu_dQvj2UhWUgGQMFagyiX5NOJA_9utzn6vyMBJ1YXD-hv0RCjGtLY7_xuK7pbYB3gimrpkctNz908e62hcXgV7fTvkf1W_NGA3Wntjr0_iR91SxcqeL1ik64MPfc5wUD4Ykd-QepnCQeq36O9NahT0223MwLukKvVdYlA6aPuESOizymiQTYfXq5HEAp6orJhy4BlGqJbEHHE9APYsIfBEXLuHX0f-YA')" }}></div>
                    <div className="absolute inset-0 bg-slate-300/20 pointer-events-none"></div>
                    
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-auto max-w-[92%] z-10 shadow-md">
                      <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 shadow-sm">
                        <span className="inline-block w-2 h-2 rounded-full bg-slate-500 shrink-0"></span>
                        <span className="text-xs text-slate-900 font-semibold tracking-wide text-center">
                          Displaying last available prediction from 13:52 · Real-time sensor feed offline · Manual ground reports active
                        </span>
                      </div>
                    </div>

                    <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
                      <svg className="w-full h-full absolute inset-0 opacity-80" fill="none" viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg">
                        <line opacity="0.3" stroke="#76777d" strokeDasharray="4 4" strokeWidth="0.5" x1="0" x2="800" y1="125" y2="125"></line>
                        <line opacity="0.3" stroke="#76777d" strokeDasharray="4 4" strokeWidth="0.5" x1="0" x2="800" y1="250" y2="250"></line>
                        <line opacity="0.3" stroke="#76777d" strokeDasharray="4 4" strokeWidth="0.5" x1="0" x2="800" y1="375" y2="375"></line>
                        <line opacity="0.3" stroke="#76777d" strokeDasharray="4 4" strokeWidth="0.5" x1="200" x2="200" y1="0" y2="500"></line>
                        <line opacity="0.3" stroke="#76777d" strokeDasharray="4 4" strokeWidth="0.5" x1="400" x2="400" y1="0" y2="500"></line>
                        <line opacity="0.3" stroke="#76777d" strokeDasharray="4 4" strokeWidth="0.5" x1="600" x2="600" y1="0" y2="500"></line>
                        <polygon fill="#545f73" fillOpacity="0.25" points="210,140 290,170 320,290 240,320 180,210" stroke="#2d3133" strokeDasharray="6 3" strokeWidth="1.5"></polygon>
                        <polygon fill="#545f73" fillOpacity="0.15" points="360,110 440,120 480,240 410,250" stroke="#545f73" strokeWidth="1.5"></polygon>
                        <polygon fill="#545f73" fillOpacity="0.15" points="460,260 560,290 530,390 440,360" stroke="#545f73" strokeWidth="1.5"></polygon>
                      </svg>
                      
                      <div className="relative w-full h-full">
                        <div className="absolute top-[38%] left-[29%] pointer-events-auto">
                          <div className="bg-white px-2 py-1 rounded shadow-md flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-600"></span>
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-bold text-slate-900">Zone B · Netravati</span>
                              <span className="text-[10px] text-slate-500">Peak: +2.1m (Last: 13:52)</span>
                            </div>
                          </div>
                        </div>
                        <div className="absolute top-[26%] left-[52%] pointer-events-auto">
                          <div className="bg-white px-2 py-1 rounded shadow-md flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-bold text-slate-900">Zone A · Ullal North</span>
                              <span className="text-[10px] text-slate-500">Telemetry Stale</span>
                            </div>
                          </div>
                        </div>
                        <div className="absolute top-[58%] left-[62%] pointer-events-auto">
                          <div className="bg-white px-2 py-1 rounded shadow-md flex items-center gap-1.5">
                            <Hospital className="text-slate-500 w-[14px] h-[14px]" />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-semibold text-slate-900">Ullal Health Post #2</span>
                              <span className="text-[9px] text-slate-500">Barrier Gate Staged</span>
                            </div>
                          </div>
                        </div>
                        <div className="absolute top-[18%] left-[12%] pointer-events-auto">
                          <div className="bg-slate-200/90 px-2 py-1 rounded shadow-sm flex items-center gap-1 text-slate-500">
                            <RadioTower className="w-[14px] h-[14px]" />
                            <span className="text-[10px] uppercase font-semibold">Ullal Radar (OFFLINE)</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-end justify-between w-full pointer-events-auto">
                        <div className="bg-white/95 backdrop-blur-sm p-2 rounded shadow-sm text-[11px] font-medium text-slate-500 space-y-0.5">
                          <div>COORD: <span className="font-semibold text-slate-900">12°51'24.8"N 74°50'12.4"E</span></div>
                          <div>DATUM: WGS 84 · ELEV: 1.4m MSL</div>
                          <div>DISPLAY CACHE: FRAME #1352-HYD</div>
                        </div>
                        <div className="flex items-center gap-1 bg-white p-1 rounded shadow-sm">
                          <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 text-slate-900 font-bold text-sm" title="Zoom in">+</button>
                          <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 text-slate-900 font-bold text-sm" title="Zoom out">-</button>
                          <div className="h-4 w-px bg-slate-200 my-auto"></div>
                          <button className="h-7 px-2 flex items-center gap-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 text-xs font-medium" title="Reset Perspective">
                            <LocateFixed className="w-[14px] h-[14px]" />
                            <span>Recenter</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col gap-3 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <History className="w-[18px] h-[18px] text-slate-500" />
                        <span className="text-lg font-semibold text-slate-900">Telemetry Ingestion Timeline</span>
                      </div>
                      <span className="text-xs font-medium text-slate-500">Elapsed: 34 minutes without live handshake</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                      <div className="bg-blue-800 h-full w-[65%]" title="Active Telemetry up to 13:52"></div>
                      <div className="bg-slate-500 h-full w-[35%]" title="No Telemetry Received (13:52 - Present)"></div>
                    </div>
                    <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                      <span>13:00 IST (Nominal)</span>
                      <span>13:30 (Nominal)</span>
                      <span className="font-bold text-slate-900">13:52 (FEED LOST)</span>
                      <span className="text-slate-500 font-semibold">14:26 (NOW - Degraded)</span>
                    </div>
                  </div>
                </div>

                {/* Right 4 cols: Panel */}
                <aside className="lg:col-span-4 flex flex-col gap-4">
                  <section className="bg-white rounded-xl p-6 shadow-sm flex flex-col gap-4 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-slate-200 flex items-center justify-center">
                          <Wrench className="text-slate-500 w-[20px] h-[20px]" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-900">Telemetry Diagnostic</h2>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-900 text-[10px] font-bold">STATUS: TIMEOUT</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded text-xs text-slate-900 flex flex-col gap-2">
                      <p className="leading-relaxed">
                        <strong>Mangaluru Harbor Doppler radar feed timeout</strong> and <strong>Ullal tide gauge packet drop</strong>. Coastal radar offline since <strong className="text-slate-900">13:51 IST</strong>.
                      </p>
                      <div className="flex items-center gap-2 pt-1 text-xs font-medium text-slate-500">
                        <Radio className="w-[16px] h-[16px]" />
                        <span>Ground dispatch active on VHF Channel 4 (Repeater B)</span>
                      </div>
                    </div>
                    <div className="flex flex-col divide-y divide-slate-200 text-xs">
                      <div className="py-2 flex items-center justify-between">
                        <span className="text-slate-500">Ullal Acoustic Tide Gauge</span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[11px] font-semibold">PACKET LOSS</span>
                      </div>
                      <div className="py-2 flex items-center justify-between">
                        <span className="text-slate-500">Mangaluru Port Doppler Radar</span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[11px] font-semibold">UNREACHABLE</span>
                      </div>
                      <div className="py-2 flex items-center justify-between">
                        <span className="text-slate-500">Netravati River Hydrometric #4</span>
                        <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-900 text-[11px] font-semibold">LAST OK (13:50)</span>
                      </div>
                      <div className="py-2 flex items-center justify-between">
                        <span className="text-slate-500">INCOIS Tidal Harmonic Engine</span>
                        <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-900 text-[11px] font-semibold">SYNTHETIC READY</span>
                      </div>
                    </div>
                  </section>
                  
                  <section className="bg-white rounded-xl p-6 shadow-sm flex flex-col gap-4 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-slate-200 flex items-center justify-center">
                          <ClipboardCheck className="text-slate-500 w-[20px] h-[20px]" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-900">Fallback SOP Checklist</h2>
                      </div>
                      <span className="text-xs font-medium text-slate-500">Manual Triage</span>
                    </div>
                    <div className="flex flex-col gap-3">
                      <label className="flex items-start gap-3 p-3 rounded bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                        <input type="checkbox" defaultChecked className="mt-1 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-0" />
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-900 font-semibold">1. Confirm River Gauge via Voice Relay</span>
                          <span className="text-xs text-slate-500">Contact Panambur Port Authority EOC desk via telephone landline (Ext 401).</span>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 p-3 rounded bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                        <input type="checkbox" className="mt-1 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-0" />
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-900 font-semibold">2. Dispatch Visual Spotters</span>
                          <span className="text-xs text-slate-500">Position two trained civil defense spotters at Gurupura Bridge pillar markers.</span>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 p-3 rounded bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                        <input type="checkbox" className="mt-1 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-0" />
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-900 font-semibold">3. Apply Astronomical Tide Curve</span>
                          <span className="text-xs text-slate-500">Rely on predicted astronomical curve (Peak: 2.8m at 15:00 IST) until telemetry restores.</span>
                        </div>
                      </label>
                    </div>
                    
                    <div className="pt-2 flex flex-col gap-2">
                      <button 
                        onClick={() => alert('Initiating Manual Entry Protocol SOP-51.4b: Voice telephone transcription window unlocked.')}
                        className="w-full h-9 px-4 rounded bg-blue-600 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors cursor-pointer shadow-sm"
                      >
                        <FileEdit className="w-[18px] h-[18px]" />
                        <span>Switch to Manual Sensor Input</span>
                      </button>
                      <button 
                        onClick={handleDownload}
                        disabled={downloadStatus !== "idle"}
                        className="w-full h-9 px-4 rounded bg-slate-200 hover:bg-slate-300 text-slate-900 text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {downloadStatus === "idle" && <Download className="w-[18px] h-[18px] text-slate-500" />}
                        {downloadStatus === "loading" && <RefreshCw className="w-[18px] h-[18px] text-slate-500 animate-spin" />}
                        {downloadStatus === "done" && <CheckCircle className="w-[18px] h-[18px] text-green-600" />}
                        <span>
                          {downloadStatus === "idle" ? "Download Offline Contingency Packet (PDF)" : 
                           downloadStatus === "loading" ? "Generating Offline Packet..." : 
                           "Packet Generated (Mangaluru_EOC_1352.pdf)"}
                        </span>
                      </button>
                    </div>
                  </section>
                  
                  <div className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between text-slate-500 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <Phone className="w-[20px] h-[20px] text-slate-500" />
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-900 font-bold uppercase">Panambur Direct Relay</span>
                        <span className="text-xs">+91 (0824) 240-5201</span>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded bg-slate-100 text-[10px] text-slate-900 font-semibold">DESK 04</span>
                  </div>
                </aside>
              </div>

              {/* Table section */}
              <section className="bg-white rounded-xl p-6 shadow-sm flex flex-col gap-4 border border-slate-100">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Hydrographic Projection &amp; Manual Station Log</h2>
                    <p className="text-xs text-slate-500">Cross-referencing last-captured sensor records with static astronomical forecasts</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500">HARMONIC DATASET: INCOIS-2024-Q3</span>
                  </div>
                </div>
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs font-medium uppercase border-b border-slate-200">
                        <th className="py-2 px-4">Station Code</th>
                        <th className="py-2 px-4">Station Name</th>
                        <th className="py-2 px-4">Last Observed (13:52)</th>
                        <th className="py-2 px-4">Astronomical Tide (14:30)</th>
                        <th className="py-2 px-4">Predicted Peak (15:00)</th>
                        <th className="py-2 px-4">Current Deviation Status</th>
                        <th className="py-2 px-4 text-right">Manual Verification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs text-slate-900">
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-4 font-mono">MN-G01</td>
                        <td className="py-2.5 px-4 font-semibold">Ullal Spit South</td>
                        <td className="py-2.5 px-4 text-slate-500">2.14 m <span className="text-[10px] text-slate-500">(Stale)</span></td>
                        <td className="py-2.5 px-4">2.42 m</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-500">2.80 m</td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[11px] font-semibold">UNCERTAIN (+0.3m EST)</span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button className="text-slate-700 hover:text-slate-900 text-xs font-medium underline" type="button">Log Gauge Read</button>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-4 font-mono">MN-G04</td>
                        <td className="py-2.5 px-4 font-semibold">Netravati Estuary Gate</td>
                        <td className="py-2.5 px-4 text-slate-500">1.88 m <span className="text-[10px] text-slate-500">(Stale)</span></td>
                        <td className="py-2.5 px-4">2.05 m</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-500">2.35 m</td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-900 text-[11px] font-semibold">ESTUARY WARNING</span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button className="text-slate-700 hover:text-slate-900 text-xs font-medium underline" type="button">Log Gauge Read</button>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-4 font-mono">MN-G07</td>
                        <td className="py-2.5 px-4 font-semibold">Gurupura Bridge Pier 3</td>
                        <td className="py-2.5 px-4 text-slate-500">1.32 m <span className="text-[10px] text-slate-500">(Stale)</span></td>
                        <td className="py-2.5 px-4">1.45 m</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-500">1.70 m</td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-900 text-[11px] font-semibold">SPOTTER DISPATCHED</span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button className="text-slate-700 hover:text-slate-900 text-xs font-medium underline" type="button">Log Gauge Read</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
