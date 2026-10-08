export type ShortcutActionId =
  | 'acknowledge'
  | 'assignTeam'
  | 'selectZone1'
  | 'selectZone2'
  | 'selectZone3'
  | 'nextZone'
  | 'prevZone'
  | 'openZone'
  | 'closeDrawer'
  | 'toggleTimeline'
  | 'jumpNow'
  | 'jumpOnset'
  | 'focusAlerts'
  | 'openShortcuts';

export interface ShortcutDefinition {
  id: ShortcutActionId;
  label: string;
  description: string;
  defaultKey: string; // e.g. "a", "s", "1", "]", "[", "o", "escape", " ", "n", "t", "l", "?"
  permission?: 'acknowledge' | 'assignTeam' | 'manageAlerts';
  category: 'Actions' | 'Navigation' | 'Timeline' | 'General';
}

export const SHORTCUT_REGISTRY: Record<ShortcutActionId, ShortcutDefinition> = {
  acknowledge: {
    id: 'acknowledge',
    label: 'Acknowledge',
    description: 'Acknowledge currently selected zone alert',
    defaultKey: 'a',
    permission: 'acknowledge',
    category: 'Actions',
  },
  assignTeam: {
    id: 'assignTeam',
    label: 'Assign Team',
    description: 'Assign response team to primary zone action',
    defaultKey: 's',
    permission: 'assignTeam',
    category: 'Actions',
  },
  selectZone1: {
    id: 'selectZone1',
    label: 'Select Priority #1 Zone',
    description: 'Quickly select priority rank 1 zone (Zone B)',
    defaultKey: '1',
    category: 'Navigation',
  },
  selectZone2: {
    id: 'selectZone2',
    label: 'Select Priority #2 Zone',
    description: 'Quickly select priority rank 2 zone (Zone F)',
    defaultKey: '2',
    category: 'Navigation',
  },
  selectZone3: {
    id: 'selectZone3',
    label: 'Select Priority #3 Zone',
    description: 'Quickly select priority rank 3 zone (Zone C)',
    defaultKey: '3',
    category: 'Navigation',
  },
  nextZone: {
    id: 'nextZone',
    label: 'Next Zone',
    description: 'Cycle to next priority zone',
    defaultKey: ']',
    category: 'Navigation',
  },
  prevZone: {
    id: 'prevZone',
    label: 'Previous Zone',
    description: 'Cycle to previous priority zone',
    defaultKey: '[',
    category: 'Navigation',
  },
  openZone: {
    id: 'openZone',
    label: 'Open Zone Directory',
    description: 'Navigate to full zone flood directory',
    defaultKey: 'o',
    category: 'Navigation',
  },
  closeDrawer: {
    id: 'closeDrawer',
    label: 'Close Drawer / Modal',
    description: 'Close zone detail drawer or active dialog',
    defaultKey: 'escape',
    category: 'Navigation',
  },
  toggleTimeline: {
    id: 'toggleTimeline',
    label: 'Play / Pause Timeline',
    description: 'Toggle flood simulation replay playback',
    defaultKey: ' ',
    category: 'Timeline',
  },
  jumpNow: {
    id: 'jumpNow',
    label: 'Jump to Current Telemetry (NOW)',
    description: 'Reset timeline to current live observation time (14:26)',
    defaultKey: 'n',
    category: 'Timeline',
  },
  jumpOnset: {
    id: 'jumpOnset',
    label: 'Jump to Onset',
    description: 'Jump timeline to predicted flood onset (14:30)',
    defaultKey: 't',
    category: 'Timeline',
  },
  focusAlerts: {
    id: 'focusAlerts',
    label: 'Focus Alerts',
    description: 'Navigate to active incident alerts page',
    defaultKey: 'l',
    category: 'Navigation',
  },
  openShortcuts: {
    id: 'openShortcuts',
    label: 'Open Keyboard Shortcuts',
    description: 'Show shortcuts customization panel',
    defaultKey: '?',
    category: 'General',
  },
};

export const SHORTCUTS_STORAGE_VERSION = 1;

export interface StoredShortcuts {
  version: number;
  bindings: Record<ShortcutActionId, string>;
}

/**
 * Returns default bindings mapping { actionId: normalizedKey }
 */
export function getDefaultBindings(): Record<ShortcutActionId, string> {
  const bindings = {} as Record<ShortcutActionId, string>;
  (Object.keys(SHORTCUT_REGISTRY) as ShortcutActionId[]).forEach((id) => {
    bindings[id] = SHORTCUT_REGISTRY[id].defaultKey;
  });
  return bindings;
}

/**
 * Normalizes keyboard event into a standardized string e.g. "a", "shift+a", "alt+1", "escape", " "
 */
