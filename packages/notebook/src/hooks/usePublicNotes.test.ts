import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePublicNotes } from './usePublicNotes';

// Stable t reference prevents infinite re-renders from useCallback([..., t])
vi.mock('@mycircle/shared', () => {
  const t = (key: string) => key;
  return {
    useTranslation: () => ({ t }),
    WindowEvents: { PUBLIC_NOTES_CHANGED: 'public-notes-changed' },
  };
});

const mockPublicNotes = [
  { id: 'p1', title: 'Public 1', content: 'C1', isPublic: true, createdBy: { uid: 'u1', displayName: 'Alice' }, createdAt: new Date(), updatedAt: new Date() },
];

describe('usePublicNotes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete window.__notebook;
  });

  afterEach(() => {
    delete window.__notebook;
  });

  it('returns empty when no API', async () => {
    const { result } = renderHook(() => usePublicNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.notes).toEqual([]);
  });

  it('loads public notes via getAllPublic', async () => {
    window.__notebook = {
      getAllPublic: vi.fn().mockResolvedValue(mockPublicNotes),
    };
    const { result } = renderHook(() => usePublicNotes());
    await waitFor(() => expect(result.current.notes).toEqual(mockPublicNotes));
  });

  it('uses subscribePublic when available', async () => {
    const unsub = vi.fn();
    window.__notebook = {
      getAllPublic: vi.fn(),
      subscribePublic: vi.fn((cb: any) => {
        setTimeout(() => cb(mockPublicNotes), 10);
        return unsub;
      }),
    };
    const { result, unmount } = renderHook(() => usePublicNotes());
    await waitFor(() => expect(result.current.notes).toEqual(mockPublicNotes));
    unmount();
    expect(unsub).toHaveBeenCalled();
  });

  it('publishes a note', async () => {
    const publishFn = vi.fn().mockResolvedValue('pub-id');
    window.__notebook = {
      getAllPublic: vi.fn().mockResolvedValue([]),
      publish: publishFn,
    };
    const { result } = renderHook(() => usePublicNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.publishNote({ title: 'T', content: 'C' });
    });
    expect(publishFn).toHaveBeenCalledWith({ title: 'T', content: 'C' });
  });

  it('updates a public note', async () => {
    const updateFn = vi.fn().mockResolvedValue(undefined);
    window.__notebook = {
      getAllPublic: vi.fn().mockResolvedValue([]),
      updatePublic: updateFn,
    };
    const { result } = renderHook(() => usePublicNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.updateNote('p1', { title: 'Updated' });
    });
    expect(updateFn).toHaveBeenCalledWith('p1', { title: 'Updated' });
  });

  it('deletes a public note', async () => {
    const deleteFn = vi.fn().mockResolvedValue(undefined);
    window.__notebook = {
      getAllPublic: vi.fn().mockResolvedValue([]),
      deletePublic: deleteFn,
    };
    const { result } = renderHook(() => usePublicNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.deleteNote('p1');
    });
    expect(deleteFn).toHaveBeenCalledWith('p1');
  });

  it('handles error during load', async () => {
    window.__notebook = {
      getAllPublic: vi.fn().mockRejectedValue(new Error('Network error')),
    };
    const { result } = renderHook(() => usePublicNotes());
    await waitFor(() => expect(result.current.error).toBe('Network error'));
  });

  it('throws when publishing without API', async () => {
    const { result } = renderHook(() => usePublicNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await expect(
      act(async () => { await result.current.publishNote({ title: 'T', content: 'C' }); })
    ).rejects.toThrow('Notebook API not available');
  });

  it('reloads on PUBLIC_NOTES_CHANGED event when no subscribe', async () => {
    const getAllFn = vi.fn().mockResolvedValue(mockPublicNotes);
    window.__notebook = { getAllPublic: getAllFn };
    renderHook(() => usePublicNotes());
    await waitFor(() => expect(getAllFn).toHaveBeenCalledTimes(1));
    act(() => { window.dispatchEvent(new Event('public-notes-changed')); });
    await waitFor(() => expect(getAllFn).toHaveBeenCalledTimes(2));
  });
});
