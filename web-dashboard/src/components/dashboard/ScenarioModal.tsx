'use client';

import React from 'react';
import { X, CloudRain, AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';
import { DEMO_SCENARIO, type DemoScenario } from '@/data/demoFloodEvent';

interface ScenarioModalProps {
  open: boolean;
  onClose: () => void;
  scenario?: DemoScenario;
}

export function ScenarioModal({ open, onClose, scenario = DEMO_SCENARIO }: ScenarioModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="scenario-modal-title"
    >
      <div
        className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-lg w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 rounded-md text-blue-700">
              <CloudRain className="w-4 h-4" />
            </div>
            <div>
              <h2 id="scenario-modal-title" className="text-sm font-bold text-slate-900">
                What-If Scenario: {scenario.name}
              </h2>
              <span className="text-[11px] text-slate-500 font-medium">
                Simulation Model v1.2 · Stress Test
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
            aria-label="Close scenario modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Rainfall Intensity Shift */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Baseline Rainfall
            </span>
            <span className="text-sm font-bold text-slate-900 mt-0.5">
              {scenario.baselineRainfall}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2 text-slate-400">
            <ArrowRight className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-blue-600">+29% Surge</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
              Scenario Rainfall
            </span>
            <span className="text-sm font-bold text-blue-900 mt-0.5">
              {scenario.scenarioRainfall}
            </span>
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Baseline */}
          <div className="bg-white p-3 rounded-md border border-slate-200 space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block border-b pb-1">
              Baseline Event
            </span>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-600">Buildings:</span>
              <strong className="text-slate-900">{scenario.baseline.buildings}</strong>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-600">Roads affected:</span>
              <strong className="text-slate-900">{scenario.baseline.roads}</strong>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-600">Population:</span>
              <strong className="text-slate-900">{scenario.baseline.population.toLocaleString()}</strong>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-600">Critical facilities:</span>
              <strong className="text-slate-900">{scenario.baseline.facilities}</strong>
            </div>
          </div>

          {/* Scenario Result */}
          <div className="bg-red-50/50 p-3 rounded-md border border-red-200 space-y-1.5">
            <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider block border-b border-red-200 pb-1 flex items-center justify-between">
              <span>Heavier Rainfall</span>
              <span className="text-[9px] bg-red-600 text-white px-1 rounded font-bold">PEAK</span>
            </span>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-600">Buildings:</span>
              <strong className="text-red-700">{scenario.scenario.buildings} (+65%)</strong>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-600">Roads affected:</span>
              <strong className="text-red-700">{scenario.scenario.roads} (+150%)</strong>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-600">Population:</span>
              <strong className="text-red-700">{scenario.scenario.population.toLocaleString()}</strong>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-600">Critical facilities:</span>
              <strong className="text-red-700">{scenario.scenario.facilities} (Hospital H1)</strong>
            </div>
          </div>
        </div>

        {/* Operational Result Callout */}
        <div className="p-3 bg-amber-50 rounded-md border border-amber-300 text-xs flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-amber-900 block">Strategic Impact:</span>
            <span className="text-amber-800 leading-relaxed font-medium">
              {scenario.result}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-1">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
