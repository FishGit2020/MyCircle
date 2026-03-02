import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWorshipSongs } from './useWorshipSongs';
import type { WorshipSong } from '../types';

vi.mock('@mycircle/shared', () => {
  const t = (key: string) => key;
  return {
    useTranslation: () => ({ t, i18n: { language: 'en', changeLanguage: vi.fn() } }),
    WindowEvents: {
      AUTH_STATE_CHANGED: 'auth-state-changed',
      WORSHIP_SONGS_CHANGED: 'worship-songs-changed',
      WORSHIP_FAVORITES_CHANGED: 'worship-favorites-changed',
    },
    StorageKeys: {
      WORSHIP_SONGS_CACHE: 'worship-songs-cache',
      WORSHIP_FAVORITES: 'worship-favorites',
    },
    createLogger: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
  };
});

const makeSong = (overrides: Partial<WorshipSong> = {}): WorshipSong => ({
  id: '1',
  title: 'Amazing Grace',
  artist: 'John Newton',
  originalKey: 'G',
  format: 'chordpro',
  content: '[G]Amazing [C]grace',
  notes: '',
  createdAt: { seconds: 1700000000, nanoseconds: 0 },
  updatedAt: { seconds: 1700000000, nanoseconds: 0 },
  ...overrides,
});

const mockSongs: WorshipSong[] = [
  makeSong({ id: '1', title: 'Amazing Grace' }),
  makeSong({ id: '2', title: 'How Great Thou Art' }),
];

describe('useWorshipSongs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    window.__worshipSongs = {
      getAll: vi.fn().mockResolvedValue(mockSongs),
      get: vi.fn().mockImplementation((id: string) =>
        Promise.resolve(mockSongs.find(s => s.id === id) ?? null)
      ),
      add: vi.fn().mockResolvedValue('new-id'),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    window.__getFirebaseIdToken = vi.fn().mockResolvedValue('mock-token');
  });

  afterEach(() => {
    delete window.__worshipSongs;
    delete window.__getFirebaseIdToken;
  });

  it('initializes with empty songs when no cache', () => {
    const { result } = renderHook(() => useWorshipSongs());
    expect(result.current.songs).toEqual([]);
  });

  it('initializes with cached songs from localStorage', () => {
    localStorage.setItem('worship-songs-cache', JSON.stringify(mockSongs));
    const { result } = renderHook(() => useWorshipSongs());
    expect(result.current.songs).toHaveLength(2);
    expect(result.current.songs[0].title).toBe('Amazing Grace');
  });

  it('loads songs via getAll and updates state', async () => {
    const { result } = renderHook(() => useWorshipSongs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.songs).toHaveLength(2);
    expect(window.__worshipSongs!.getAll).toHaveBeenCalled();
  });

  it('caches songs in localStorage after loading', async () => {
    const { result } = renderHook(() => useWorshipSongs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const cached = JSON.parse(localStorage.getItem('worship-songs-cache')!);
    expect(cached).toHaveLength(2);
  });

  it('detects authentication when token is available', async () => {
    const { result } = renderHook(() => useWorshipSongs());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  it('detects unauthenticated state when no token', async () => {
    window.__getFirebaseIdToken = vi.fn().mockResolvedValue(null);
    const { result } = renderHook(() => useWorshipSongs());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  it('detects unauthenticated state when token check throws', async () => {
    window.__getFirebaseIdToken = vi.fn().mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useWorshipSongs());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  it('addSong calls bridge add and dispatches event', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    const { result } = renderHook(() => useWorshipSongs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newSong = {
      title: 'New Song',
      artist: 'Artist',
      originalKey: 'C',
      format: 'text' as const,
      content: 'Lyrics here',
      notes: '',
    };

    let id: string = '';
    await act(async () => {
      id = await result.current.addSong(newSong);
    });

    expect(id).toBe('new-id');
    expect(window.__worshipSongs!.add).toHaveBeenCalledWith(newSong);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'worship-songs-changed' }));
    dispatchSpy.mockRestore();
  });

  it('updateSong calls bridge update and dispatches event', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    const { result } = renderHook(() => useWorshipSongs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.updateSong('1', { title: 'Updated Title' });
    });

    expect(window.__worshipSongs!.update).toHaveBeenCalledWith('1', { title: 'Updated Title' });
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'worship-songs-changed' }));
    dispatchSpy.mockRestore();
  });

  it('deleteSong calls bridge delete and dispatches event', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    const { result } = renderHook(() => useWorshipSongs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteSong('1');
    });

    expect(window.__worshipSongs!.delete).toHaveBeenCalledWith('1');
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'worship-songs-changed' }));
    dispatchSpy.mockRestore();
  });

  it('getSong returns a song by id', async () => {
    const { result } = renderHook(() => useWorshipSongs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let song: WorshipSong | null = null;
    await act(async () => {
      song = await result.current.getSong('1');
    });

    expect(song).not.toBeNull();
    expect(song!.title).toBe('Amazing Grace');
    expect(window.__worshipSongs!.get).toHaveBeenCalledWith('1');
  });

  it('getSong returns null when song not found', async () => {
    const { result } = renderHook(() => useWorshipSongs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let song: WorshipSong | null = null;
    await act(async () => {
      song = await result.current.getSong('999');
    });

    expect(song).toBeNull();
  });

  it('getSong returns null when bridge is unavailable', async () => {
    delete window.__worshipSongs;
    const { result } = renderHook(() => useWorshipSongs());

    let song: WorshipSong | null = null;
    await act(async () => {
      song = await result.current.getSong('1');
    });

    expect(song).toBeNull();
  });

  it('addSong throws when bridge is unavailable', async () => {
    delete window.__worshipSongs;
    const { result } = renderHook(() => useWorshipSongs());

    await expect(
      act(async () => {
        await result.current.addSong({
          title: 'X', artist: 'Y', originalKey: 'C', format: 'text', content: 'Z', notes: '',
        });
      })
    ).rejects.toThrow('Worship songs API not available');
  });

  it('uses subscribe when available', async () => {
    const unsubscribe = vi.fn();
    const subscribeFn = vi.fn((callback: (songs: WorshipSong[]) => void) => {
      // Simulate real-time callback
      setTimeout(() => callback(mockSongs), 0);
      return unsubscribe;
    });
    window.__worshipSongs!.subscribe = subscribeFn;

    const { result, unmount } = renderHook(() => useWorshipSongs());

    await waitFor(() => {
      expect(result.current.songs).toHaveLength(2);
      expect(result.current.loading).toBe(false);
    });

    expect(subscribeFn).toHaveBeenCalled();
    // getAll should NOT be called since subscribe is used
    expect(window.__worshipSongs!.getAll).not.toHaveBeenCalled();

    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it('refresh reloads songs via getAll', async () => {
    const { result } = renderHook(() => useWorshipSongs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const updatedSongs = [...mockSongs, makeSong({ id: '3', title: 'New Song' })];
    (window.__worshipSongs!.getAll as ReturnType<typeof vi.fn>).mockResolvedValue(updatedSongs);

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.songs).toHaveLength(3);
  });
});
