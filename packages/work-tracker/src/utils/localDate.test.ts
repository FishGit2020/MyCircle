import { describe, it, expect, vi, afterEach } from 'vitest';
import { getLocalDateString } from './localDate';

describe('getLocalDateString', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns YYYY-MM-DD format', () => {
    const result = getLocalDateString(new Date(2026, 0, 5)); // Jan 5, 2026 local
    expect(result).toBe('2026-01-05');
  });

  it('pads single-digit month and day', () => {
    const result = getLocalDateString(new Date(2026, 2, 3)); // Mar 3, 2026 local
    expect(result).toBe('2026-03-03');
  });

  it('handles December correctly (month index 11 → "12")', () => {
    const result = getLocalDateString(new Date(2026, 11, 25));
    expect(result).toBe('2026-12-25');
  });

  it('uses current date when no argument provided', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 15, 14, 30)); // Jun 15, 2026 2:30 PM local
    expect(getLocalDateString()).toBe('2026-06-15');
  });

  it('returns LOCAL date, not UTC — the key regression this prevents', () => {
    // Simulate 11 PM local time on Feb 25.
    // The bug (toISOString().split('T')[0]) would return the UTC date (Feb 26).
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 25, 23, 0, 0)); // Feb 25, 11 PM local
    const result = getLocalDateString();
    // Must return local date (Feb 25), NOT UTC date (which could be Feb 26)
    expect(result).toBe('2026-02-25');
  });

  it('handles New Year boundary correctly', () => {
    // 11:30 PM on Dec 31 local time — should still be Dec 31, not Jan 1
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 11, 31, 23, 30, 0));
    expect(getLocalDateString()).toBe('2026-12-31');
  });
});
