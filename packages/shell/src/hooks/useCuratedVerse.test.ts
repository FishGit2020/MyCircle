import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const mockUseQuery = vi.fn();

vi.mock('@mycircle/shared', () => ({
  getAllDailyVerses: () => [
    { usfm: 'JER.29.11', reference: 'Jeremiah 29:11', text: 'For I know the plans I have for you' },
    { usfm: 'ISA.41.10', reference: 'Isaiah 41:10', text: 'So do not fear, for I am with you' },
    { usfm: 'JOS.1.9', reference: 'Joshua 1:9', text: 'Be strong and courageous' },
  ],
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  GET_BIBLE_PASSAGE: 'GET_BIBLE_PASSAGE',
  NIV_COPYRIGHT: 'NIV Copyright',
}));

import { useCuratedVerse } from './useCuratedVerse';

describe('useCuratedVerse', () => {
  it('returns API verse text when query succeeds', () => {
    mockUseQuery.mockReturnValue({
      data: {
        biblePassage: {
          text: 'For I know the plans I have for you, declares the Lord',
          reference: 'Jeremiah 29:11 (NIV)',
          copyright: 'API Copyright',
        },
      },
      loading: false,
    });

    const { result } = renderHook(() => useCuratedVerse());
    expect(result.current.verse.text).toBe('For I know the plans I have for you, declares the Lord');
    expect(result.current.verse.reference).toBe('Jeremiah 29:11 (NIV)');
    expect(result.current.verse.copyright).toBe('API Copyright');
    expect(result.current.loading).toBe(false);
  });

  it('falls back to hardcoded NIV text when query returns no data', () => {
    mockUseQuery.mockReturnValue({
      data: null,
      loading: false,
    });

    const { result } = renderHook(() => useCuratedVerse());
    expect(result.current.verse.text).toBeTruthy();
    expect(result.current.verse.reference).toMatch(/Jeremiah|Isaiah|Joshua/);
    expect(result.current.verse.copyright).toBe('NIV Copyright');
  });

  it('returns loading state while fetching', () => {
    mockUseQuery.mockReturnValue({
      data: null,
      loading: true,
    });

    const { result } = renderHook(() => useCuratedVerse());
    expect(result.current.loading).toBe(true);
  });

  it('passes the USFM reference to the query', () => {
    mockUseQuery.mockReturnValue({ data: null, loading: false });

    renderHook(() => useCuratedVerse());
    const callArgs = mockUseQuery.mock.calls[mockUseQuery.mock.calls.length - 1];
    expect(callArgs[1].variables.reference).toMatch(/^[A-Z]{3}\./);
    expect(callArgs[1].fetchPolicy).toBe('cache-first');
  });

  it('returns a stable verse across re-renders', () => {
    mockUseQuery.mockReturnValue({ data: null, loading: false });

    const { result, rerender } = renderHook(() => useCuratedVerse());
    const first = result.current.verse.reference;
    rerender();
    expect(result.current.verse.reference).toBe(first);
  });
});
