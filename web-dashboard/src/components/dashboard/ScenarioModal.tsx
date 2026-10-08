'use client';

import React, { useState } from 'react';
import { X, CloudRain, ArrowRight, ShieldAlert, Zap, AlertTriangle } from 'lucide-react';
import type { ScenarioParameters } from '@/lib/api/types';

interface ScenarioModalProps {
  open: boolean;
  onClose: () => void;
  initialParams?: ScenarioParameters;
  onRunScenario?: (params: ScenarioParameters) => void;
}

export function ScenarioModal({
  open,
  onClose,
  initialParams,
  onRunScenario,
}: ScenarioModalProps) {
  const [rainfallRate, setRainfallRate] = useState<number>(
    initialParams?.rainfallRateMmHr ?? 110
  );
  const [surgeLevel, setSurgeLevel] = useState<number>(
    initialParams?.surgeLevelM ?? 2.8
  );
  const [breachSeaWall, setBreachSeaWall] = useState<boolean>(
    initialParams?.breachSeaWall ?? true
  );

  if (!open) return null;

  const handleRun = () => {
    onRunScenario?.({
      rainfallRateMmHr: rainfallRate,
      surgeLevelM: surgeLevel,
      scenarioName: `What-If Contingency: Cloudburst (+${rainfallRate} mm/hr) + ${surgeLevel}m Surge`,
      breachSeaWall,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="scenario-modal-title"
    >
      <div
        className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-800">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="scenario-modal-title" className="text-sm font-extrabold text-slate-900">
                  What-If Contingency Stress Test
                </h2>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded border border-amber-300 uppercase">
                  Hypothetical
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium block">
                SFINCS Numerical Hydrodynamic Solver · Scenario Mode
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close scenario modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Explicit Warning Banner */}
        <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-xs flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="text-amber-800 text-[11px] leading-relaxed font-medium">
            <strong>Contingency Planning Mode:</strong> This simulates a hypothetical worst-case
            cloudburst and high storm surge. Outputs will be explicitly labeled as{' '}
            <strong className="text-amber-900">SCENARIO — HYPOTHETICAL</strong> on the command
            center map.
          </p>
        </div>

        {/* Parameter Sliders */}
        <div className="space-y-3.5 bg-slate-50/70 p-3.5 rounded-lg border border-slate-200">
          {/* Rainfall Intensity Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-blue-600" />
                <span>Rainfall Intensity (Cloudburst)</span>
              </span>
              <span className="font-mono font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {rainfallRate} mm/hr
              </span>
            </div>
            <input
              type="range"
              min={30}
              max={180}
              step={5}
              value={rainfallRate}
              onChange={(e) => setRainfallRate(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>30 mm/hr (Heavy)</span>
              <span>110 mm/hr (Extreme)</span>
              <span>180 mm/hr (Cloudburst)</span>
            </div>
          </div>

          {/* Storm Surge Slider */}
          <div className="space-y-1.5 pt-1 border-t border-slate-200/60">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700">Storm Surge / High Tide Level</span>
              <span className="font-mono font-extrabold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                +{surgeLevel.toFixed(2)} m MSL
              </span>
            </div>
            <input
              type="range"
              min={0.5}
              max={4.0}
              step={0.1}
              value={surgeLevel}
              onChange={(e) => setSurgeLevel(Number(e.target.value))}
              className="w-full accent-teal-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>+0.5 m (Normal High Tide)</span>
              <span>+2.0 m (1-in-50 Yr)</span>
              <span>+4.0 m (Catastrophic)</span>
            </div>
          </div>

          {/* Sea Wall Overtopping Toggle */}
          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Coastline Sea Wall Overtopping
              </span>
              <span className="text-[10px] text-slate-500">
                Simulate wave overtopping along Panambur coastal revetment
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={breachSeaWall}
                onChange={(e) => setBreachSeaWall(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-slate-600 hover:text-slate-800 text-xs font-semibold rounded hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRun}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-md transition-colors cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Run What-If Scenario Stress Test</span>
          </button>
        </div>
      </div>
    </div>
  );
}
