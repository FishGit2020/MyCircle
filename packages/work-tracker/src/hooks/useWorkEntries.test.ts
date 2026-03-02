import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWorkEntries } from './useWorkEntries';

// Stable t reference prevents infinite re-renders from useCallback([..., t])
vi.mock('@mycircle/shared', () => {
  const t = (key: string) => key;
  return {
    useTranslation: () => ({ t }),
    WindowEvents: {
      AUTH_STATE_CHANGED: 'auth-state-changed',
      WORK_TRACKER_CHANGED: 'work-tracker-changed',
    },
    StorageKeys: { WORK_TRACKER_CACHE: 'work-tracker-cache' },
  };
});

vi.mock('../utils/localDate', () => ({
  getLocalDateString: vi.fn(() => '2026-03-01'),
}));

const mockEntries = [
  { id: '1', date: '2026-03-01', content: 'Task A', createdAt: { seconds: 100, nanoseconds: 0 } },
  { id: '2', date: '2026-02-28', content: 'Task B', createdAt: { seconds: 200, nanoseconds: 0 } },
];

describe('useWorkEntries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    delete (window as any).__workTracker;
    delete (window as any).__getFirebaseIdToken;
  });

  afterEach(() => {
    delete (window as any).__workTracker;
    delete (window as any).__getFirebaseIdToken;
  });

  it('starts with empty entries', async () => {
    const { result } = renderHook(() => useWorkEntries());
    expect(result.current.entries).toEqual([]);
    // Loading resolves quickly when not authenticated
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('sets loading to false when not authenticated', async () => {
    const { result } = renderHook(() => useWorkEntries());
    await waitFor(() => expect(result.current.authChecked).toBe(true));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('detects authenticated state from __getFirebaseIdToken', async () => {
    (window as any).__getFirebaseIdToken = vi.fn().mockResolvedValue('mock-token');
    (window as any).__workTracker = {
      getAll: vi.fn().mockResolvedValue([]),
      add: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    const { result } = renderHook(() => useWorkEntries());
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
  });

  it('loads entries via getAll when authenticated (no subscribe)', async () => {
    (window as any).__getFirebaseIdToken = vi.fn().mockResolvedValue('token');
    (window as any).__workTracker = {
      getAll: vi.fn().mockResolvedValue(mockEntries),
      add: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    const { result } = renderHook(() => useWorkEntries());
    await waitFor(() => expect(result.current.entries).toEqual(mockEntries));
    expect(result.current.loading).toBe(false);
  });

  it('uses subscribe when available', async () => {
    const unsubscribe = vi.fn();
    (window as any).__getFirebaseIdToken = vi.fn().mockResolvedValue('token');
    (window as any).__workTracker = {
      getAll: vi.fn(),
      add: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      subscribe: vi.fn((cb: any) => {
        setTimeout(() => cb(mockEntries), 10);
        return unsubscribe;
      }),
    };
    const { result, unmount } = renderHook(() => useWorkEntries());
    await waitFor(() => expect(result.current.entries).toEqual(mockEntries));
    expect(result.current.loading).toBe(false);
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it('falls back to loading:false after subscribe timeout if callback never fires', async () => {
    (window as any).__getFirebaseIdToken = vi.fn().mockResolvedValue('token');
    (window as any).__workTracker = {
      getAll: vi.fn(),
      add: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      subscribe: vi.fn(() => {
        // Never call the callback
        return vi.fn();
      }),
    };
    vi.useFakeTimers();
    const { result } = renderHook(() => useWorkEntries());

    // Wait for auth to be checked
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    // Advance past the 3-second timeout
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3100);
    });

    expect(result.current.loading).toBe(false);
    vi.useRealTimers();
  });

  it('addEntry calls bridge add and dispatches event', async () => {
    const addFn = vi.fn().mockResolvedValue('new-id');
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    (window as any).__getFirebaseIdToken = vi.fn().mockResolvedValue('token');
    (window as any).__workTracker = {
      getAll: vi.fn().mockResolvedValue([]),
      add: addFn,
      update: vi.fn(),
      delete: vi.fn(),
    };
    const { result } = renderHook(() => useWorkEntries());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let id: string | undefined;
    await act(async () => {
      id = await result.current.addEntry('New task');
    });

    expect(addFn).toHaveBeenCalledWith({ date: '2026-03-01', content: 'New task' });
    expect(id).toBe('new-id');
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'work-tracker-changed' })
    );
    dispatchSpy.mockRestore();
  });

  it('updateEntry calls bridge update and dispatches event', async () => {
    const updateFn = vi.fn().mockResolvedValue(undefined);
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    (window as any).__getFirebaseIdToken = vi.fn().mockResolvedValue('token');
    (window as any).__workTracker = {
      getAll: vi.fn().mockResolvedValue([]),
      add: vi.fn(),
      update: updateFn,
      delete: vi.fn(),
    };
    const { result } = renderHook(() => useWorkEntries());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateEntry('1', 'Updated content');
    });

    expect(updateFn).toHaveBeenCalledWith('1', { content: 'Updated content' });
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'work-tracker-changed' })
    );
    dispatchSpy.mockRestore();
  });

  it('deleteEntry calls bridge delete and dispatches event', async () => {
    const deleteFn = vi.fn().mockResolvedValue(undefined);
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    (window as any).__getFirebaseIdToken = vi.fn().mockResolvedValue('token');
    (window as any).__workTracker = {
      getAll: vi.fn().mockResolvedValue([]),
      add: vi.fn(),
      update: vi.fn(),
      delete: deleteFn,
    };
    const { result } = renderHook(() => useWorkEntries());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteEntry('1');
    });

    expect(deleteFn).toHaveBeenCalledWith('1');
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'work-tracker-changed' })
    );
    dispatchSpy.mockRestore();
  });

  it('moveEntry calls bridge update with new date', async () => {
    const updateFn = vi.fn().mockResolvedValue(undefined);
    (window as any).__getFirebaseIdToken = vi.fn().mockResolvedValue('token');
    (window as any).__workTracker = {
      getAll: vi.fn().mockResolvedValue([]),
      add: vi.fn(),
      update: updateFn,
      delete: vi.fn(),
    };
    const { result } = renderHook(() => useWorkEntries());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.moveEntry('1', '2026-02-20');
    });

    expect(updateFn).toHaveBeenCalledWith('1', { date: '2026-02-20' });
  });

  it('throws when addEntry is called without bridge API', async () => {
    const { result } = renderHook(() => useWorkEntries());
    await waitFor(() => expect(result.current.authChecked).toBe(true));

    await expect(
      act(async () => { await result.current.addEntry('test'); })
    ).rejects.toThrow('Work tracker API not available');
  });

  it('throws when updateEntry is called without bridge API', async () => {
    const { result } = renderHook(() => useWorkEntries());
    await waitFor(() => expect(result.current.authChecked).toBe(true));

    await expect(
      act(async () => { await result.current.updateEntry('1', 'x'); })
    ).rejects.toThrow('Work tracker API not available');
  });

  it('throws when deleteEntry is called without bridge API', async () => {
    const { result } = renderHook(() => useWorkEntries());
    await waitFor(() => expect(result.current.authChecked).toBe(true));

    await expect(
      act(async () => { await result.current.deleteEntry('1'); })
    ).rejects.toThrow('Work tracker API not available');
  });

  it('throws when moveEntry is called without bridge API', async () => {
    const { result } = renderHook(() => useWorkEntries());
    await waitFor(() => expect(result.current.authChecked).toBe(true));

    await expect(
      act(async () => { await result.current.moveEntry('1', '2026-02-20'); })
    ).rejects.toThrow('Work tracker API not available');
  });

  it('reloads on WORK_TRACKER_CHANGED event when no subscribe', async () => {
    const getAllFn = vi.fn().mockResolvedValue(mockEntries);
    (window as any).__getFirebaseIdToken = vi.fn().mockResolvedValue('token');
    (window as any).__workTracker = {
      getAll: getAllFn,
      add: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    renderHook(() => useWorkEntries());
    await waitFor(() => expect(getAllFn).toHaveBeenCalledTimes(1));

    act(() => {
      window.dispatchEvent(new Event('work-tracker-changed'));
    });
    await waitFor(() => expect(getAllFn).toHaveBeenCalledTimes(2));
  });

  it('re-checks auth on AUTH_STATE_CHANGED event', async () => {
    const tokenFn = vi.fn()
      .mockResolvedValueOnce(null)    // First check: not authenticated
      .mockResolvedValueOnce('token'); // Second check after event
    (window as any).__getFirebaseIdToken = tokenFn;
    (window as any).__workTracker = {
      getAll: vi.fn().mockResolvedValue([]),
      add: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const { result } = renderHook(() => useWorkEntries());
    await waitFor(() => expect(result.current.isAuthenticated).toBe(false));

    await act(async () => {
      window.dispatchEvent(new Event('auth-state-changed'));
    });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
  });

  it('refresh function re-loads entries', async () => {
    const getAllFn = vi.fn().mockResolvedValue(mockEntries);
    (window as any).__getFirebaseIdToken = vi.fn().mockResolvedValue('token');
    (window as any).__workTracker = {
      getAll: getAllFn,
      add: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    const { result } = renderHook(() => useWorkEntries());
    await waitFor(() => expect(result.current.loading).toBe(false));
    const initialCallCount = getAllFn.mock.calls.length;

    await act(async () => {
      await result.current.refresh();
    });
    expect(getAllFn.mock.calls.length).toBeGreaterThan(initialCallCount);
  });

  it('handles auth check failure gracefully', async () => {
    (window as any).__getFirebaseIdToken = vi.fn().mockRejectedValue(new Error('auth error'));
    const { result } = renderHook(() => useWorkEntries());
    await waitFor(() => expect(result.current.authChecked).toBe(true));
    expect(result.current.isAuthenticated).toBe(false);
  });
});
