'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Download,
  Printer,
  Share2,
  Calendar,
  Building,
  AlertTriangle,
  ArrowRight,
  Shield,
  FileCheck,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import { TopHeader } from '@/components/dashboard/TopHeader';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DEMO_EVENT, DEMO_KPI_SUMMARY, DEMO_ZONES } from '@/data/demoFloodEvent';
import { useAuth } from '@/hooks/useAuth';

interface ReportItem {
  id: string;
  title: string;
  type: 'Executive Briefing' | 'Incident Situation Report' | 'Technical Hydro Analysis';
  issuedAt: string;
  author: string;
  status: 'PUBLISHED' | 'DRAFT';
  summary: string;
  fileSize: string;
}

const REPORTS_LIST: ReportItem[] = [
  {
    id: 'sitrep-01',
    title: 'Situation Report #1 — Mangaluru Coastal Ingress',
    type: 'Incident Situation Report',
    issuedAt: '08 Oct 2026 · 14:26',
    author: 'R. Shetty (Duty Officer)',
    status: 'PUBLISHED',
    summary:
      'Coinciding 2.8m spring tide and 85mm convective storm cell pushing flood envelope into Zone B (Panambur Coast). District Hospital H1 access spur threatened at 14:30 onset.',
    fileSize: '1.2 MB PDF',
  },
  {
    id: 'brief-01',
    title: 'Executive Briefing — Commissioner & District Disaster Management',
    type: 'Executive Briefing',
    issuedAt: '08 Oct 2026 · 14:15',
    author: 'K. Rao (Incident Commander)',
    status: 'PUBLISHED',
    summary:
      '12,840 estimated population exposed across 5 prioritized sectors. 7 critical facilities on active alert. Emergency response teams mobilized for Zone B and Zone F.',
    fileSize: '840 KB PDF',
  },
  {
    id: 'hydro-01',
    title: 'Compound Flood Physics Run — Model v1.2 Hydrograph',
    type: 'Technical Hydro Analysis',
    issuedAt: '08 Oct 2026 · 14:00',
    author: 'TideMesh AI Hydro Engine',
    status: 'PUBLISHED',
    summary:
      'Coupled 2D hydrodynamic simulation assessing Net Inundation Depth over digital elevation model. Culvert outfall backpressure identified as critical factor.',
    fileSize: '3.4 MB GeoJSON / PDF',
  },
];

export default function ReportsPage() {
  const { currentUser } = useAuth();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleDownload = (id: string, title: string) => {
    setDownloadingId(id);
    setTimeout(() => {
      setDownloadingId(null);
      setToastMsg(`Downloaded "${title}"`);
      setTimeout(() => setToastMsg(null), 3000);
    }, 1200);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-100 flex flex-col font-sans antialiased text-slate-900 select-none">
      <TopHeader />

      <div className="flex flex-1 pt-14 overflow-hidden">
        <Sidebar />

        <main className="flex-1 ml-[220px] lg:ml-[232px] p-4 lg:p-6 overflow-y-auto space-y-5 bg-slate-50">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 text-indigo-800 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Reports & Operational Briefings
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Automated SitReps, executive summaries for municipal leadership, and hydrological audit logs.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDownload('all', 'Complete Briefing Package')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export All (ZIP)</span>
              </button>
              <Link
                href="/"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
              >
                <span>Back to Overview</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Quick Situation Highlights Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Current Operational Incident State
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Event: {DEMO_EVENT.name}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 font-medium text-[11px] block">Exposed Population</span>
                <span className="text-lg font-bold text-slate-900 mt-0.5 block tabular-nums">
                  12,840
                </span>
                <span className="text-[10px] text-slate-500">Across 5 Priority Zones</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 font-medium text-[11px] block">Critical Facility Exposure</span>
                <span className="text-lg font-bold text-red-600 mt-0.5 block tabular-nums">
                  7 Facilities
                </span>
                <span className="text-[10px] text-slate-500">Hospital H1 ICU access active watch</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 font-medium text-[11px] block">Next Flood Onset</span>
                <span className="text-lg font-bold text-slate-900 mt-0.5 block tabular-nums">
                  14:30 (In 4 min)
                </span>
                <span className="text-[10px] text-slate-500">Zone B · Panambur Coast</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 font-medium text-[11px] block">Physics Simulation</span>
                <span className="text-lg font-bold text-emerald-700 mt-0.5 block">
                  Model v1.2 OK
                </span>
                <span className="text-[10px] text-slate-500">Hydro dynamic run verified</span>
              </div>
            </div>
          </div>

          {/* Reports List */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900">Available Operational Documents</h2>

            {REPORTS_LIST.map((rep) => {
              const isDownloading = downloadingId === rep.id;

              return (
                <div
                  key={rep.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all space-y-3 shadow-2xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                      <h3 className="text-sm font-bold text-slate-900">{rep.title}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">{rep.issuedAt}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {rep.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {rep.summary}
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs">
                    <div className="flex items-center gap-3 text-slate-500">
                      <span>Author: <strong className="text-slate-700">{rep.author}</strong></span>
                      <span>·</span>
                      <span>Type: <strong className="text-slate-700">{rep.type}</strong></span>
                      <span>·</span>
                      <span>{rep.fileSize}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownload(rep.id, rep.title)}
                        disabled={isDownloading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{isDownloading ? 'Downloading…' : 'Download Document'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Toast */}
          {toastMsg && (
            <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg text-xs font-semibold shadow-xl border border-slate-700">
              {toastMsg}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
