'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Siren,
  Clock,
  Send,
  CheckCircle,
  AlertTriangle,
  Users,
  Shield,
  ArrowRight,
  Filter,
  Check,
  RotateCcw,
} from 'lucide-react';
import { TopHeader } from '@/components/dashboard/TopHeader';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DEMO_ZONES } from '@/data/demoFloodEvent';
import { useAuth, usePermission } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface ActionItem {
  id: string;
  zoneId: string;
  zoneName: string;
  title: string;
  priority: 'Urgent' | 'High' | 'Normal';
  team: string;
  status: 'unassigned' | 'dispatched' | 'done';
  timestamp?: string;
  facility?: string;
}

const INITIAL_ACTIONS: ActionItem[] = [
  {
    id: 'act-b1',
    zoneId: 'B',
    zoneName: 'Zone B · Panambur Coast',
    title: 'Monitor Hospital H1 access',
    priority: 'Urgent',
    team: 'Team Alpha',
    status: 'unassigned',
    facility: 'District Hospital H1',
  },
  {
    id: 'act-b2',
    zoneId: 'B',
    zoneName: 'Zone B · Panambur Coast',
    title: 'Deploy response team to Zone B',
    priority: 'Urgent',
    team: 'Team Delta',
    status: 'unassigned',
  },
  {
    id: 'act-b3',
    zoneId: 'B',
    zoneName: 'Zone B · Panambur Coast',
    title: 'Secure Road R12',
    priority: 'High',
    team: 'Traffic Police Detachment',
    status: 'unassigned',
  },
  {
    id: 'act-b4',
    zoneId: 'B',
    zoneName: 'Zone B · Panambur Coast',
    title: 'Issue localized warning',
    priority: 'High',
    team: 'Public Information Officer',
    status: 'unassigned',
  },
  {
    id: 'act-f1',
    zoneId: 'F',
    zoneName: 'Zone F · Tannirbhavi Spit',
    title: 'Wave barrier inspection at Tannirbhavi Coast Guard',
    priority: 'High',
    team: 'Coast Guard Unit 4',
    status: 'unassigned',
    facility: 'Tannirbhavi Coast Guard Station',
  },
  {
    id: 'act-c1',
    zoneId: 'C',
    zoneName: 'Zone C · Surathkal Beach',
    title: 'Clear drainage culvert silt block',
    priority: 'Normal',
    team: 'Municipal Works Crew',
    status: 'done',
    timestamp: '14:15',
  },
];

