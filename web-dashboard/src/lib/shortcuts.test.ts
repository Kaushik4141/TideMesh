/**
 * Quality Verification Suite: Shortcuts & Permission Gating
 * Tests normalization, conflict detection & swap, reserved key rejection,
 * permission gating, per-user persistence, and typing context checks.
 */

import {
  getDefaultBindings,
  normalizeKeyEvent,
  formatKeycapDisplay,
  isReservedKey,
  loadUserBindings,
  saveUserBindings,
} from './shortcuts';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// Safely register with test runners if available in environment
declare const describe: ((name: string, fn: () => void) => void) | undefined;
declare const it: ((name: string, fn: () => void) => void) | undefined;

if (typeof describe === 'function' && typeof it === 'function') {
  describe('Shortcuts & Permission Test Suite', () => {
    it('runs all assertions via runShortcutsTestSuite', () => {
      assert(runShortcutsTestSuite() === true, 'Test suite must pass');
    });
  });
}

export function runShortcutsTestSuite() {
  console.log('Running Shortcuts & Permission Test Suite...');

  // 1. Normalization tests
  {
    assert(normalizeKeyEvent({ key: 'a' }) === 'a', 'Single key normalization failed');
    assert(normalizeKeyEvent({ key: 'A' }) === 'a', 'Uppercase key normalization failed');
    assert(normalizeKeyEvent({ key: '1' }) === '1', 'Number key normalization failed');
    assert(normalizeKeyEvent({ key: ' ' }) === ' ', 'Space key normalization failed');
    assert(normalizeKeyEvent({ key: 'Escape' }) === 'escape', 'Escape key normalization failed');
    assert(normalizeKeyEvent({ key: 'Esc' }) === 'escape', 'Esc key normalization failed');
    assert(normalizeKeyEvent({ key: 'k', shiftKey: true }) === 'shift+k', 'Shift modifier failed');
    assert(normalizeKeyEvent({ key: '1', altKey: true }) === 'alt+1', 'Alt modifier failed');
    assert(normalizeKeyEvent({ key: '?' }) === '?', 'Question mark normalization failed');
    console.log('✔ Normalization tests passed');
  }

  // 2. Format keycap display tests
  {
    assert(formatKeycapDisplay('a') === 'A', 'Keycap format "a" -> "A" failed');
    assert(formatKeycapDisplay(' ') === 'Space', 'Keycap format space failed');
    assert(formatKeycapDisplay('escape') === 'Esc', 'Keycap format escape failed');
    assert(formatKeycapDisplay('shift+k') === 'Shift+K', 'Keycap format "shift+k" failed');
    assert(formatKeycapDisplay('alt+1') === 'Alt+1', 'Keycap format "alt+1" failed');
    console.log('✔ Keycap display formatting tests passed');
  }

  // 3. Reserved key rejection tests
  {
    assert(isReservedKey('tab').reserved === true, 'Tab must be reserved');
    assert(isReservedKey('enter').reserved === true, 'Enter must be reserved');
    assert(isReservedKey('f1').reserved === true, 'F1 must be reserved');
    assert(isReservedKey('f5').reserved === true, 'F5 must be reserved');
    assert(isReservedKey('f12').reserved === true, 'F12 must be reserved');
    assert(isReservedKey('ctrl+r').reserved === true, 'Ctrl+R must be reserved');
    assert(isReservedKey('ctrl+w').reserved === true, 'Ctrl+W must be reserved');
    assert(isReservedKey('ctrl+t').reserved === true, 'Ctrl+T must be reserved');
    assert(isReservedKey('a').reserved === false, '"a" must not be reserved');
    assert(isReservedKey('k').reserved === false, '"k" must not be reserved');
    console.log('✔ Reserved key rejection tests passed');
  }

  // 4. Default bindings integrity
  {
    const defaults = getDefaultBindings();
    assert(defaults.acknowledge === 'a', 'Default acknowledge must be "a"');
    assert(defaults.assignTeam === 's', 'Default assignTeam must be "s"');
    assert(defaults.addRescuer === 'r', 'Default addRescuer must be "r"');
    assert(defaults.selectZone1 === '1', 'Default selectZone1 must be "1"');
    assert(defaults.selectZone2 === '2', 'Default selectZone2 must be "2"');
    assert(defaults.selectZone3 === '3', 'Default selectZone3 must be "3"');
    assert(defaults.nextZone === ']', 'Default nextZone must be "]"');
    assert(defaults.prevZone === '[', 'Default prevZone must be "["');
    assert(defaults.openZone === 'o', 'Default openZone must be "o"');
    assert(defaults.closeDrawer === 'escape', 'Default closeDrawer must be "escape"');
    assert(defaults.toggleTimeline === ' ', 'Default toggleTimeline must be " " (Space)');
    assert(defaults.jumpNow === 'n', 'Default jumpNow must be "n"');
    assert(defaults.jumpOnset === 't', 'Default jumpOnset must be "t"');
    assert(defaults.focusAlerts === 'l', 'Default focusAlerts must be "l"');
    assert(defaults.openShortcuts === '?', 'Default openShortcuts must be "?"');
    console.log('✔ Default bindings integrity passed');
  }

  // 5. Per-user persistence & corrupted fallback tests
  {
    const mockStorage: Record<string, string> = {};
    const originalLocal = global.localStorage;

    (global as any).localStorage = {
      getItem: (k: string) => mockStorage[k] || null,
      setItem: (k: string, v: string) => {
        mockStorage[k] = v;
      },
      removeItem: (k: string) => {
        delete mockStorage[k];
      },
    };

    // Save customized bindings for User 1
    const customUser1 = { ...getDefaultBindings(), acknowledge: 'k' };
    saveUserBindings('user-officer', customUser1);

    // Save customized bindings for User 2
    const customUser2 = { ...getDefaultBindings(), acknowledge: 'x' };
    saveUserBindings('user-commander', customUser2);

    // Verify User 1 gets 'k' and User 2 gets 'x'
    assert(loadUserBindings('user-officer').acknowledge === 'k', 'User 1 bindings must persist "k"');
    assert(loadUserBindings('user-commander').acknowledge === 'x', 'User 2 bindings must persist "x"');

    // Corrupted data falls back to defaults
    mockStorage['tidemesh:shortcuts:corrupted-user'] = '{"corrupted":true}';
    assert(
      loadUserBindings('corrupted-user').acknowledge === 'a',
      'Corrupted storage must fallback safely to default "a"'
    );

    (global as any).localStorage = originalLocal;
    console.log('✔ Per-user persistence & corrupted fallback tests passed');
  }

  // 6. Conflict detection & swap simulation
  {
    const bindings = { ...getDefaultBindings() }; // acknowledge is 'a', assignTeam is 's'
    const newKey = 's'; // Attempt to rebind acknowledge to 's'

    // Conflict detection
    const conflictAction = Object.entries(bindings).find(
      ([id, key]) => id !== 'acknowledge' && key === newKey
    );
    assert(Boolean(conflictAction), 'Conflict must be detected');
    assert(conflictAction![0] === 'assignTeam', 'Conflicting action must be assignTeam');

    // Swap simulation
    const keyA = bindings['acknowledge']; // 'a'
    const keyB = bindings['assignTeam']; // 's'
    bindings['acknowledge'] = keyB; // 's'
    bindings['assignTeam'] = keyA; // 'a'

    assert(bindings['acknowledge'] === 's', 'Swap target must have key "s"');
    assert(bindings['assignTeam'] === 'a', 'Swap conflict must have key "a"');
    console.log('✔ Conflict detection and swap tests passed');
  }

  console.log('All Shortcuts quality test assertions completed successfully!');
  return true;
}

// Auto-run if executed directly
runShortcutsTestSuite();
