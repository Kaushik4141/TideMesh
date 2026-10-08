import React from 'react';
import {
  Shield,
  Waves,
  Building,
  Bell,
  User,
  LayoutDashboard,
  Grid,
  Hospital,
  AlertCircle,
  Route,
  Radio,
  FileText,
  AlertTriangle,
  Users,
  Building2,
  Timer,
  Plus,
  Minus,
  Layers,
  LocateFixed,
  RotateCcw,
  Pause,
  RotateCw,
  X,
  Flame,
  GraduationCap,
  Maximize2,
  FileDown
} from 'lucide-react';

export default function OverviewZoneBInvestigation() {
  return (
    <div className="bg-slate-50 font-sans text-slate-900 antialiased min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-300 z-40 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Shield className="text-blue-800 w-6 h-6" />
            <span className="text-lg text-slate-900 font-semibold tracking-tight">CoastShield AI</span>
          </div>
          <div className="h-4 w-px bg-slate-300"></div>
          <div className="flex items-center gap-2">
            <Waves className="text-slate-900 w-5 h-5" />
            <span className="text-sm text-blue-800 font-bold">Coastal Flood Event — Mangaluru Coast</span>
          </div>
        </div>
        
        <div className="hidden lg:flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-200 px-3 py-1 rounded">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-800 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-800"></span>
            </span>
            <span className="text-xs uppercase tracking-wider text-slate-900 font-bold">LIVE · Updated 14:26 (2 min ago)</span>
          </div>
          <div className="bg-slate-100 px-3 py-1 rounded border border-slate-300">
            <span className="text-xs text-slate-500 font-medium">Model: <strong className="text-slate-900 font-semibold">v1.2</strong></span>
          </div>
          <div className="flex items-center bg-slate-100 border border-slate-300 rounded px-3 py-1 text-slate-900 text-xs font-bold">
            <Building className="w-4 h-4 mr-1 text-slate-500" />
            <span>EOC STATUS: FULL ACTIVATION</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center p-1.5 text-slate-500 hover:text-slate-900 cursor-pointer rounded hover:bg-slate-300 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-white text-[9px] font-bold">3</span>
          </div>
          <div className="h-4 w-px bg-slate-300"></div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col text-right">
              <span className="text-xs font-bold text-slate-900">R. Shetty</span>
              <span className="text-[10px] text-slate-500">Duty Officer · EOC Shift 1</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center">
              <User className="text-white w-4 h-4" />
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="fixed left-0 top-14 bottom-0 w-[232px] bg-white border-r border-slate-300 z-30 flex flex-col justify-between">
        <div className="flex flex-col pt-3">
          <nav className="flex flex-col gap-0.5 px-2">
            <a href="#" className="flex items-center justify-between px-4 py-3 rounded transition-colors bg-slate-200 text-slate-900 border-l-4 border-blue-800 font-semibold">
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-5 h-5" />
                <span>Overview</span>
              </div>
            </a>
            <a href="#" className="flex items-center justify-between px-4 py-3 rounded text-slate-600 hover:bg-slate-300 hover:text-slate-900 transition-colors text-xs font-bold border-l-4 border-transparent">
              <div className="flex items-center gap-3">
                <Grid className="w-5 h-5" />
                <span>Zones</span>
              </div>
              <span className="px-1.5 py-0.5 bg-slate-300 text-slate-600 rounded text-[10px]">12</span>
            </a>
            <a href="#" className="flex items-center justify-between px-4 py-3 rounded text-slate-600 hover:bg-slate-300 hover:text-slate-900 transition-colors text-xs font-bold border-l-4 border-transparent">
              <div className="flex items-center gap-3">
                <Hospital className="w-5 h-5" />
                <span>Critical Facilities</span>
              </div>
              <span className="px-1.5 py-0.5 bg-slate-300 text-slate-600 rounded text-[10px]">7</span>
            </a>
            <a href="#" className="flex items-center justify-between px-4 py-3 rounded text-slate-600 hover:bg-slate-300 hover:text-slate-900 transition-colors text-xs font-bold border-l-4 border-transparent">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5" />
                <span>Response &amp; Actions</span>
              </div>
              <span className="px-1.5 py-0.5 bg-red-100 text-red-900 rounded text-[10px]">3 Pending</span>
            </a>
            <a href="#" className="flex items-center justify-between px-4 py-3 rounded text-slate-600 hover:bg-slate-300 hover:text-slate-900 transition-colors text-xs font-bold border-l-4 border-transparent">
              <div className="flex items-center gap-3">
                <Route className="w-5 h-5" />
                <span>Evacuation Routes</span>
              </div>
            </a>
            <a href="#" className="flex items-center justify-between px-4 py-3 rounded text-slate-600 hover:bg-slate-300 hover:text-slate-900 transition-colors text-xs font-bold border-l-4 border-transparent">
              <div className="flex items-center gap-3">
                <Radio className="w-5 h-5" />
                <span>Sensor Telemetry</span>
              </div>
            </a>
            <a href="#" className="flex items-center justify-between px-4 py-3 rounded text-slate-600 hover:bg-slate-300 hover:text-slate-900 transition-colors text-xs font-bold border-l-4 border-transparent">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5" />
                <span>Reports &amp; Briefings</span>
              </div>
            </a>
          </nav>
        </div>
        <div className="p-4 m-2 mb-4 bg-slate-200 border border-slate-300 rounded-lg">
          <div className="flex items-center justify-between pb-2 border-b border-slate-300 mb-2">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Data Engine</span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-800"></span>
              <span className="text-[10px] text-slate-900 font-semibold">ONLINE</span>
            </div>
          </div>
          <div className="space-y-1 text-xs text-slate-500">
            <div className="flex justify-between"><span>Telemetry Feed:</span><span className="text-[10px] text-slate-900 font-bold">99.8%</span></div>
            <div className="flex justify-between"><span>Hydro Model:</span><span className="text-[10px] text-slate-900 font-bold">v1.2 Active</span></div>
            <div className="flex justify-between"><span>Model Run:</span><span className="text-[10px] text-slate-900 font-bold">14:24</span></div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-300 flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-bold">EOC Hotline:</span>
            <span className="text-xs text-blue-900 font-bold">1077</span>
          </div>
        </div>
      </aside>

      <div className="pl-[232px]">
        <main className="w-full pt-14 bg-slate-50 min-h-screen">
          <div className="flex flex-col w-full">
            <div className="flex flex-col gap-3 p-3 w-full max-w-[1920px] mx-auto box-border">
              {/* Top KPI Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 w-full">
                <div className="bg-white h-20 px-3.5 py-2.5 rounded-lg flex items-center justify-between relative overflow-hidden shadow-sm">
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-slate-300"></div>
                  <div className="flex flex-col justify-center min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-[10px] uppercase tracking-wider font-bold truncate">High-Risk Zones</span>
                    </div>
                    <div className="text-xs truncate mt-0.5">+1 in past hr</div>
                  </div>
                  <div className="text-2xl text-slate-900 tabular-nums font-bold shrink-0">3</div>
                </div>

                <div className="bg-white h-20 px-3.5 py-2.5 rounded-lg flex items-center justify-between relative overflow-hidden shadow-sm">
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-red-600"></div>
                  <div className="flex flex-col justify-center min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 text-red-600">
                      <AlertCircle className="w-4 h-4 fill-red-100" />
                      <span className="text-[10px] uppercase tracking-wider font-bold truncate">Critical Zones</span>
                    </div>
                    <div className="text-xs text-red-600 truncate mt-0.5">Zone B active</div>
                  </div>
                  <div className="text-2xl text-red-600 tabular-nums font-bold shrink-0">1</div>
                </div>

                <div className="bg-white h-20 px-3.5 py-2.5 rounded-lg flex items-center justify-between shadow-sm">
                  <div className="flex flex-col justify-center min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Users className="w-4 h-4" />
                      <span className="text-[10px] uppercase tracking-wider font-bold truncate">Population Exposed</span>
                    </div>
                    <div className="text-xs truncate mt-0.5">Across 5 prioritized zones</div>
                  </div>
                  <div className="text-2xl text-slate-900 tabular-nums font-bold shrink-0">12,840</div>
                </div>

                <div className="bg-white h-20 px-3.5 py-2.5 rounded-lg flex items-center justify-between shadow-sm">
                  <div className="flex flex-col justify-center min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Building2 className="w-4 h-4" />
                      <span className="text-[10px] uppercase tracking-wider font-bold truncate">Facilities Affected</span>
                    </div>
                    <div className="text-xs truncate mt-0.5">3 in B, 2 in F, 1 in C, 1 in H</div>
                  </div>
                  <div className="text-2xl text-slate-900 tabular-nums font-bold shrink-0">7</div>
                </div>

                <div className="bg-white h-20 px-3.5 py-2.5 rounded-lg flex items-center justify-between shadow-sm">
                  <div className="flex flex-col justify-center min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Timer className="w-4 h-4 text-red-600 animate-pulse" />
                      <span className="text-[10px] uppercase tracking-wider font-bold truncate">Next Est. Onset</span>
                    </div>
                    <div className="text-xs text-red-600 font-medium truncate mt-0.5">In 4 min · Zone B</div>
                  </div>
                  <div className="text-2xl text-red-600 tabular-nums font-bold shrink-0">14:30</div>
                </div>
              </div>

              {/* Main Workspace Layout */}
              <div className="flex flex-col xl:flex-row gap-3 w-full items-start">
                <div className="flex-1 flex flex-col gap-2.5 w-full min-w-0">
                  <div className="relative w-full h-[580px] bg-slate-100 rounded-lg overflow-hidden flex flex-col justify-between shadow-sm select-none">
                    <svg className="absolute inset-0 w-full h-full object-cover" preserveAspectRatio="xMidYMid slice" viewBox="0 0 960 580" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern height="8" id="criticalHatch" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse" width="8">
                          <line opacity="0.45" stroke="#ba1a1a" strokeWidth="2.5" x1="0" x2="0" y1="0" y2="8"></line>
                        </pattern>
                        <pattern height="40" id="coastalGrid" patternUnits="userSpaceOnUse" width="40">
                          <path d="M 40 0 L 0 0 0 40" fill="none" opacity="0.4" stroke="#d8dadc" strokeWidth="0.5"></path>
                        </pattern>
                      </defs>
                      <rect fill="#f2f4f6" height="580" width="960"></rect>
                      <rect fill="url(#coastalGrid)" height="580" width="960"></rect>
                      <path d="M 0,0 L 260,0 C 255,90 270,160 250,240 C 235,300 240,360 215,440 C 190,520 180,580 180,580 L 0,580 Z" fill="#d5e0f8"></path>
                      <path d="M 260,0 C 255,90 270,160 250,240 C 235,300 240,360 215,440 C 190,520 180,580 180,580" fill="none" stroke="#93ccff" strokeWidth="2"></path>
                      <path d="M 250,185 C 310,180 380,210 450,195 C 520,180 610,215 670,190 L 675,208 C 610,230 525,198 450,212 C 380,228 310,198 248,202 Z" fill="#d5e0f8" stroke="#93ccff" strokeWidth="1.2"></path>
                      <path d="M 215,440 C 290,430 380,480 470,470 C 560,460 690,510 760,500 L 760,522 C 690,532 560,482 470,492 C 380,502 290,452 210,462 Z" fill="#d5e0f8" stroke="#93ccff" strokeWidth="1.2"></path>
                      <g opacity="0.95" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3">
                        <path d="M 275,0 L 285,170 L 360,250 L 375,420 L 320,580"></path>
                        <path d="M 285,170 L 610,140 L 780,160"></path>
                        <path d="M 360,250 L 590,280 L 880,310"></path>
                        <path d="M 375,420 L 620,410 L 850,440"></path>
                        <path d="M 255,80 L 410,95 L 480,180"></path>
                        <path d="M 235,320 L 365,340"></path>
                      </g>
                      <g opacity="0.6" stroke="#76777d" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1">
                        <path d="M 275,0 L 285,170 L 360,250 L 375,420 L 320,580"></path>
                        <path d="M 285,170 L 610,140 L 780,160"></path>
                        <path d="M 360,250 L 590,280 L 880,310"></path>
                        <path d="M 375,420 L 620,410 L 850,440"></path>
                      </g>
                      <polygon fill="none" opacity="0.6" points="460,50 630,40 650,135 480,150" stroke="#76777d" strokeDasharray="3,3" strokeWidth="1.5"></polygon>
                      <text fill="#545f73" fontFamily="Inter" fontSize="11" fontWeight="600" x="540" y="95">ZONE D</text>
                      <polygon fill="none" opacity="0.6" points="640,40 820,30 840,140 660,135" stroke="#76777d" strokeDasharray="3,3" strokeWidth="1.5"></polygon>
                      <text fill="#545f73" fontFamily="Inter" fontSize="11" fontWeight="600" x="730" y="85">ZONE E</text>
                      <polygon fill="none" opacity="0.6" points="490,225 650,215 670,330 495,310" stroke="#76777d" strokeDasharray="3,3" strokeWidth="1.5"></polygon>
                      <text fill="#545f73" fontFamily="Inter" fontSize="11" fontWeight="600" x="560" y="275">ZONE G</text>
                      <polygon fill="none" opacity="0.6" points="680,210 880,220 890,340 680,330" stroke="#76777d" strokeDasharray="3,3" strokeWidth="1.5"></polygon>
                      <text fill="#545f73" fontFamily="Inter" fontSize="11" fontWeight="600" x="760" y="275">ZONE I</text>
                      <polygon fill="none" opacity="0.6" points="500,340 700,335 690,450 490,440" stroke="#76777d" strokeDasharray="3,3" strokeWidth="1.5"></polygon>
                      <text fill="#545f73" fontFamily="Inter" fontSize="11" fontWeight="600" x="580" y="390">ZONE J</text>
                      <polygon fill="none" opacity="0.6" points="710,345 890,350 880,480 700,460" stroke="#76777d" strokeDasharray="3,3" strokeWidth="1.5"></polygon>
                      <text fill="#545f73" fontFamily="Inter" fontSize="11" fontWeight="600" x="780" y="415">ZONE K</text>
                      <polygon fill="none" opacity="0.6" points="480,510 680,500 670,570 470,570" stroke="#76777d" strokeDasharray="3,3" strokeWidth="1.5"></polygon>
                      <text fill="#545f73" fontFamily="Inter" fontSize="11" fontWeight="600" x="560" y="545">ZONE L</text>
                      <polygon fill="#fde047" fillOpacity="0.35" points="260,20 440,30 460,150 280,165" stroke="#ca8a04" strokeWidth="1.5"></polygon>
                      <text fill="#854d0e" fontFamily="Inter" fontSize="11" fontWeight="700" x="330" y="90">ZONE A [ELEVATED]</text>
                      <polygon fill="#fde047" fillOpacity="0.3" points="370,250 480,230 480,350 365,360" stroke="#ca8a04" strokeWidth="1.5"></polygon>
                      <text fill="#854d0e" fontFamily="Inter" fontSize="11" fontWeight="700" x="380" y="305">ZONE H</text>
                      <polygon fill="#fdba74" fillOpacity="0.35" points="230,270 355,270 360,420 220,425" stroke="#ea580c" strokeWidth="2"></polygon>
                      <text fill="#9a3412" fontFamily="Inter" fontSize="11" fontWeight="700" x="250" y="350">ZONE C [HIGH]</text>
                      <polygon fill="#fdba74" fillOpacity="0.4" points="280,185 450,195 440,245 285,240" stroke="#ea580c" strokeWidth="2"></polygon>
                      <text fill="#9a3412" fontFamily="Inter" fontSize="11" fontWeight="700" x="320" y="215">ZONE F [HIGH]</text>
                      <polygon fill="url(#criticalHatch)" points="255,30 420,35 435,175 270,170"></polygon>
                      <polygon fill="#ba1a1a" fillOpacity="0.18" points="255,30 420,35 435,175 270,170" stroke="#000000" strokeWidth="3.5"></polygon>
                      <g transform="translate(268, 48)">
                        <rect fill="#000000" height="24" rx="4" width="136"></rect>
                        <text fill="#ffffff" fontFamily="Inter" fontSize="10" fontWeight="700" letterSpacing="0.04em" textAnchor="middle" x="68" y="16">ZONE B [CRITICAL]</text>
                      </g>
                      <g className="cursor-pointer" transform="translate(340, 105)">
                        <circle className="animate-ping" cx="14" cy="14" fill="#ffdad6" opacity="0.65" r="20"></circle>
                        <circle cx="14" cy="14" fill="#ffffff" r="14" stroke="#ba1a1a" strokeWidth="2.5"></circle>
                        <path d="M 14,8 L 14,20 M 8,14 L 20,14" stroke="#ba1a1a" strokeLinecap="round" strokeWidth="3"></path>
                      </g>
                      <text fill="#191c1e" fontFamily="Inter" fontSize="10" fontWeight="700" x="340" y="145">City Hospital</text>
                      <g className="cursor-pointer" transform="translate(285, 120)">
                        <circle cx="14" cy="14" fill="#ffffff" r="14" stroke="#545f73" strokeWidth="2"></circle>
                        <path d="M 10,14 L 14,10 L 18,14 L 14,18 Z" fill="#545f73"></path>
                      </g>
                      <text fill="#545f73" fontFamily="Inter" fontSize="9" fontWeight="600" x="270" y="155">Panambur Fire</text>
                      <g className="cursor-pointer" transform="translate(390, 145)">
                        <circle cx="14" cy="14" fill="#ffffff" r="14" stroke="#545f73" strokeWidth="2"></circle>
                        <path d="M 9,18 L 14,9 L 19,18 Z" fill="#545f73"></path>
                      </g>
                      <text fill="#545f73" fontFamily="Inter" fontSize="9" fontWeight="600" x="390" y="175">Govt. School (Shelter)</text>
                    </svg>
                    
                    <div className="relative m-3 flex flex-col gap-1 pointer-events-none">
                      <div className="flex items-center gap-2">
                        <div className="bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded shadow-sm flex items-center gap-2 pointer-events-auto">
                          <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                          <span className="text-[10px] uppercase tracking-wide text-slate-900 font-bold">Panambur Maritime Radar Sector</span>
                        </div>
                        <div className="bg-white/90 px-2 py-1.5 rounded shadow-sm text-slate-500 text-xs pointer-events-auto">
                          Basemap: Hydro-Tide Dynamic
                        </div>
                      </div>
                      <div className="mt-2 ml-16 bg-blue-900 text-white px-3 py-2 rounded shadow-md flex items-center gap-2.5 max-w-xs pointer-events-auto">
                        <Waves className="text-red-500 w-5 h-5" />
                        <div className="flex flex-col">
                          <div className="text-[10px] font-bold">Zone B · Panambur Coast</div>
                          <div className="text-xs text-slate-300">Onset 14:30 (4 min) · Depth: 0.31-0.71 m</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="absolute top-3 right-3 flex flex-col gap-1 bg-white rounded shadow-sm p-1 z-10">
                      <button className="w-8 h-8 flex items-center justify-center hover:bg-slate-200 rounded text-slate-900" title="Zoom In">
                        <Plus className="w-5 h-5" />
                      </button>
                      <button className="w-8 h-8 flex items-center justify-center hover:bg-slate-200 rounded text-slate-900" title="Zoom Out">
                        <Minus className="w-5 h-5" />
                      </button>
                      <div className="h-px bg-slate-300 my-0.5"></div>
                      <button className="w-8 h-8 flex items-center justify-center hover:bg-slate-200 rounded text-slate-900" title="Toggle Flood Depth Raster">
                        <Layers className="w-5 h-5" />
                      </button>
                      <button className="w-8 h-8 flex items-center justify-center hover:bg-slate-200 rounded text-slate-900" title="Reset View">
                        <LocateFixed className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="relative m-3 flex flex-wrap items-end justify-between pointer-events-none gap-2">
                      <div className="bg-white/95 backdrop-blur-sm px-3 py-2 rounded shadow-sm flex items-center gap-3 pointer-events-auto">
                        <div className="flex items-center gap-1.5">
                          <span className="w-3.5 h-3.5 bg-red-600/20 border-2 border-red-600 rounded-sm flex items-center justify-center">
                            <span className="w-2 h-0.5 bg-red-600 rotate-45"></span>
                          </span>
                          <span className="text-[10px] uppercase text-slate-900 font-semibold">Critical</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3.5 h-3.5 bg-amber-500/30 border border-amber-600 rounded-sm"></span>
                          <span className="text-[10px] uppercase text-slate-900 font-semibold">High</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3.5 h-3.5 bg-yellow-400/30 border border-yellow-500 rounded-sm"></span>
                          <span className="text-[10px] uppercase text-slate-900 font-semibold">Elevated</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3.5 h-3.5 bg-slate-100 border border-slate-400 rounded-sm"></span>
                          <span className="text-[10px] uppercase text-slate-500 font-semibold">Normal</span>
                        </div>
                      </div>
                      <div className="bg-white/95 backdrop-blur-sm px-3 py-2 rounded shadow-sm flex items-center gap-3 text-slate-500 text-[10px] font-semibold pointer-events-auto">
                        <div className="flex items-center gap-1">
                          <span className="w-6 h-1 bg-slate-900 inline-block"></span>
                          <span className="font-semibold text-slate-900">1 km</span>
                        </div>
                        <span>·</span>
                        <span>Coordinates: 12.914°N, 74.856°E</span>
                        <span>·</span>
                        <span className="text-slate-900 font-semibold">Updated 14:26:10</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-3 shadow-sm flex flex-col justify-between gap-2">
                    <div className="relative w-full h-9 flex items-center px-2">
                      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 36">
                        <path d="M 0,28 Q 120,27 240,24 T 400,18 T 520,6 T 600,10 T 720,20 T 800,26" fill="none" stroke="#bcc7de" strokeDasharray="3,2" strokeWidth="1.5"></path>
                        <path d="M 320,21 Q 400,18 450,11 T 520,6 L 520,36 L 320,36 Z" fill="#ffdad6" opacity="0.35"></path>
                      </svg>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full relative z-0 flex items-center">
                        <div className="absolute left-0 right-[40%] h-full bg-slate-300 rounded-full"></div>
                      </div>
                      
                      <div className="absolute left-[54%] -top-2 flex flex-col items-center z-10 -translate-x-1/2">
                        <span className="bg-teal-800 text-white px-1.5 py-0.5 rounded text-[10px] font-bold shadow-sm whitespace-nowrap">NOW 14:26</span>
                        <div className="w-0.5 h-6 bg-teal-800 mt-0.5"></div>
                      </div>
                      
                      <div className="absolute left-[59%] -top-2 flex flex-col items-center z-10 -translate-x-1/2">
                        <span className="bg-red-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold shadow-sm whitespace-nowrap">ONSET 14:30</span>
                        <div className="w-0.5 h-6 bg-red-600 mt-0.5"></div>
                      </div>
                      
                      <div className="absolute left-[72%] -top-2 flex flex-col items-center z-10 -translate-x-1/2">
                        <span className="bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded text-[10px] font-bold shadow-sm whitespace-nowrap">PEAK 15:10 (0.71 m)</span>
                        <div className="w-0.5 h-6 bg-blue-100 mt-0.5"></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-1 border-t border-slate-300">
                      <div className="flex items-center gap-1">
                        <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-200 text-slate-500 hover:text-slate-900" title="Jump -15 mins">
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button className="w-7 h-7 flex items-center justify-center rounded bg-slate-900 text-white hover:bg-slate-700" title="Pause simulation">
                          <Pause className="w-4 h-4" />
                        </button>
                        <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-200 text-slate-500 hover:text-slate-900" title="Jump +15 mins">
                          <RotateCw className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between flex-1 max-w-xl px-4 text-slate-500 text-[10px] font-bold tabular-nums">
                        <span>12:00</span><span>12:30</span><span>13:00</span><span>13:30</span><span>14:00</span>
                        <span className="text-red-600 font-bold">14:30</span><span>15:00</span><span className="text-slate-900 font-semibold">15:30</span>
                        <span>16:00</span><span>16:30</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-slate-200 rounded p-0.5">
                          <button className="px-2 py-0.5 rounded text-[10px] bg-white text-slate-900 font-bold shadow-sm">1x</button>
                          <button className="px-2 py-0.5 rounded text-[10px] text-slate-500 hover:text-slate-900">2x</button>
                          <button className="px-2 py-0.5 rounded text-[10px] text-slate-500 hover:text-slate-900">5x</button>
                        </div>
                        <span className="text-xs tabular-nums text-slate-900 font-semibold ml-1">T+04m</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Drawer */}
                <aside className="w-full xl:w-[400px] shrink-0 bg-white rounded-lg p-4 shadow-sm flex flex-col gap-3.5 border-l-2 border-red-600">
                  <div className="flex items-start justify-between pb-2 border-b border-slate-300">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Zone B · Panambur Coast</h2>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-100 text-red-600 text-[10px] font-bold border border-red-300 uppercase">
                          <AlertCircle className="w-3 h-3 fill-red-100" />
                          CRITICAL
                        </span>
                        <span className="text-xs text-slate-500">Coastal Ward 14 · Mangaluru North</span>
                      </div>
                    </div>
                    <button className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-900 transition-colors" title="Close Drawer">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="bg-slate-100 rounded-lg p-3 border border-slate-300 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Flood Probability</span>
                        <span className="text-2xl text-red-600 font-bold tabular-nums">84.7%</span>
                      </div>
                      <div className="h-8 w-px bg-slate-300"></div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Expected Depth</span>
                        <span className="text-xl text-slate-900 font-bold tabular-nums">0.31–0.71 m</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-300 text-xs font-bold">
                      <div className="flex items-center gap-1 text-slate-500">
                        <span>Onset:</span>
                        <span className="text-red-600 font-bold tabular-nums">14:30</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <span>Peak:</span>
                        <span className="text-slate-900 font-bold tabular-nums">15:10</span>
                      </div>
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 flex items-center justify-between pt-1">
                      <span>Model v1.2</span>
                      <span>Updated 14:26 (2 min ago)</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 bg-white pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-900 font-bold uppercase tracking-wider">Factor Contribution Analysis</span>
                      <span className="text-[10px] text-slate-500 font-medium">Hydro Engine</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-900 font-medium">Heavy Rainfall (41 mm / 3 hr)</span>
                          <span className="font-bold tabular-nums text-slate-900">41%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div className="bg-red-600 h-full rounded-full" style={{ width: '41%' }}></div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-900 font-medium">Spring Tide (2.8 m Surge)</span>
                          <span className="font-bold tabular-nums text-slate-900">29%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div className="bg-blue-100 h-full rounded-full" style={{ width: '29%' }}></div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-900 font-medium">Topography (Avg 2.1 m Low Coast)</span>
                          <span className="font-bold tabular-nums text-slate-900">19%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div className="bg-slate-500 h-full rounded-full" style={{ width: '19%' }}></div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-900 font-medium">Drainage (Restricted Culvert Outfall)</span>
                          <span className="font-bold tabular-nums text-slate-900">11%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div className="bg-slate-300 h-full rounded-full" style={{ width: '11%' }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="p-2.5 bg-slate-200 rounded text-xs text-slate-600 border-l-2 border-blue-800 mt-1">
                      "Heavy localized precipitation coinciding with high spring tide over low-lying coastal terrain with limited drainage capacity."
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-100 p-2 rounded flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Buildings Exposed</span>
                      <span className="text-lg text-slate-900 font-bold tabular-nums">1,284</span>
                    </div>
                    <div className="bg-slate-100 p-2 rounded flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Roads Affected</span>
                      <span className="text-lg text-slate-900 font-bold tabular-nums">8.4 km</span>
                    </div>
                    <div className="bg-slate-100 p-2 rounded flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Critical Facilities</span>
                      <span className="text-lg text-red-600 font-bold tabular-nums">3</span>
                    </div>
                    <div className="bg-slate-100 p-2 rounded flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Est. Population</span>
                      <span className="text-lg text-slate-900 font-bold tabular-nums">4,820</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-900 font-bold uppercase tracking-wider">Affected Facilities (3)</span>
                      <span className="text-[10px] text-red-600 font-semibold">Triage Alert</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="p-2.5 bg-slate-100 rounded border-l-2 border-red-600 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <Hospital className="w-4 h-4 text-red-600" />
                            City Hospital
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-600 text-[10px] font-bold">CRITICAL</span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center justify-between">
                          <span>Depth: <strong className="text-slate-900">0.4–0.7 m</strong></span>
                          <span>Onset: <strong className="text-red-600">14:40</strong></span>
                        </div>
                        <div className="text-xs text-red-600 flex items-center gap-1 mt-0.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Main ambulance access route potentially submerged</span>
                        </div>
                      </div>
                      
                      <div className="p-2.5 bg-slate-100 rounded border-l-2 border-slate-500 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <Flame className="w-4 h-4 text-slate-500" />
                            Panambur Fire Station
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-900 text-[10px] font-bold">HIGH</span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center justify-between">
                          <span>Depth: <strong className="text-slate-900">0.2–0.5 m</strong></span>
                          <span>Route: <strong className="text-slate-900">Primary Arterial Clear</strong></span>
                        </div>
                      </div>

                      <div className="p-2.5 bg-slate-100 rounded border-l-2 border-slate-500 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <GraduationCap className="w-4 h-4 text-slate-500" />
                            Govt. Higher Primary School
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-900 text-[10px] font-bold">HIGH</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          Designated Evacuation Shelter · Ground floor risk
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-900 font-bold uppercase tracking-wider">Recommended EOC Actions</span>
                      <span className="text-[10px] text-slate-500 font-bold">1 of 3 Done</span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="p-2 bg-slate-100 rounded flex items-start gap-2">
                        <input className="mt-1 h-4 w-4 rounded accent-blue-800 shrink-0" type="checkbox" />
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-semibold text-slate-900">Check City Hospital access</span>
                            <button className="px-2 py-0.5 bg-slate-900 text-white rounded text-[11px] font-semibold hover:bg-slate-700 shrink-0">Assign</button>
                          </div>
                          <span className="text-slate-500 text-[10px] font-bold mt-0.5">Unassigned · Priority: Urgent</span>
                        </div>
                      </div>
                      
                      <div className="p-2 bg-slate-100 rounded flex items-start gap-2 opacity-85">
                        <input defaultChecked className="mt-1 h-4 w-4 rounded accent-blue-800 shrink-0" type="checkbox" />
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-xs font-semibold text-slate-900 line-through">Prepare evacuation route for Zone B</span>
                          <span className="text-slate-500 text-[10px] font-bold mt-0.5">Team 2 · Acknowledged by R. Shetty, 14:22</span>
                        </div>
                      </div>

                      <div className="p-2 bg-slate-100 rounded flex items-start gap-2">
                        <input className="mt-1 h-4 w-4 rounded accent-blue-800 shrink-0" type="checkbox" />
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-semibold text-slate-900">Position response team near Panambur</span>
                            <span className="px-1.5 py-0.5 bg-slate-200 text-slate-900 text-[10px] font-bold rounded">Dispatched</span>
                          </div>
                          <span className="text-slate-500 text-[10px] font-bold mt-0.5">Team 4 · Dispatched at 14:15</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2 border-t border-slate-300 mt-auto">
                    <button className="w-full h-9 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-700 flex items-center justify-center gap-1.5 shadow-sm transition-colors">
                      <Maximize2 className="w-4 h-4" />
                      Open Full Zone View
                    </button>
                    <button className="w-full h-9 bg-white text-slate-900 border border-slate-300 rounded text-xs font-semibold hover:bg-slate-100 flex items-center justify-center gap-1.5 transition-colors">
                      <FileDown className="w-4 h-4" />
                      Export Zone Briefing (PDF)
                    </button>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
