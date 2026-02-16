import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRecentlyVisited } from './useRecentlyVisited';

const mockPathname = { value: '/' };

vi.mock('react-router', () => ({
  useLocation: () => ({ pathname: mockPathname.value, search: '', hash: '', state: null, key: 'default' }),
}));

vi.mock('@mycircle/shared', () => ({
  StorageKeys: { RECENTLY_VISITED: 'recently-visited' },
}));

beforeEach(() => {
  localStorage.clear();
  mockPathname.value = '/';
});

describe('useRecentlyVisited', () => {
  it('starts with empty recent list', () => {
    const { result } = renderHook(() => useRecentlyVisited());
    expect(result.current.recent).toEqual([]);
  });

  it('tracks route visits', () => {
    mockPathname.value = '/weather';
    const { result } = renderHook(() => useRecentlyVisited());
    expect(result.current.recent).toHaveLength(1);
    expect(result.current.recent[0].path).toBe('/weather');
  });

  it('does not track excluded routes (/ and /compare)', () => {
    mockPathname.value = '/';
    const { result } = renderHook(() => useRecentlyVisited());
    expect(result.current.recent).toHaveLength(0);
  });

  it('persists to localStorage', () => {
    mockPathname.value = '/stocks';
    renderHook(() => useRecentlyVisited());
    const stored = JSON.parse(localStorage.getItem('recently-visited') || '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].path).toBe('/stocks');
  });

  it('loads from localStorage on mount', () => {
    localStorage.setItem('recently-visited', JSON.stringify([
      { path: '/bible', visitedAt: 1000 },
    ]));
    mockPathname.value = '/bible'; // same path — deduplicates
    const { result } = renderHook(() => useRecentlyVisited());
    // Should still have 1 entry (deduplicated), updated timestamp
    expect(result.current.recent).toHaveLength(1);
    expect(result.current.recent[0].path).toBe('/bible');
  });

  it('limits to 5 recent pages', () => {
    const items = [
      { path: '/a', visitedAt: 1 },
      { path: '/b', visitedAt: 2 },
      { path: '/c', visitedAt: 3 },
      { path: '/d', visitedAt: 4 },
      { path: '/e', visitedAt: 5 },
    ];
    localStorage.setItem('recently-visited', JSON.stringify(items));
    mockPathname.value = '/f';
    const { result } = renderHook(() => useRecentlyVisited());
    expect(result.current.recent).toHaveLength(5);
    expect(result.current.recent[0].path).toBe('/f');
  });

  it('clearRecent removes all entries', () => {
    mockPathname.value = '/weather';
    const { result } = renderHook(() => useRecentlyVisited());
    expect(result.current.recent).toHaveLength(1);

    act(() => {
      result.current.clearRecent();
    });
    expect(result.current.recent).toHaveLength(0);
    expect(localStorage.getItem('recently-visited')).toBeNull();
  });
});
