import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVotd, useBibleVersions, useBiblePassage, BIBLE_BOOKS } from './useBibleData';

const mockUseQuery = vi.fn();
const mockUseLazyQuery = vi.fn();

vi.mock('@mycircle/shared', () => {
  const t = (key: string) => key;
  return {
    useTranslation: () => ({ t }),
    useQuery: (...args: any[]) => mockUseQuery(...args),
    useLazyQuery: (...args: any[]) => mockUseLazyQuery(...args),
    GET_BIBLE_VOTD_API: 'GET_BIBLE_VOTD_API',
    GET_BIBLE_PASSAGE: 'GET_BIBLE_PASSAGE',
    GET_BIBLE_VERSIONS: 'GET_BIBLE_VERSIONS',
    createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
  };
});

describe('BIBLE_BOOKS', () => {
  it('contains 66 books', () => {
    expect(BIBLE_BOOKS).toHaveLength(66);
  });

  it('starts with Genesis and ends with Revelation', () => {
    expect(BIBLE_BOOKS[0].name).toBe('Genesis');
    expect(BIBLE_BOOKS[65].name).toBe('Revelation');
  });

  it('each book has name and chapters properties', () => {
    for (const book of BIBLE_BOOKS) {
      expect(typeof book.name).toBe('string');
      expect(typeof book.chapters).toBe('number');
      expect(book.chapters).toBeGreaterThan(0);
    }
  });

  it('has correct chapter counts for well-known books', () => {
    const genesis = BIBLE_BOOKS.find(b => b.name === 'Genesis');
    expect(genesis?.chapters).toBe(50);

    const psalms = BIBLE_BOOKS.find(b => b.name === 'Psalms');
    expect(psalms?.chapters).toBe(150);

    const revelation = BIBLE_BOOKS.find(b => b.name === 'Revelation');
    expect(revelation?.chapters).toBe(22);
  });

  it('contains Old Testament books (first 39)', () => {
    const otBooks = BIBLE_BOOKS.slice(0, 39);
    expect(otBooks[0].name).toBe('Genesis');
    expect(otBooks[38].name).toBe('Malachi');
  });

  it('contains New Testament books (last 27)', () => {
    const ntBooks = BIBLE_BOOKS.slice(39);
    expect(ntBooks).toHaveLength(27);
    expect(ntBooks[0].name).toBe('Matthew');
    expect(ntBooks[26].name).toBe('Revelation');
  });
});

