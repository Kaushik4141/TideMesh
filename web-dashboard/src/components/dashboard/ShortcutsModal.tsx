'use client';

import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

export function ShortcutsModal({ open, onClose }: ShortcutsModalProps) {
  if (!open) return null;

  const shortcuts = [
    { key: '1', desc: 'Select #1 Priority Zone (Zone B)' },
    { key: '2', desc: 'Select #2 Priority Zone (Zone F)' },
    { key: '3', desc: 'Select #3 Priority Zone (Zone C)' },
    { key: 'A', desc: 'Acknowledge currently selected zone' },
    { key: 'Space', desc: 'Play / Pause timeline playback' },
    { key: 'Esc', desc: 'Close drawer or modal' },
    { key: '?', desc: 'Toggle keyboard shortcuts menu' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
    >
      <div
        className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-slate-100 rounded-md text-slate-700">
              <Keyboard className="w-4 h-4" />
            </div>
            <h2 id="shortcuts-modal-title" className="text-sm font-bold text-slate-900">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors focus:ring-2 focus:ring-slate-400 focus:outline-hidden"
            aria-label="Close shortcuts modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          {shortcuts.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between text-xs py-1.5 px-2 rounded-md hover:bg-slate-50 border border-transparent hover:border-slate-100"
            >
              <span className="text-slate-600">{s.desc}</span>
              <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 text-slate-800 font-mono font-bold rounded shadow-2xs text-[11px]">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 text-center">
          Shortcuts are disabled when typing inside input boxes.
        </div>
      </div>
    </div>
  );
}