export default function ActionsPage() {
  const { currentUser } = useAuth();
  const { can } = usePermission();
  const canDispatch = can('assignTeam');

  const [actions, setActions] = useState<ActionItem[]>(INITIAL_ACTIONS);
  const [filter, setFilter] = useState<'all' | 'pending' | 'dispatched' | 'done'>('all');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleDispatch = (id: string, defaultTeam: string) => {
    if (!canDispatch) {
      showToast('View only for your role (Cannot dispatch teams)');
      return;
    }

    setActions((prev) =>
      prev.map((act) =>
        act.id === id
          ? {
              ...act,
              status: 'dispatched',
              team: act.team || defaultTeam,
              timestamp: '14:26',
            }
          : act
      )
    );
    showToast(`Dispatched team for "${actions.find((a) => a.id === id)?.title}"`);
  };

  const handleMarkDone = (id: string) => {
    if (!canDispatch) {
      showToast('View only for your role');
      return;
    }

    setActions((prev) =>
      prev.map((act) =>
        act.id === id
          ? {
              ...act,
              status: act.status === 'done' ? 'dispatched' : 'done',
            }
          : act
      )
    );
  };

  const handleReset = () => {
    setActions(INITIAL_ACTIONS);
    showToast('Actions reset to simulation baseline');
  };

  const filteredActions = actions.filter((act) => {
    if (filter === 'pending' && act.status !== 'unassigned') return false;
    if (filter === 'dispatched' && act.status !== 'dispatched') return false;
    if (filter === 'done' && act.status !== 'done') return false;
    if (selectedZone !== 'all' && act.zoneId !== selectedZone) return false;
    return true;
  });

  const pendingCount = actions.filter((a) => a.status === 'unassigned').length;
  const dispatchedCount = actions.filter((a) => a.status === 'dispatched').length;
  const doneCount = actions.filter((a) => a.status === 'done').length;

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-100 flex flex-col font-sans antialiased text-slate-900 select-none">
      <TopHeader />

      <div className="flex flex-1 pt-14 overflow-hidden">
        <Sidebar />

        <main className="flex-1 ml-[220px] lg:ml-[232px] p-4 lg:p-6 overflow-y-auto space-y-5 bg-slate-50">
          {/* Page Title & KPI Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-red-100 text-red-700 rounded-lg">
                  <Siren className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Response & Actions Center
                </h1>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                  {pendingCount} Pending
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Field team deployment, emergency task acknowledgment, and resource assignment for Mangaluru North coast.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
                title="Reset actions"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
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

          {/* KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-3.5 rounded-lg border border-slate-200/90 shadow-2xs border-l-4 border-l-red-600">
              <span className="text-xs font-medium text-slate-500">Pending Actions</span>
              <div className="text-2xl font-bold text-red-600 mt-1 tabular-nums">{pendingCount}</div>
              <span className="text-[11px] text-slate-500">Requires duty officer dispatch</span>
            </div>
            <div className="bg-white p-3.5 rounded-lg border border-slate-200/90 shadow-2xs border-l-4 border-l-amber-500">
              <span className="text-xs font-medium text-slate-500">Dispatched Teams</span>
              <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{dispatchedCount}</div>
              <span className="text-[11px] text-slate-500">En route / on scene</span>
            </div>
            <div className="bg-white p-3.5 rounded-lg border border-slate-200/90 shadow-2xs border-l-4 border-l-emerald-600">
              <span className="text-xs font-medium text-slate-500">Completed Actions</span>
              <div className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">{doneCount}</div>
              <span className="text-[11px] text-slate-500">Secured & verified</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Status:
              </span>
              {(['all', 'pending', 'dispatched', 'done'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilter(st)}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-semibold transition-colors capitalize',
                    filter === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Zone:</span>
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-md px-2.5 py-1 font-medium focus:ring-2 focus:ring-slate-900"
              >
                <option value="all">All Zones</option>
                <option value="B">Zone B (Panambur)</option>
                <option value="F">Zone F (Tannirbhavi)</option>
                <option value="C">Zone C (Surathkal)</option>
              </select>
            </div>
          </div>

          {/* Actions List */}
          <div className="space-y-3">
            {filteredActions.map((act) => {
              const isPending = act.status === 'unassigned';
              const isDispatched = act.status === 'dispatched';
              const isDone = act.status === 'done';

              return (
                <div
                  key={act.id}
                  className={cn(
                    'bg-white p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs',
                    isPending
                      ? 'border-red-200 hover:border-red-300'
                      : isDispatched
                      ? 'border-amber-200 hover:border-amber-300'
                      : 'border-slate-200 bg-slate-50/50'
                  )}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => handleMarkDone(act.id)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                      title={isDone ? 'Mark as incomplete' : 'Mark as done'}
                    />

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={cn(
                            'text-sm font-bold',
                            isDone ? 'line-through text-slate-400' : 'text-slate-900'
                          )}
                        >
                          {act.title}
                        </span>

                        <span
                          className={cn(
                            'text-[10px] font-bold px-1.5 py-0.2 rounded border',
                            act.priority === 'Urgent'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : act.priority === 'High'
                              ? 'bg-orange-50 text-orange-700 border-orange-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          )}
                        >
                          {act.priority}
                        </span>

                        <span className="text-xs text-slate-500 font-medium">
                          {act.zoneName}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{act.team}</span>
                        </span>

                        {act.facility && (
                          <span className="flex items-center gap-1 text-slate-600">
                            <Shield className="w-3.5 h-3.5 text-blue-600" />
                            <span>Facility: {act.facility}</span>
                          </span>
                        )}

                        {act.timestamp && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Updated {act.timestamp}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isPending ? (
                      <button
                        onClick={() => handleDispatch(act.id, act.team)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Dispatch Team</span>
                      </button>
                    ) : isDispatched ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                          Dispatched · On Scene
                        </span>
                        <button
                          onClick={() => handleMarkDone(act.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-colors"
                        >
                          Complete
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </span>
                    )}

                    <Link
                      href={`/?zone=${act.zoneId}`}
                      className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
                      title="Inspect Zone on Map"
                    >
                      Map
                    </Link>
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
