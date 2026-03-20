import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useNotes } from './useNotes';

const mockAddMutation = vi.fn().mockResolvedValue({ data: { addNote: { id: 'new-id', title: 'T', content: 'C', createdAt: '', updatedAt: '' } } });
const mockUpdateMutation = vi.fn().mockResolvedValue({ data: { updateNote: { id: '1', title: 'Updated', content: 'Body', createdAt: '', updatedAt: '' } } });
const mockDeleteMutation = vi.fn().mockResolvedValue({ data: { deleteNote: true } });

const mockNotes = [
  { id: '1', title: 'Note 1', content: 'Content 1', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: '2', title: 'Note 2', content: 'Content 2', createdAt: '2024-01-02', updatedAt: '2024-01-02' },
];

// Stable t reference prevents infinite re-renders from useCallback([..., t])
vi.mock('@mycircle/shared', () => {
  const t = (key: string) => key;
  return {
    useTranslation: () => ({ t }),
    useQuery: vi.fn(() => ({ data: { notes: mockNotes }, loading: false })),
    useMutation: vi.fn((mutation: unknown) => {
      if (mutation === 'ADD_NOTE') return [mockAddMutation];
      if (mutation === 'UPDATE_NOTE') return [mockUpdateMutation];
      if (mutation === 'DELETE_NOTE') return [mockDeleteMutation];
      return [vi.fn()];
    }),
    GET_NOTES: 'GET_NOTES',
    ADD_NOTE: 'ADD_NOTE',
    UPDATE_NOTE: 'UPDATE_NOTE',
    DELETE_NOTE: 'DELETE_NOTE',
    WindowEvents: {
      AUTH_STATE_CHANGED: 'auth-state-changed',
      NOTEBOOK_CHANGED: 'notebook-changed',
    },
    StorageKeys: { NOTEBOOK_CACHE: 'notebook-cache' },
  };
});

describe('useNotes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Default: authenticated
    window.__getFirebaseIdToken = vi.fn().mockResolvedValue('mock-token');
    delete (window as Record<string, unknown>).__notebook;
  });

  afterEach(() => {
    delete (window as Record<string, unknown>).__notebook;
    delete window.__getFirebaseIdToken;
  });

  it('returns notes from GraphQL query when authenticated', async () => {
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.notes).toEqual(mockNotes);
    expect(result.current.error).toBeNull();
  });

  it('returns empty notes and no error when not authenticated', async () => {
    window.__getFirebaseIdToken = vi.fn().mockResolvedValue(null);
    const { useQuery } = await import('@mycircle/shared');
    (useQuery as ReturnType<typeof vi.fn>).mockReturnValue({ data: null, loading: false });
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.notes).toEqual([]);
  });

  it('calls addNoteMutation when saveNote is called with null id', async () => {
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.saveNote(null, { title: 'New', content: 'Body' });
    });
    expect(mockAddMutation).toHaveBeenCalledWith({
      variables: { input: { title: 'New', content: 'Body' } },
    });
  });

  it('calls updateNoteMutation when saveNote is called with an id', async () => {
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.saveNote('note-1', { title: 'Updated', content: 'New body' });
    });
    expect(mockUpdateMutation).toHaveBeenCalledWith({
      variables: { id: 'note-1', input: { title: 'Updated', content: 'New body' } },
    });
  });

  it('calls deleteNoteMutation when deleteNote is called', async () => {
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.deleteNote('note-1');
    });
    expect(mockDeleteMutation).toHaveBeenCalledWith({ variables: { id: 'note-1' } });
  });

  it('sets error when saveNote mutation throws', async () => {
    mockAddMutation.mockRejectedValueOnce(new Error('Save failed'));
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.saveNote(null, { title: 'T', content: 'C' }).catch(() => {});
    });
    await waitFor(() => expect(result.current.error).toBe('Save failed'));
  });

  it('sets error when deleteNote mutation throws', async () => {
    mockDeleteMutation.mockRejectedValueOnce(new Error('Delete failed'));
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.deleteNote('note-1').catch(() => {});
    });
    await waitFor(() => expect(result.current.error).toBe('Delete failed'));
  });

  it('attaches real-time subscribe when window.__notebook is available', async () => {
    const unsubscribe = vi.fn();
    const subscribeFn = vi.fn().mockImplementation((cb: (notes: unknown[]) => void) => {
      setTimeout(() => cb(mockNotes), 10);
      return unsubscribe;
    });
    (window as Record<string, unknown>).__notebook = { subscribe: subscribeFn };
    const { unmount } = renderHook(() => useNotes());
    await waitFor(() => expect(subscribeFn).toHaveBeenCalled());
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it('dispatches NOTEBOOK_CHANGED event after save', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.saveNote(null, { title: 'T', content: 'C' });
    });
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'notebook-changed' }));
  });
});