export function normalizeKeyEvent(e: KeyboardEvent | { key: string; altKey?: boolean; ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean }): string {
  const parts: string[] = [];
  if (e.ctrlKey) parts.push('ctrl');
  if (e.altKey) parts.push('alt');
  if (e.metaKey) parts.push('meta');
  if (e.shiftKey) parts.push('shift');

  let key = e.key;
  if (!key) return '';

  // Standardize key names
  const lower = key.toLowerCase();
  if (lower === 'escape' || lower === 'esc') {
    key = 'escape';
  } else if (key === ' ' || lower === 'space' || lower === 'spacebar') {
    key = ' ';
  } else if (lower.startsWith('arrow')) {
    key = lower;
  } else {
    // Single character or other keys
    key = lower;
  }

  // If shift is pressed and produces uppercase or shifted character (like '?'), prevent 'shift+?'
  if (e.shiftKey && key.length === 1 && key !== lower) {
    // If shift was already applied to character, we can drop shift from prefix if needed
    const shiftIdx = parts.indexOf('shift');
    if (shiftIdx !== -1) {
      parts.splice(shiftIdx, 1);
    }
  }

  // Avoid duplicate key if it is modifier itself
  if (['control', 'ctrl', 'alt', 'meta', 'shift'].includes(lower)) {
    return '';
  }

  parts.push(key);
  return parts.join('+');
}

/**
 * Pretty human representation for display on buttons and keycaps
 */
export function formatKeycapDisplay(normalizedKey: string): string {
  if (!normalizedKey) return '';
  if (normalizedKey === ' ') return 'Space';
  if (normalizedKey === 'escape') return 'Esc';

  return normalizedKey
    .split('+')
    .map((part) => {
      if (part === ' ') return 'Space';
      if (part === 'escape') return 'Esc';
      if (part === 'ctrl') return 'Ctrl';
      if (part === 'alt') return 'Alt';
      if (part === 'shift') return 'Shift';
      if (part.length === 1) return part.toUpperCase();
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join('+');
}

/**
 * Checks if a key combination is reserved by the browser or system
 */
export function isReservedKey(normalizedKey: string): { reserved: boolean; reason?: string } {
  const lower = normalizedKey.toLowerCase();
  
  if (!lower) {
    return { reserved: true, reason: 'Key cannot be empty' };
  }

  // System & reserved navigation keys
  if (lower === 'tab' || lower === 'enter') {
    return { reserved: true, reason: `"${formatKeycapDisplay(lower)}" is reserved for focus navigation.` };
  }

  // F-keys (F1 to F12)
  if (/^f(1[0-2]|[1-9])$/.test(lower)) {
    return { reserved: true, reason: 'F1–F12 function keys are reserved for browser and system functions.' };
  }

  // Dangerous browser combos
  const reservedCombos = [
    'ctrl+r',
    'ctrl+w',
    'ctrl+t',
    'ctrl+n',
    'ctrl+p',
    'ctrl+f',
    'ctrl+l',
    'ctrl+h',
    'ctrl+j',
    'ctrl+u',
    'ctrl+shift+r',
    'ctrl+shift+i',
    'ctrl+shift+c',
    'ctrl+shift+j',
    'alt+f4',
    'alt+left',
    'alt+right',
  ];

  if (reservedCombos.includes(lower)) {
    return { reserved: true, reason: `"${formatKeycapDisplay(lower)}" is reserved by the browser.` };
  }

  return { reserved: false };
}

/**
 * Load user bindings from localStorage with corruption fallback
 */
export function loadUserBindings(userId: string): Record<ShortcutActionId, string> {
  const defaults = getDefaultBindings();
  const storage = typeof window !== 'undefined' ? window.localStorage : (typeof globalThis !== 'undefined' ? (globalThis as any).localStorage : null);
  if (!storage) return defaults;

  try {
    const raw = storage.getItem(`tidemesh:shortcuts:${userId}`);
    if (!raw) return defaults;

    const parsed: StoredShortcuts = JSON.parse(raw);
    if (!parsed || parsed.version !== SHORTCUTS_STORAGE_VERSION || typeof parsed.bindings !== 'object') {
      return defaults;
    }

    // Merge with defaults in case new actions were added
    return {
      ...defaults,
      ...parsed.bindings,
    };
  } catch {
    // Corrupted data falls back to defaults
    return defaults;
  }
}

/**
 * Save user bindings to localStorage
 */
export function saveUserBindings(userId: string, bindings: Record<ShortcutActionId, string>): void {
  const storage = typeof window !== 'undefined' ? window.localStorage : (typeof globalThis !== 'undefined' ? (globalThis as any).localStorage : null);
  if (!storage) return;

  try {
    const data: StoredShortcuts = {
      version: SHORTCUTS_STORAGE_VERSION,
      bindings,
    };
    storage.setItem(`tidemesh:shortcuts:${userId}`, JSON.stringify(data));
  } catch {
    // Ignore storage quota or disabled errors
  }
}
