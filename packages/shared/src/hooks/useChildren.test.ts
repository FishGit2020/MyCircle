import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../utils/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import { useChildren, getAgeInMonths, getAgeRemainingDays } from './useChildren';

describe('useChildren', () => {
  beforeEach(() => {
    localStorage.clear();
    delete (window as any).__children; // eslint-disable-line @typescript-eslint/no-explicit-any
  });

  it('returns empty children list when nothing is cached', () => {
    const { result } = renderHook(() => useChildren());

    expect(result.current.children).toEqual([]);
    expect(result.current.selectedChild).toBeNull();
    expect(result.current.selectedId).toBeNull();
  });

  it('loads children from localStorage cache', () => {
    const cached = [
      { id: 'c1', name: 'Alice', birthDate: '2023-01-15' },
      { id: 'c2', name: 'Bob', birthDate: '2021-06-01' },
    ];
    localStorage.setItem('children-cache', JSON.stringify(cached));

    const { result } = renderHook(() => useChildren());

    expect(result.current.children).toHaveLength(2);
    expect(result.current.children[0].name).toBe('Alice');
    // First child should be auto-selected when no selectedId
    expect(result.current.selectedChild?.id).toBe('c1');
  });

  it('setSelectedId persists to localStorage', () => {
    const cached = [
      { id: 'c1', name: 'Alice', birthDate: '2023-01-15' },
      { id: 'c2', name: 'Bob', birthDate: '2021-06-01' },
    ];
    localStorage.setItem('children-cache', JSON.stringify(cached));

    const { result } = renderHook(() => useChildren());

    act(() => {
      result.current.setSelectedId('c2');
    });

    expect(result.current.selectedId).toBe('c2');
    expect(localStorage.getItem('selected-child-id')).toBe('c2');
  });

  it('filters children by age range', () => {
    // Child born 12 months ago (approximately)
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());
    const threeYearsAgo = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());

    const cached = [
      { id: 'c1', name: 'Baby', birthDate: twelveMonthsAgo.toISOString().split('T')[0] },
      { id: 'c2', name: 'Toddler', birthDate: threeYearsAgo.toISOString().split('T')[0] },
    ];
    localStorage.setItem('children-cache', JSON.stringify(cached));

    // Filter for children 0-18 months old
    const { result } = renderHook(() => useChildren([0, 18]));

    expect(result.current.children).toHaveLength(1);
    expect(result.current.children[0].name).toBe('Baby');
    // allChildren still has both
    expect(result.current.allChildren).toHaveLength(2);
  });
});

describe('getAgeInMonths', () => {
  it('returns 0 for a birth date today', () => {
    const today = new Date();
    const birthDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    expect(getAgeInMonths(birthDate)).toBe(0);
  });

  it('returns 12 for a birth date one year ago', () => {
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const birthDate = `${oneYearAgo.getFullYear()}-${String(oneYearAgo.getMonth() + 1).padStart(2, '0')}-${String(oneYearAgo.getDate()).padStart(2, '0')}`;

    expect(getAgeInMonths(birthDate)).toBe(12);
  });

  it('never returns negative', () => {
    // Future date
    const future = new Date();
    future.setMonth(future.getMonth() + 6);
    const birthDate = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`;

    expect(getAgeInMonths(birthDate)).toBe(0);
  });
});

describe('getAgeRemainingDays', () => {
  it('returns 0 for a birth date today', () => {
    const today = new Date();
    const birthDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    expect(getAgeRemainingDays(birthDate)).toBe(0);
  });

  it('returns a non-negative number', () => {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate() - 5);
    const birthDate = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}-${String(sixMonthsAgo.getDate()).padStart(2, '0')}`;

    expect(getAgeRemainingDays(birthDate)).toBeGreaterThanOrEqual(0);
  });
});
