'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { useAuth, usePermission } from '@/hooks/useAuth';
import {
  SHORTCUT_REGISTRY,
  ShortcutActionId,
  getDefaultBindings,
  loadUserBindings,
  saveUserBindings,
  normalizeKeyEvent,
  formatKeycapDisplay,
  isReservedKey,
} from '@/lib/shortcuts';

export interface ShortcutConflict {
  actionId: ShortcutActionId;
  key: string;
  conflictingActionId: ShortcutActionId;
}

export function useShortcuts(
  actionHandlers: Partial<Record<ShortcutActionId, () => void>> = {},
  options: { isCapturing?: boolean } = {}
) {
  const { currentUser } = useAuth();
  const { can } = usePermission();
  const [bindings, setBindings] = useState<Record<ShortcutActionId, string>>(() =>
    loadUserBindings(currentUser.id)
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Re-load bindings whenever active user changes
  useEffect(() => {
    setBindings(loadUserBindings(currentUser.id));
  }, [currentUser.id]);

  // Show transient toast
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 2800);
  }, []);

  // Update a single binding
  const updateBinding = useCallback(
    (actionId: ShortcutActionId, newKey: string): { success: boolean; conflictWith?: ShortcutActionId; reason?: string } => {
      const normalized = newKey.toLowerCase();

      // Check reserved key
      const reservedCheck = isReservedKey(normalized);
      if (reservedCheck.reserved) {
        return { success: false, reason: reservedCheck.reason };
      }

      // Check conflict
      const conflictingEntry = Object.entries(bindings).find(
        ([id, key]) => id !== actionId && key.toLowerCase() === normalized
      );

      if (conflictingEntry) {
        return { success: false, conflictWith: conflictingEntry[0] as ShortcutActionId };
      }

      const nextBindings = {
        ...bindings,
        [actionId]: normalized,
      };

      setBindings(nextBindings);
      saveUserBindings(currentUser.id, nextBindings);
      return { success: true };
    },
    [bindings, currentUser.id]
  );

  // Swap conflicting keys
  const swapBindings = useCallback(
    (actionId: ShortcutActionId, conflictingActionId: ShortcutActionId) => {
      const keyA = bindings[actionId];
      const keyB = bindings[conflictingActionId];

      const nextBindings = {
        ...bindings,
        [actionId]: keyB,
        [conflictingActionId]: keyA,
      };

      setBindings(nextBindings);
      saveUserBindings(currentUser.id, nextBindings);
    },
    [bindings, currentUser.id]
  );

  // Reset single action to default
  const resetActionBinding = useCallback(
    (actionId: ShortcutActionId) => {
      const defaults = getDefaultBindings();
      const defaultKey = defaults[actionId];

      // Remove any other action that might currently have this key
      const nextBindings = { ...bindings };
      Object.keys(nextBindings).forEach((keyId) => {
        if (nextBindings[keyId as ShortcutActionId] === defaultKey) {
          nextBindings[keyId as ShortcutActionId] = '';
        }
      });
      nextBindings[actionId] = defaultKey;

      setBindings(nextBindings);
      saveUserBindings(currentUser.id, nextBindings);
    },
    [bindings, currentUser.id]
  );

  // Reset all actions to defaults for current user
  const resetAllBindings = useCallback(() => {
    const defaults = getDefaultBindings();
    setBindings(defaults);
    saveUserBindings(currentUser.id, defaults);
  }, [currentUser.id]);

  // Global key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if capture mode is active in the modal
      if (options.isCapturing) return;

      // Ignore if user is typing in form controls or contenteditable
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const normalized = normalizeKeyEvent(e);
      if (!normalized) return;

      // Find matching action in current bindings
      const matchedEntry = Object.entries(bindings).find(
        ([, key]) => key.toLowerCase() === normalized
      );

      if (!matchedEntry) return;

      const [actionId] = matchedEntry as [ShortcutActionId, string];
      const definition = SHORTCUT_REGISTRY[actionId];

      // Prevent default browser action for handled shortcuts
      // (except when user pressed a modifier combo that isn't mapped)
      e.preventDefault();

      // Check permission gating
      if (definition?.permission && !can(definition.permission)) {
        showToast('View only for your role');
        return;
      }

      // Execute registered action handler if available
      const handler = actionHandlers[actionId];
      if (handler) {
        handler();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bindings, actionHandlers, can, options.isCapturing, showToast]);

  return {
    bindings,
    updateBinding,
    swapBindings,
    resetActionBinding,
    resetAllBindings,
    toastMessage,
    formatKeycapDisplay,
    getBindingDisplay: (actionId: ShortcutActionId) => formatKeycapDisplay(bindings[actionId] || ''),
    canPerformAction: (actionId: ShortcutActionId) => {
      const def = SHORTCUT_REGISTRY[actionId];
      return !def.permission || can(def.permission);
    },
  };
}
