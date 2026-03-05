import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useNotes } from './useNotes';

// Stable t reference prevents infinite re-renders from useCallback([..., t])
vi.mock('@mycircle/shared', () => {
  const t = (key: string) => key;
  return {
    useTranslation: () => ({ t }),
    WindowEvents: {
      AUTH_STATE_CHANGED: 'auth-state-changed',
      NOTEBOOK_CHANGED: 'notebook-changed',
    },
    StorageKeys: { NOTEBOOK_CACHE: 'notebook-cache' },
  };
});

const mockNotes = [
  { id: '1', title: 'Note 1', content: 'Content 1', createdAt: new Date(), updatedAt: new Date() },
  { id: '2', title: 'Note 2', content: 'Content 2', createdAt: new Date(), updatedAt: new Date() },
];

describe('useNotes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    delete window.__notebook;
  });

  afterEach(() => {
    delete window.__notebook;
  });

  it('returns empty notes and stops loading when no API', async () => {
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.notes).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('loads notes via getAll when no subscribe', async () => {
    window.__notebook = {
      getAll: vi.fn().mockResolvedValue(mockNotes),
      add: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      get: vi.fn(),
    };
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.notes).toEqual(mockNotes);
  });

  it('uses subscribe when available', async () => {
    const unsubscribe = vi.fn();
    window.__notebook = {
      getAll: vi.fn(),
      add: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      get: vi.fn(),
      subscribe: vi.fn((cb: any) => {
        setTimeout(() => cb(mockNotes), 10);
        return unsubscribe;
      }),
    };
    const { result, unmount } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.notes).toEqual(mockNotes));
    expect(result.current.loading).toBe(false);
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it('saves new note via add', async () => {
    const addFn = vi.fn().mockResolvedValue('new-id');
    window.__notebook = {
      getAll: vi.fn().mockResolvedValue([]),
      add: addFn,
      update: vi.fn(),
      delete: vi.fn(),
      get: vi.fn(),
    };
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.saveNote(null, { title: 'New', content: 'Body' });
    });
    expect(addFn).toHaveBeenCalledWith({ title: 'New', content: 'Body' });
  });

  it('updates existing note via update', async () => {
    const updateFn = vi.fn().mockResolvedValue(undefined);
    window.__notebook = {
      getAll: vi.fn().mockResolvedValue([]),
      add: vi.fn(),
      update: updateFn,
      delete: vi.fn(),
      get: vi.fn(),
    };
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.saveNote('note-1', { title: 'Updated', content: 'New body' });
    });
    expect(updateFn).toHaveBeenCalledWith('note-1', { title: 'Updated', content: 'New body' });
  });

  it('deletes note', async () => {
    const deleteFn = vi.fn().mockResolvedValue(undefined);
    window.__notebook = {
      getAll: vi.fn().mockResolvedValue([]),
      add: vi.fn(),
      update: vi.fn(),
      delete: deleteFn,
      get: vi.fn(),
    };
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.deleteNote('note-1');
    });
    expect(deleteFn).toHaveBeenCalledWith('note-1');
  });

  it('handles error during load', async () => {
    window.__notebook = {
      getAll: vi.fn().mockRejectedValue(new Error('Load failed')),
      add: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      get: vi.fn(),
    };
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.error).toBe('Load failed'));
  });

  it('throws when saving without API', async () => {
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await expect(
      act(async () => { await result.current.saveNote(null, { title: 'T', content: 'C' }); })
    ).rejects.toThrow('Notebook API not available');
  });

  it('caches note count in localStorage', async () => {
    window.__notebook = {
      getAll: vi.fn().mockResolvedValue(mockNotes),
      add: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      get: vi.fn(),
    };
    renderHook(() => useNotes());
    await waitFor(() => {
      expect(localStorage.getItem('notebook-cache')).toBe('2');
    });
  });

  it('reloads notes on NOTEBOOK_CHANGED event when no subscribe', async () => {
    const getAllFn = vi.fn().mockResolvedValue(mockNotes);
    window.__notebook = {
      getAll: getAllFn,
      add: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      get: vi.fn(),
    };
    renderHook(() => useNotes());
    await waitFor(() => expect(getAllFn).toHaveBeenCalledTimes(1));
    act(() => {
      window.dispatchEvent(new Event('notebook-changed'));
    });
    await waitFor(() => expect(getAllFn).toHaveBeenCalledTimes(2));
  });
});
