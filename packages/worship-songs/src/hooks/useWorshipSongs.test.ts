import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWorshipSongs } from './useWorshipSongs';
import type { WorshipSong, WorshipSongListItem } from '../types';

const mockRefetch = vi.fn().mockResolvedValue({});
const mockFetchMore = vi.fn().mockResolvedValue({});
const mockAddSongMutation = vi.fn();
const mockUpdateSongMutation = vi.fn();
const mockDeleteSongMutation = vi.fn();

let mockSongsData: WorshipSongListItem[] = [];
let mockTotalCount = 0;
let mockQueryLoading = false;

vi.mock('@mycircle/shared', () => {
  return {
    WindowEvents: {
      AUTH_STATE_CHANGED: 'auth-state-changed',
    },
    createLogger: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
    useQuery: () => ({
      data: { worshipSongsList: { songs: mockSongsData, totalCount: mockTotalCount } },
      loading: mockQueryLoading,
      refetch: mockRefetch,
      fetchMore: mockFetchMore,
    }),
    useMutation: (mutation: any) => {
      const opName = mutation?.definitions?.[0]?.name?.value ?? '';
      if (opName === 'AddWorshipSong') return [mockAddSongMutation, {}];
      if (opName === 'UpdateWorshipSong') return [mockUpdateSongMutation, {}];
      if (opName === 'DeleteWorshipSong') return [mockDeleteSongMutation, {}];
      return [vi.fn(), {}];
    },
    getApolloClient: () => ({
      query: vi.fn().mockResolvedValue({ data: { worshipSong: mockSongsData[0] ?? null } }),
    }),
    GET_WORSHIP_SONGS_LIST: { kind: 'Document', definitions: [{ kind: 'OperationDefinition', name: { value: 'GetWorshipSongsList' } }] },
    GET_WORSHIP_SONG: { kind: 'Document', definitions: [{ kind: 'OperationDefinition', name: { value: 'GetWorshipSong' } }] },
    ADD_WORSHIP_SONG: { kind: 'Document', definitions: [{ kind: 'OperationDefinition', name: { value: 'AddWorshipSong' } }] },
    UPDATE_WORSHIP_SONG: { kind: 'Document', definitions: [{ kind: 'OperationDefinition', name: { value: 'UpdateWorshipSong' } }] },
    DELETE_WORSHIP_SONG: { kind: 'Document', definitions: [{ kind: 'OperationDefinition', name: { value: 'DeleteWorshipSong' } }] },
  };
});

const makeListItem = (overrides: Partial<WorshipSongListItem> = {}): WorshipSongListItem => ({
  id: '1',
  title: 'Amazing Grace',
  artist: 'John Newton',
  originalKey: 'G',
  format: 'chordpro',
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const makeSong = (overrides: Partial<WorshipSong> = {}): WorshipSong => ({
  id: '1',
  title: 'Amazing Grace',
  artist: 'John Newton',
  originalKey: 'G',
  format: 'chordpro',
  content: '[G]Amazing [C]grace',
  notes: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const listItems: WorshipSongListItem[] = [
  makeListItem({ id: '1', title: 'Amazing Grace' }),
  makeListItem({ id: '2', title: 'How Great Thou Art' }),
];

describe('useWorshipSongs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSongsData = listItems;
    mockTotalCount = 2;
    mockQueryLoading = false;
    window.__getFirebaseIdToken = vi.fn().mockResolvedValue('mock-token');
    mockAddSongMutation.mockResolvedValue({ data: { addWorshipSong: { ...makeSong(), id: 'new-id' } } });
    mockUpdateSongMutation.mockResolvedValue({ data: { updateWorshipSong: makeSong({ id: '1', title: 'Updated' }) } });
    mockDeleteSongMutation.mockResolvedValue({ data: { deleteWorshipSong: true } });
  });

  afterEach(() => {
    delete window.__getFirebaseIdToken;
  });

  it('returns songs from Apollo query', () => {
    const { result } = renderHook(() => useWorshipSongs());
    expect(result.current.songs).toHaveLength(2);
    expect(result.current.songs[0].title).toBe('Amazing Grace');
  });

  it('returns totalCount and hasMore', () => {
    mockTotalCount = 100;
    const { result } = renderHook(() => useWorshipSongs());
    expect(result.current.totalCount).toBe(100);
    expect(result.current.hasMore).toBe(true);
  });

  it('hasMore is false when all songs loaded', () => {
    mockTotalCount = 2;
    const { result } = renderHook(() => useWorshipSongs());
    expect(result.current.hasMore).toBe(false);
  });

  it('returns loading state from Apollo query', () => {
    mockQueryLoading = true;
    const { result } = renderHook(() => useWorshipSongs());
    expect(result.current.loading).toBe(true);
  });

  it('detects authentication when token is available', async () => {
    const { result } = renderHook(() => useWorshipSongs());
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
  });

  it('detects unauthenticated state when no token', async () => {
    window.__getFirebaseIdToken = vi.fn().mockResolvedValue(null);
    const { result } = renderHook(() => useWorshipSongs());
    await waitFor(() => expect(result.current.isAuthenticated).toBe(false));
  });

  it('addSong calls mutation and returns new id', async () => {
    const { result } = renderHook(() => useWorshipSongs());
    const newSong = { title: 'New Song', artist: 'Artist', originalKey: 'C', format: 'text' as const, content: 'Lyrics', notes: '' };
    let id = '';
    await act(async () => { id = await result.current.addSong(newSong); });
    expect(id).toBe('new-id');
    expect(mockAddSongMutation).toHaveBeenCalledWith({ variables: { input: newSong } });
  });

  it('updateSong calls mutation with id and input', async () => {
    const { result } = renderHook(() => useWorshipSongs());
    await act(async () => { await result.current.updateSong('1', { title: 'Updated' }); });
    expect(mockUpdateSongMutation).toHaveBeenCalledWith({ variables: { id: '1', input: { title: 'Updated' } } });
  });

  it('deleteSong calls mutation with id', async () => {
    const { result } = renderHook(() => useWorshipSongs());
    await act(async () => { await result.current.deleteSong('1'); });
    expect(mockDeleteSongMutation).toHaveBeenCalledWith({ variables: { id: '1' } });
  });

  it('refresh calls Apollo refetch', async () => {
    const { result } = renderHook(() => useWorshipSongs());
    await act(async () => { await result.current.refresh(); });
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('loadMore calls fetchMore', async () => {
    mockTotalCount = 100;
    const { result } = renderHook(() => useWorshipSongs());
    await act(async () => { await result.current.loadMore(); });
    expect(mockFetchMore).toHaveBeenCalled();
  });

  it('returns empty songs when no data', () => {
    mockSongsData = [];
    mockTotalCount = 0;
    const { result } = renderHook(() => useWorshipSongs());
    expect(result.current.songs).toEqual([]);
  });
});