describe('useVotd', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns verse data when query succeeds', () => {
    const mockVerse = {
      text: 'For God so loved the world',
      reference: 'John 3:16',
      translation: 'NIV',
      copyright: null,
    };
    mockUseQuery.mockReturnValue({
      data: { bibleVotdApi: mockVerse },
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useVotd());

    expect(result.current.verse).toEqual(mockVerse);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('returns null verse when loading', () => {
    mockUseQuery.mockReturnValue({
      data: null,
      loading: true,
      error: null,
    });

    const { result } = renderHook(() => useVotd());

    expect(result.current.verse).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it('returns null verse when data is empty', () => {
    mockUseQuery.mockReturnValue({
      data: {},
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useVotd());

    expect(result.current.verse).toBeNull();
  });

  it('returns error from query', () => {
    const mockError = new Error('Network error');
    mockUseQuery.mockReturnValue({
      data: null,
      loading: false,
      error: mockError,
    });

    const { result } = renderHook(() => useVotd());

    expect(result.current.error).toBe(mockError);
    expect(result.current.verse).toBeNull();
  });

  it('calls useQuery with GET_BIBLE_VOTD_API and day variable', () => {
    mockUseQuery.mockReturnValue({ data: null, loading: false, error: null });

    renderHook(() => useVotd());

    expect(mockUseQuery).toHaveBeenCalledWith(
      'GET_BIBLE_VOTD_API',
      expect.objectContaining({
        variables: { day: expect.any(Number) },
        fetchPolicy: 'cache-first',
      })
    );
  });

  it('passes a day-of-year value between 1 and 366', () => {
    mockUseQuery.mockReturnValue({ data: null, loading: false, error: null });

    renderHook(() => useVotd());

    const callArgs = mockUseQuery.mock.calls[0];
    const day = callArgs[1].variables.day;
    expect(day).toBeGreaterThanOrEqual(1);
    expect(day).toBeLessThanOrEqual(366);
  });
});

describe('useBibleVersions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns versions list when query succeeds', () => {
    const mockVersions = [
      { id: 1, abbreviation: 'KJV', title: 'King James Version' },
      { id: 111, abbreviation: 'NIV', title: 'New International Version' },
    ];
    mockUseQuery.mockReturnValue({
      data: { bibleVersions: mockVersions },
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useBibleVersions());

    expect(result.current.versions).toEqual(mockVersions);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('returns empty array when loading', () => {
    mockUseQuery.mockReturnValue({
      data: null,
      loading: true,
      error: null,
    });

    const { result } = renderHook(() => useBibleVersions());

    expect(result.current.versions).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  it('returns empty array when data has no bibleVersions', () => {
    mockUseQuery.mockReturnValue({
      data: {},
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useBibleVersions());

    expect(result.current.versions).toEqual([]);
  });

  it('returns error from query', () => {
    const mockError = new Error('API failed');
    mockUseQuery.mockReturnValue({
      data: null,
      loading: false,
      error: mockError,
    });

    const { result } = renderHook(() => useBibleVersions());

    expect(result.current.error).toBe(mockError);
    expect(result.current.versions).toEqual([]);
  });

  it('calls useQuery with GET_BIBLE_VERSIONS and cache-first policy', () => {
    mockUseQuery.mockReturnValue({ data: null, loading: false, error: null });

    renderHook(() => useBibleVersions());

    expect(mockUseQuery).toHaveBeenCalledWith(
      'GET_BIBLE_VERSIONS',
      expect.objectContaining({
        fetchPolicy: 'cache-first',
      })
    );
  });
});

describe('useBiblePassage', () => {
  const mockFetchPassage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLazyQuery.mockReturnValue([
      mockFetchPassage,
      { data: null, loading: false, error: null },
    ]);
  });

  it('returns initial state with no passage', () => {
    const { result } = renderHook(() => useBiblePassage());

    expect(result.current.passage).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.selectedBook).toBe('');
    expect(result.current.selectedChapter).toBe(0);
    expect(typeof result.current.loadPassage).toBe('function');
  });

  it('calls useLazyQuery with GET_BIBLE_PASSAGE and cache-first policy', () => {
    renderHook(() => useBiblePassage());

    expect(mockUseLazyQuery).toHaveBeenCalledWith(
      'GET_BIBLE_PASSAGE',
      expect.objectContaining({
        fetchPolicy: 'cache-first',
      })
    );
  });

  it('loadPassage sets selectedBook and selectedChapter', () => {
    const { result } = renderHook(() => useBiblePassage());

    act(() => {
      result.current.loadPassage('Genesis', 1);
    });

    expect(result.current.selectedBook).toBe('Genesis');
    expect(result.current.selectedChapter).toBe(1);
  });

  it('loadPassage calls fetchPassage with reference variable', () => {
    const { result } = renderHook(() => useBiblePassage());

    act(() => {
      result.current.loadPassage('Psalms', 23);
    });

    expect(mockFetchPassage).toHaveBeenCalledWith({
      variables: { reference: 'Psalms 23', translation: undefined },
    });
  });

  it('loadPassage passes translation when provided', () => {
    const { result } = renderHook(() => useBiblePassage());

    act(() => {
      result.current.loadPassage('John', 3, '111');
    });

    expect(mockFetchPassage).toHaveBeenCalledWith({
      variables: { reference: 'John 3', translation: '111' },
    });
  });

  it('returns passage data from lazy query result', () => {
    const mockPassage = {
      text: 'The Lord is my shepherd; I shall not want.',
      reference: 'Psalms 23',
      translation: 'KJV',
      verseCount: 6,
      copyright: null,
      verses: [{ number: 1, text: 'The Lord is my shepherd; I shall not want.' }],
    };

    mockUseLazyQuery.mockReturnValue([
      mockFetchPassage,
      { data: { biblePassage: mockPassage }, loading: false, error: null },
    ]);

    const { result } = renderHook(() => useBiblePassage());

    expect(result.current.passage).toEqual(mockPassage);
  });

  it('returns loading state from lazy query', () => {
    mockUseLazyQuery.mockReturnValue([
      mockFetchPassage,
      { data: null, loading: true, error: null },
    ]);

    const { result } = renderHook(() => useBiblePassage());

    expect(result.current.loading).toBe(true);
  });

  it('returns error from lazy query', () => {
    const mockError = new Error('Passage not found');
    mockUseLazyQuery.mockReturnValue([
      mockFetchPassage,
      { data: null, loading: false, error: mockError },
    ]);

    const { result } = renderHook(() => useBiblePassage());

    expect(result.current.error).toBe(mockError);
  });

  it('returns null passage when biblePassage is undefined in data', () => {
    mockUseLazyQuery.mockReturnValue([
      mockFetchPassage,
      { data: {}, loading: false, error: null },
    ]);

    const { result } = renderHook(() => useBiblePassage());

    expect(result.current.passage).toBeNull();
  });

  it('can load different passages sequentially', () => {
    const { result } = renderHook(() => useBiblePassage());

    act(() => {
      result.current.loadPassage('Genesis', 1);
    });
    expect(result.current.selectedBook).toBe('Genesis');
    expect(result.current.selectedChapter).toBe(1);

    act(() => {
      result.current.loadPassage('Revelation', 22);
    });
    expect(result.current.selectedBook).toBe('Revelation');
    expect(result.current.selectedChapter).toBe(22);

    expect(mockFetchPassage).toHaveBeenCalledTimes(2);
  });
});
