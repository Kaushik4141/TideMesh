'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, RotateCcw, AlertTriangle, ShieldAlert } from 'lucide-react';
import {
  SHORTCUT_REGISTRY,
  ShortcutActionId,
  normalizeKeyEvent,
  formatKeycapDisplay,
  getDefaultBindings,
} from '@/lib/shortcuts';
import { useAuth, usePermission } from '@/hooks/useAuth';

interface ShortcutsCustomizationModalProps {
  open: boolean;
  onClose: () => void;
  bindings: Record<ShortcutActionId, string>;
  onUpdateBinding: (actionId: ShortcutActionId, key: string) => { success: boolean; conflictWith?: ShortcutActionId; reason?: string };
  onSwapBindings: (actionId: ShortcutActionId, conflictingActionId: ShortcutActionId) => void;
  onResetAction: (actionId: ShortcutActionId) => void;
  onResetAll: () => void;
  setIsCapturingKey: (capturing: boolean) => void;
}

export function ShortcutsCustomizationModal({
  open,
  onClose,
  bindings,
  onUpdateBinding,
  onSwapBindings,
  onResetAction,
  onResetAll,
  setIsCapturingKey,
}: ShortcutsCustomizationModalProps) {
  const { currentUser } = useAuth();
  const { can } = usePermission();

  const [activeCaptureActionId, setActiveCaptureActionId] = useState<ShortcutActionId | null>(null);
  const [conflictState, setConflictState] = useState<{
    targetActionId: ShortcutActionId;
    conflictingActionId: ShortcutActionId;
    attemptedKey: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  // Sync capture state with parent hook
  useEffect(() => {
    setIsCapturingKey(Boolean(activeCaptureActionId));
  }, [activeCaptureActionId, setIsCapturingKey]);

  // Focus trap inside modal when open
  useEffect(() => {
    if (!open) {
      setActiveCaptureActionId(null);
      setConflictState(null);
      setErrorMessage(null);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // If in capture mode, handle key capture
      if (activeCaptureActionId) {
        e.preventDefault();
        e.stopPropagation();

        if (e.key === 'Escape') {
          setActiveCaptureActionId(null);
          setErrorMessage(null);
          return;
        }

        const normalized = normalizeKeyEvent(e);
        if (!normalized) return;

        const res = onUpdateBinding(activeCaptureActionId, normalized);
        if (res.success) {
          setActiveCaptureActionId(null);
          setErrorMessage(null);
        } else if (res.conflictWith) {
          setConflictState({
            targetActionId: activeCaptureActionId,
            conflictingActionId: res.conflictWith,
            attemptedKey: normalized,
          });
          setActiveCaptureActionId(null);
          setErrorMessage(null);
        } else if (res.reason) {
          setErrorMessage(res.reason);
        }
        return;
      }

      // If Escape pressed while not capturing, close modal
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [open, activeCaptureActionId, onUpdateBinding, onClose]);

  if (!open) return null;

  const actions = Object.values(SHORTCUT_REGISTRY);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={() => {
        if (!activeCaptureActionId && !conflictState) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
    >
      {/* Hidden Live Region for Screen Readers */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {activeCaptureActionId
          ? `Press a key to rebind ${SHORTCUT_REGISTRY[activeCaptureActionId].label}. Press Escape to cancel.`
          : ''}
      </div>

      <div
        ref={modalRef}
        className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 relative text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex flex-col">
            <h2 id="shortcuts-modal-title" className="text-lg font-bold text-slate-900 tracking-tight">
              Keyboard Shortcuts
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configured for <span className="font-semibold text-slate-800">{currentUser.name}</span> ({currentUser.roleTitle}). Click any keycap to rebind.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onResetAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors focus-visible:ring-2 focus-visible:ring-slate-900 min-h-[44px]"
              title="Reset all bindings to defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All</span>
            </button>
            <button
              onClick={onClose}
              className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors focus-visible:ring-2 focus-visible:ring-slate-900"
              aria-label="Close shortcuts dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conflict Resolution Banner */}
        {conflictState && (
          <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                Key &ldquo;{formatKeycapDisplay(conflictState.attemptedKey)}&rdquo; is already used by &ldquo;{SHORTCUT_REGISTRY[conflictState.conflictingActionId].label}&rdquo;
              </span>
            </div>
            <p className="text-[11px] text-amber-800">
              Would you like to swap the key between &ldquo;{SHORTCUT_REGISTRY[conflictState.targetActionId].label}&rdquo; and &ldquo;{SHORTCUT_REGISTRY[conflictState.conflictingActionId].label}&rdquo;?
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  onSwapBindings(conflictState.targetActionId, conflictState.conflictingActionId);
                  setConflictState(null);
                }}
                className="px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-md font-bold text-xs shadow-xs min-h-[44px]"
              >
                Swap
              </button>
              <button
                onClick={() => setConflictState(null)}
                className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 rounded-md font-semibold text-xs min-h-[44px]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Error Message Banner */}
        {errorMessage && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-700 font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Action List Grid */}
        <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
          {actions.map((act) => {
            const currentKey = bindings[act.id] || '';
            const isCapturing = activeCaptureActionId === act.id;
            const isPermitted = !act.permission || can(act.permission);
            const defaultKey = getDefaultBindings()[act.id];
            const isModified = currentKey !== defaultKey;

            return (
              <div
                key={act.id}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors min-h-[44px]"
              >
                {/* Left: Action description & permission badge */}
                <div className="flex flex-col min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 truncate">
                      {act.label}
                    </span>
                    {!isPermitted && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
                        View only
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 truncate mt-0.5">
                    {act.description}
                  </span>
                </div>

                {/* Right: Keycap button & reset action */}
                <div className="flex items-center gap-2 shrink-0">
                  {isCapturing ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border-2 border-blue-600 rounded-lg text-blue-900 font-bold text-xs animate-pulse min-h-[44px]">
                      <span>Press a key…</span>
                      <span className="text-[10px] font-normal text-blue-700">(Esc to cancel)</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setConflictState(null);
                        setErrorMessage(null);
                        setActiveCaptureActionId(act.id);
                      }}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 active:translate-y-0.5 text-slate-900 font-mono font-bold rounded-lg shadow-2xs text-xs transition-all focus-visible:ring-2 focus-visible:ring-slate-900 min-h-[44px] min-w-[54px] text-center"
                      title={`Click to rebind ${act.label}`}
                      aria-label={`Current key for ${act.label} is ${formatKeycapDisplay(currentKey) || 'unbound'}. Click to rebind.`}
                    >
                      {formatKeycapDisplay(currentKey) || 'None'}
                    </button>
                  )}

                  {isModified && (
                    <button
                      onClick={() => onResetAction(act.id)}
                      className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Reset this shortcut to default"
                      aria-label={`Reset ${act.label} to default`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Reserved browser keys (Tab, Enter, F-keys, Ctrl+R, etc.) are protected.</span>
          <span>Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[11px] font-mono text-slate-700">?</kbd> anytime to open.</span>
        </div>
      </div>
    </div>
  );
}
