'use client';

import React from 'react';
import type { FactorContribution } from '@/types/dashboard';

interface WhyPanelProps {
  factors: FactorContribution[];
  explanation: string;
  title?: string;
}

export function WhyPanel({ factors, explanation, title = 'Why is this critical?' }: WhyPanelProps) {
  return (
    <div className="flex flex-col gap-2 pt-1 border-t border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-900 font-bold uppercase tracking-wider">
          {title}
        </span>
        <span className="text-[11px] text-slate-500 font-medium">Illustrative attribution — unvalidated</span>
      </div>

      {/* Contribution Bars */}
      <div className="space-y-2">
        {factors.map((factor) => {
          // Accurate percentage width calculation
          const pct = Math.max(0, Math.min(factor.percentage, 100));
          return (
            <div key={factor.name} className="flex flex-col gap-0.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-700 font-medium">
                  {factor.name} <span className="text-slate-400 font-normal">({factor.detail})</span>
                </span>
                <span className="font-bold tabular-nums text-slate-900 ml-2">
                  {pct}%
                </span>
              </div>
              {/* Light gray track with accurate single-color teal bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/60">
                <div
                  className="bg-teal-700 h-full rounded-full transition-all duration-300"
                  style={{ width: `${pct}%` }}
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Plain Language Explanation (2 sentences max) */}
      <div className="p-2.5 bg-slate-50 rounded-md text-xs text-slate-700 border-l-3 border-teal-700 mt-1 leading-relaxed">
        {explanation}
      </div>
    </div>
  );
}
