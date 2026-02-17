import { renderHook, act, waitFor } from '@testing-library/react';
import { useChineseCharacters } from './useChineseCharacters';

const mockCharacters = [
  { id: '1', character: '妈妈', pinyin: 'māma', meaning: 'mom', category: 'family' },
  { id: '2', character: '爸爸', pinyin: 'bàba', meaning: 'dad', category: 'family' },
];

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  window.__chineseCharacters = {
    getAll: vi.fn().mockResolvedValue(mockCharacters),
    add: vi.fn().mockResolvedValue('new-id'),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn((cb) => {
      cb(mockCharacters);
      return vi.fn();
    }),
  };
  window.__getFirebaseIdToken = vi.fn().mockResolvedValue('mock-token');
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useChineseCharacters', () => {
  it('loads characters from subscribe', async () => {
    vi.useRealTimers();
    const { result } = renderHook(() => useChineseCharacters());

    await waitFor(() => {
      expect(result.current.characters).toHaveLength(2);
      expect(result.current.loading).toBe(false);
    });
  });

  it('caches characters to localStorage', async () => {
    vi.useRealTimers();
    const { result } = renderHook(() => useChineseCharacters());

    await waitFor(() => expect(result.current.characters).toHaveLength(2));

    const cached = JSON.parse(localStorage.getItem('chinese-characters-cache')!);
    expect(cached).toHaveLength(2);
  });

  it('loads from cache when available', async () => {
    vi.useRealTimers();
    localStorage.setItem('chinese-characters-cache', JSON.stringify(mockCharacters));

    const { result } = renderHook(() => useChineseCharacters());
    // Immediately available from cache
    expect(result.current.characters).toHaveLength(2);
  });

  it('falls back to getAll when subscribe is unavailable', async () => {
    vi.useRealTimers();
    window.__chineseCharacters = {
      getAll: vi.fn().mockResolvedValue(mockCharacters),
      add: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      subscribe: undefined,
    };

    const { result } = renderHook(() => useChineseCharacters());

    await waitFor(() => {
      expect(result.current.characters).toHaveLength(2);
      expect(window.__chineseCharacters!.getAll).toHaveBeenCalled();
    });
  });

  it('addCharacter calls window API and dispatches event', async () => {
    vi.useRealTimers();
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    const { result } = renderHook(() => useChineseCharacters());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addCharacter({ character: '水', pinyin: 'shuǐ', meaning: 'water', category: 'food' } as any);
    });

    expect(window.__chineseCharacters!.add).toHaveBeenCalledWith(
      expect.objectContaining({ character: '水' })
    );
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'chinese-characters-changed' })
    );
    dispatchSpy.mockRestore();
  });

  it('updateCharacter calls window API', async () => {
    vi.useRealTimers();
    const { result } = renderHook(() => useChineseCharacters());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateCharacter('1', { meaning: 'mama' });
    });

    expect(window.__chineseCharacters!.update).toHaveBeenCalledWith('1', { meaning: 'mama' });
  });

  it('deleteCharacter calls window API', async () => {
    vi.useRealTimers();
    const { result } = renderHook(() => useChineseCharacters());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteCharacter('1');
    });

    expect(window.__chineseCharacters!.delete).toHaveBeenCalledWith('1');
  });

  it('detects auth state', async () => {
    vi.useRealTimers();
    const { result } = renderHook(() => useChineseCharacters());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  it('detects unauthenticated state', async () => {
    vi.useRealTimers();
    window.__getFirebaseIdToken = vi.fn().mockResolvedValue(null);
    const { result } = renderHook(() => useChineseCharacters());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});
