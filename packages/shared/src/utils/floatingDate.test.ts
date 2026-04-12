import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  resolveFloatingDate,
  daysUntilNextFloating,
  daysUntilNextFixed,
  yearsElapsed,
  FLOATING_PRESETS,
} from './floatingDate';

describe('resolveFloatingDate', () => {
  it('resolves Mother\'s Day 2026 (2nd Sunday of May)', () => {
    const date = resolveFloatingDate({ month: 4, weekday: 0, ordinal: 2 }, 2026);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(4);
    expect(date.getDate()).toBe(10);
    expect(date.getDay()).toBe(0); // Sunday
  });

  it('resolves Father\'s Day 2026 (3rd Sunday of June)', () => {
    const date = resolveFloatingDate({ month: 5, weekday: 0, ordinal: 3 }, 2026);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(5);
    expect(date.getDate()).toBe(21);
    expect(date.getDay()).toBe(0);
  });

  it('resolves Thanksgiving 2026 (4th Thursday of November)', () => {
    const date = resolveFloatingDate({ month: 10, weekday: 4, ordinal: 4 }, 2026);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(10);
    expect(date.getDate()).toBe(26);
    expect(date.getDay()).toBe(4); // Thursday
  });

  it('resolves Labor Day 2026 (1st Monday of September)', () => {
    const date = resolveFloatingDate({ month: 8, weekday: 1, ordinal: 1 }, 2026);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(8);
    expect(date.getDate()).toBe(7);
    expect(date.getDay()).toBe(1); // Monday
  });

  it('resolves Memorial Day 2026 (last Monday of May)', () => {
    const date = resolveFloatingDate({ month: 4, weekday: 1, ordinal: -1 }, 2026);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(4);
    expect(date.getDate()).toBe(25);
    expect(date.getDay()).toBe(1); // Monday
  });

  it('resolves MLK Day 2026 (3rd Monday of January)', () => {
    const date = resolveFloatingDate({ month: 0, weekday: 1, ordinal: 3 }, 2026);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(0);
    expect(date.getDate()).toBe(19);
    expect(date.getDay()).toBe(1);
  });

  it('resolves Presidents\' Day 2026 (3rd Monday of February)', () => {
    const date = resolveFloatingDate({ month: 1, weekday: 1, ordinal: 3 }, 2026);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(1);
    expect(date.getDate()).toBe(16);
    expect(date.getDay()).toBe(1);
  });

  it('handles last weekday when last day IS the target weekday', () => {
    // May 31, 2025 is a Saturday. Last Saturday of May 2025 should be May 31.
    const date = resolveFloatingDate({ month: 4, weekday: 6, ordinal: -1 }, 2025);
    expect(date.getDate()).toBe(31);
    expect(date.getDay()).toBe(6);
  });

  it('Mother\'s Day 2027 is May 9', () => {
    const date = resolveFloatingDate({ month: 4, weekday: 0, ordinal: 2 }, 2027);
    expect(date.getDate()).toBe(9);
    expect(date.getDay()).toBe(0);
  });
});

describe('FLOATING_PRESETS', () => {
  it('has 7 presets', () => {
    expect(FLOATING_PRESETS).toHaveLength(7);
  });

  it('all presets have valid fields', () => {
    for (const p of FLOATING_PRESETS) {
      expect(p.month).toBeGreaterThanOrEqual(0);
      expect(p.month).toBeLessThanOrEqual(11);
      expect(p.weekday).toBeGreaterThanOrEqual(0);
      expect(p.weekday).toBeLessThanOrEqual(6);
      expect([-1, 1, 2, 3, 4, 5]).toContain(p.ordinal);
    }
  });
});

describe('daysUntilNextFloating', () => {
  afterEach(() => { vi.useRealTimers(); });

  it('returns days until next occurrence when date is in the future', () => {
    // Mock: Jan 1, 2026. Mother's Day 2026 is May 10.
    vi.useFakeTimers({ now: new Date(2026, 0, 1) });
    const days = daysUntilNextFloating({ month: 4, weekday: 0, ordinal: 2 });
    // Jan 1 to May 10 = 129 days
    expect(days).toBe(129);
  });

  it('returns days until next year when date has passed', () => {
    // Mock: June 1, 2026. Mother's Day 2026 was May 10, so next is May 9, 2027.
    vi.useFakeTimers({ now: new Date(2026, 5, 1) });
    const days = daysUntilNextFloating({ month: 4, weekday: 0, ordinal: 2 });
    // June 1, 2026 to May 9, 2027 = 342 days
    expect(days).toBe(342);
  });
});

describe('daysUntilNextFixed', () => {
  afterEach(() => { vi.useRealTimers(); });

  it('returns days until next occurrence', () => {
    vi.useFakeTimers({ now: new Date(2026, 0, 1) });
    // Use local-time date string to avoid timezone drift
    const origDate = new Date(2020, 5, 15).toISOString();
    const days = daysUntilNextFixed(origDate);
    // Jan 1 to Jun 15 — compute expected dynamically for timezone safety
    const expected = Math.ceil(
      (new Date(2026, 5, 15).getTime() - new Date(2026, 0, 1).getTime()) / (1000 * 60 * 60 * 24),
    );
    expect(days).toBe(expected);
  });

  it('rolls to next year when date has passed', () => {
    vi.useFakeTimers({ now: new Date(2026, 7, 1) });
    const origDate = new Date(2020, 5, 15).toISOString();
    const days = daysUntilNextFixed(origDate);
    // Aug 1, 2026 to Jun 15, 2027 — compute dynamically
    const expected = Math.ceil(
      (new Date(2027, 5, 15).getTime() - new Date(2026, 7, 1).getTime()) / (1000 * 60 * 60 * 24),
    );
    expect(days).toBe(expected);
  });
});

describe('yearsElapsed', () => {
  afterEach(() => { vi.useRealTimers(); });

  it('returns years since original date', () => {
    vi.useFakeTimers({ now: new Date(2026, 5, 20) });
    const origDate = new Date(2020, 5, 15).toISOString();
    expect(yearsElapsed(origDate)).toBe(6);
  });

  it('subtracts 1 if anniversary has not occurred yet this year', () => {
    vi.useFakeTimers({ now: new Date(2026, 5, 10) });
    const origDate = new Date(2020, 5, 15).toISOString();
    expect(yearsElapsed(origDate)).toBe(5);
  });

  it('returns 0 for same year', () => {
    vi.useFakeTimers({ now: new Date(2026, 0, 1) });
    const origDate = new Date(2026, 5, 15).toISOString();
    expect(yearsElapsed(origDate)).toBe(0);
  });
});
