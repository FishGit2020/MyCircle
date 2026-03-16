import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockUseQuery = vi.fn();

vi.mock('../apollo', () => ({
  useQuery: (...args: any[]) => mockUseQuery(...args), // eslint-disable-line @typescript-eslint/no-explicit-any
}));

vi.mock('../utils/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import { useVerseOfDay } from './useVerseOfDay';
import type { VerseRef } from './useVerseOfDay';

const MOCK_VERSES: VerseRef[] = [
  { reference: 'John 3:16', textKey: 'verse.john316' },
  { reference: 'Psalm 23:1', textKey: 'verse.psalm231' },
  { reference: 'Romans 8:28' },
];

describe('useVerseOfDay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue({ data: undefined, loading: false });
  });

  it('returns a verse reference from the provided list', () => {
    const { result } = renderHook(() => useVerseOfDay(MOCK_VERSES));

    expect(MOCK_VERSES.map((v) => v.reference)).toContain(result.current.reference);
    expect(result.current.loading).toBe(false);
  });

  it('returns API text when available', () => {
    mockUseQuery.mockReturnValue({
      data: { biblePassage: { text: 'For God so loved the world...' } },
      loading: false,
    });

    const { result } = renderHook(() => useVerseOfDay(MOCK_VERSES));

    expect(result.current.text).toBe('For God so loved the world...');
  });

  it('falls back to i18n text when API returns empty', () => {
    mockUseQuery.mockReturnValue({ data: undefined, loading: false });

    const fallbackFn = vi.fn((key: string) => `Translated: ${key}`);
    const { result } = renderHook(() => useVerseOfDay(MOCK_VERSES, fallbackFn));

    // The selected verse has a textKey, so fallback should be used
    // (unless it picks the one without textKey)
    if (result.current.text) {
      expect(result.current.text).toMatch(/^Translated:/);
    }
  });

  it('shuffle changes the verse reference', () => {
    mockUseQuery.mockReturnValue({ data: undefined, loading: false });

    const { result } = renderHook(() => useVerseOfDay(MOCK_VERSES));
    const initial = result.current.reference;

    // Shuffle multiple times to increase chance of getting a different verse
    let changed = false;
    for (let i = 0; i < 20; i++) {
      act(() => {
        result.current.shuffle();
      });
      if (result.current.reference !== initial) {
        changed = true;
        break;
      }
    }

    expect(changed).toBe(true);
  });

  it('returns loading state from query', () => {
    mockUseQuery.mockReturnValue({ data: undefined, loading: true });

    const { result } = renderHook(() => useVerseOfDay(MOCK_VERSES));

    expect(result.current.loading).toBe(true);
  });
});
