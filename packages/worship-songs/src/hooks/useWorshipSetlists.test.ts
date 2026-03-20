import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWorshipSetlists } from './useWorshipSetlists';

const mockAddMutation = vi.fn();
const mockUpdateMutation = vi.fn();
const mockDeleteMutation = vi.fn();
const mockQuery = vi.fn();

vi.mock('@mycircle/shared', () => ({
  useQuery: vi.fn(() => ({ data: null, loading: false })),
  useMutation: vi.fn((mutation: unknown) => {
    if (mutation === 'ADD') return [mockAddMutation];
    if (mutation === 'UPDATE') return [mockUpdateMutation];
    if (mutation === 'DELETE') return [mockDeleteMutation];
    return [vi.fn()];
  }),
  getApolloClient: vi.fn(() => ({ query: mockQuery })),
  GET_WORSHIP_SETLISTS: 'GET_WORSHIP_SETLISTS',
  GET_WORSHIP_SETLIST: 'GET_WORSHIP_SETLIST',
  ADD_WORSHIP_SETLIST: 'ADD',
  UPDATE_WORSHIP_SETLIST: 'UPDATE',
  DELETE_WORSHIP_SETLIST: 'DELETE',
  WindowEvents: { AUTH_STATE_CHANGED: 'auth-state-changed' },
}));

describe('useWorshipSetlists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as unknown as Record<string, unknown>).__getFirebaseIdToken;
  });

  it('returns empty setlists and unauthenticated when no token', async () => {
    (window as unknown as Record<string, unknown>).__getFirebaseIdToken = vi.fn().mockResolvedValue(null);
    const { result } = renderHook(() => useWorshipSetlists());
    // wait for async auth check
    await act(async () => { await Promise.resolve(); });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.setlists).toEqual([]);
  });

  it('sets isAuthenticated true when token exists', async () => {
    (window as unknown as Record<string, unknown>).__getFirebaseIdToken = vi.fn().mockResolvedValue('token-123');
    const { result } = renderHook(() => useWorshipSetlists());
    await act(async () => { await Promise.resolve(); });
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('addSetlist calls mutation and returns id', async () => {
    (window as unknown as Record<string, unknown>).__getFirebaseIdToken = vi.fn().mockResolvedValue('token');
    mockAddMutation.mockResolvedValue({ data: { addWorshipSetlist: { id: 'sl-1' } } });
    const { result } = renderHook(() => useWorshipSetlists());
    await act(async () => { await Promise.resolve(); });
    let id = '';
    await act(async () => {
      id = await result.current.addSetlist({ name: 'Sunday Service' });
    });
    expect(mockAddMutation).toHaveBeenCalledWith({ variables: { input: { name: 'Sunday Service' } } });
    expect(id).toBe('sl-1');
  });

  it('deleteSetlist calls mutation with id', async () => {
    (window as unknown as Record<string, unknown>).__getFirebaseIdToken = vi.fn().mockResolvedValue('token');
    mockDeleteMutation.mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useWorshipSetlists());
    await act(async () => { await Promise.resolve(); });
    await act(async () => {
      await result.current.deleteSetlist('sl-1');
    });
    expect(mockDeleteMutation).toHaveBeenCalledWith({ variables: { id: 'sl-1' } });
  });

  it('getSetlist returns null on error', async () => {
    (window as unknown as Record<string, unknown>).__getFirebaseIdToken = vi.fn().mockResolvedValue('token');
    mockQuery.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useWorshipSetlists());
    await act(async () => { await Promise.resolve(); });
    let setlist: unknown;
    await act(async () => {
      setlist = await result.current.getSetlist('sl-999');
    });
    expect(setlist).toBeNull();
  });

  it('getSetlist returns setlist data on success', async () => {
    (window as unknown as Record<string, unknown>).__getFirebaseIdToken = vi.fn().mockResolvedValue('token');
    const mockSetlist = { id: 'sl-1', name: 'Test', entries: [], createdAt: '', updatedAt: '', createdBy: 'u1' };
    mockQuery.mockResolvedValue({ data: { worshipSetlist: mockSetlist } });
    const { result } = renderHook(() => useWorshipSetlists());
    await act(async () => { await Promise.resolve(); });
    let setlist: unknown;
    await act(async () => {
      setlist = await result.current.getSetlist('sl-1');
    });
    expect(setlist).toEqual(mockSetlist);
  });
});
