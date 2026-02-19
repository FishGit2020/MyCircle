import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSearchableContent } from './useSearchableContent';

vi.mock('@mycircle/shared', () => ({
  StorageKeys: {
    STOCK_WATCHLIST: 'stock-tracker-watchlist',
    BIBLE_BOOKMARKS: 'bible-bookmarks',
  },
}));

beforeEach(() => {
  localStorage.clear();
});

describe('useSearchableContent', () => {
  it('returns empty array when not open', () => {
    localStorage.setItem('stock-tracker-watchlist', JSON.stringify([
      { symbol: 'AAPL', companyName: 'Apple Inc' },
    ]));
    const { result } = renderHook(() => useSearchableContent(false));
    expect(result.current).toEqual([]);
  });

  it('returns stock items from localStorage', () => {
    localStorage.setItem('stock-tracker-watchlist', JSON.stringify([
      { symbol: 'AAPL', companyName: 'Apple Inc' },
      { symbol: 'MSFT', companyName: 'Microsoft Corp' },
    ]));
    const { result } = renderHook(() => useSearchableContent(true));
    expect(result.current).toHaveLength(2);
    expect(result.current[0]).toEqual({
      id: 'stock-AAPL',
      label: 'AAPL',
      description: 'Apple Inc',
      type: 'stock',
      route: '/stocks',
    });
  });

  it('returns bookmark items from localStorage', () => {
    localStorage.setItem('bible-bookmarks', JSON.stringify([
      { book: 'John', chapter: 3, label: 'John 3:16' },
    ]));
    const { result } = renderHook(() => useSearchableContent(true));
    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toEqual({
      id: 'bookmark-John-3',
      label: 'John 3:16',
      description: 'John 3',
      type: 'bookmark',
      route: '/bible?book=John&chapter=3',
    });
  });

  it('uses book+chapter as label when no label provided', () => {
    localStorage.setItem('bible-bookmarks', JSON.stringify([
      { book: 'Genesis', chapter: 1 },
    ]));
    const { result } = renderHook(() => useSearchableContent(true));
    expect(result.current[0].label).toBe('Genesis 1');
  });

  it('combines stocks and bookmarks', () => {
    localStorage.setItem('stock-tracker-watchlist', JSON.stringify([
      { symbol: 'GOOG', companyName: 'Alphabet' },
    ]));
    localStorage.setItem('bible-bookmarks', JSON.stringify([
      { book: 'Psalms', chapter: 23 },
    ]));
    const { result } = renderHook(() => useSearchableContent(true));
    expect(result.current).toHaveLength(2);
    expect(result.current[0].type).toBe('stock');
    expect(result.current[1].type).toBe('bookmark');
  });

  it('returns empty array when localStorage has no data', () => {
    const { result } = renderHook(() => useSearchableContent(true));
    expect(result.current).toEqual([]);
  });

  it('handles malformed JSON gracefully', () => {
    localStorage.setItem('stock-tracker-watchlist', 'not-json');
    const { result } = renderHook(() => useSearchableContent(true));
    expect(result.current).toEqual([]);
  });
});
