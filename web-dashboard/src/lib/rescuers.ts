'use client';

export interface Rescuer {
  id: string;
  name: string;
  phone: string; // Formatted as '+91 XXXXX XXXXX'
  addedBy: string;
  addedAt: string; // ISO 8601 string
  status: 'Available' | 'Deployed' | 'Off-duty';
}

export interface AuditEntry {
  id: string;
  actor: string;
  role: string;
  action: string;
  details: string;
  timestamp: string; // ISO 8601 string
}

const RESCUERS_STORAGE_KEY = 'tidemesh:rescuers';
const AUDIT_STORAGE_KEY = 'tidemesh:audit';

export const INITIAL_RESCUERS: Rescuer[] = [
  {
    id: 'rescuer-1',
    name: 'Suresh Kumar',
    phone: '+91 98450 12345',
    addedBy: 'A. K. Sharma',
    addedAt: '2026-10-08T08:00:00.000Z',
    status: 'Available',
  },
  {
    id: 'rescuer-2',
    name: 'Pooja Hegde',
    phone: '+91 94480 67890',
    addedBy: 'A. K. Sharma',
    addedAt: '2026-10-08T08:15:00.000Z',
    status: 'Available',
  },
  {
    id: 'rescuer-3',
    name: 'Manish Poojary',
    phone: '+91 87620 54321',
    addedBy: 'A. K. Sharma',
    addedAt: '2026-10-08T08:30:00.000Z',
    status: 'Available',
  },
];

/**
 * Normalizes input raw phone to 10 digits if valid Indian mobile.
 * Accepts optional +91 or 0 prefix, strips all spaces and hyphens.
 * Returns null if not a valid 10-digit Indian mobile starting with 6-9.
 */
export function validateAndExtractIndianMobile(raw: string): string | null {
  // Strip spaces, dashes, parentheses
  const cleaned = raw.replace(/[\s\-()]/g, '');
  // Match optional +91 or 0 prefix followed by 10 digits starting with 6-9
  const match = cleaned.match(/^(?:\+91|0)?([6-9]\d{9})$/);
  if (!match) return null;
  return match[1]; // 10 digit string
}

/**
 * Formats a 10-digit number to standard display: '+91 XXXXX XXXXX'
 */
export function formatNormalizedPhone(tenDigits: string): string {
  return `+91 ${tenDigits.slice(0, 5)} ${tenDigits.slice(5)}`;
}

/**
 * Validates rescuer name (2–60 chars, letters, spaces, dots, hyphens; trimmed)
 */
export function validateRescuerName(name: string): { isValid: boolean; error?: string; trimmed: string } {
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters long.', trimmed };
  }
  if (trimmed.length > 60) {
    return { isValid: false, error: 'Name must not exceed 60 characters.', trimmed };
  }
  // Allow letters, spaces, dots, hyphens
  const nameRegex = /^[a-zA-Z\s.\-]+$/;
  if (!nameRegex.test(trimmed)) {
    return { isValid: false, error: 'Name may only contain letters, spaces, dots, and hyphens.', trimmed };
  }
  return { isValid: true, trimmed };
}

/**
 * Retrieves rescuers list from localStorage or initial mock data
 */
export function getRescuers(): Rescuer[] {
  if (typeof window === 'undefined') return INITIAL_RESCUERS;
  try {
    const raw = localStorage.getItem(RESCUERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(RESCUERS_STORAGE_KEY, JSON.stringify(INITIAL_RESCUERS));
      return INITIAL_RESCUERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_RESCUERS;
  } catch {
    return INITIAL_RESCUERS;
  }
}

/**
 * Saves rescuers to localStorage
 */
export function saveRescuers(rescuers: Rescuer[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(RESCUERS_STORAGE_KEY, JSON.stringify(rescuers));
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Retrieves audit entries from localStorage
 */
export function getAuditEntries(): AuditEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Records an audit log entry
 */
export function logAuditEntry(entry: Omit<AuditEntry, 'id' | 'timestamp'>): AuditEntry {
  const newEntry: AuditEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ...entry,
    timestamp: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      const current = getAuditEntries();
      const updated = [newEntry, ...current];
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  }

  return newEntry;
}

/**
 * Checks for existing rescuer with the same phone number
 */
export function findDuplicatePhone(normalizedPhone: string, rescuers = getRescuers()): Rescuer | undefined {
  // Compare 10 digits
  const targetDigits = normalizedPhone.replace(/\D/g, '').slice(-10);
  return rescuers.find((r) => {
    const rDigits = r.phone.replace(/\D/g, '').slice(-10);
    return rDigits === targetDigits;
  });
}

/**
 * Adds a new rescuer to the store and logs an audit record
 */
export function addRescuer(
  name: string,
  formattedPhone: string,
  currentUser: { name: string; roleTitle: string }
): { success: boolean; rescuer?: Rescuer; error?: string } {
  const currentRescuers = getRescuers();
  const duplicate = findDuplicatePhone(formattedPhone, currentRescuers);
  if (duplicate) {
    return {
      success: false,
      error: `This number is already added (${duplicate.name})`,
    };
  }

  const newRescuer: Rescuer = {
    id: `rescuer-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name,
    phone: formattedPhone,
    addedBy: currentUser.name,
    addedAt: new Date().toISOString(),
    status: 'Available',
  };

  const updated = [...currentRescuers, newRescuer];
  saveRescuers(updated);

  logAuditEntry({
    actor: currentUser.name,
    role: currentUser.roleTitle,
    action: 'Added rescuer',
    details: `${name} (${formattedPhone})`,
  });

  return { success: true, rescuer: newRescuer };
}

/**
 * Removes a rescuer from the store (e.g. for Undo action) and logs an audit record
 */
export function removeRescuer(
  rescuerId: string,
  currentUser: { name: string; roleTitle: string }
): boolean {
  const currentRescuers = getRescuers();
  const target = currentRescuers.find((r) => r.id === rescuerId);
  if (!target) return false;

  const updated = currentRescuers.filter((r) => r.id !== rescuerId);
  saveRescuers(updated);

  logAuditEntry({
    actor: currentUser.name,
    role: currentUser.roleTitle,
    action: 'Removed rescuer (Undo)',
    details: `${target.name} (${target.phone})`,
  });

  return true;
}
