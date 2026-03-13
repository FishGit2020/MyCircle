import { useState, useEffect, useCallback } from 'react';
import {
  useQuery,
  useMutation,
  getApolloClient,
  GET_WORSHIP_SONGS_LIST,
  GET_WORSHIP_SONG,
  ADD_WORSHIP_SONG,
  UPDATE_WORSHIP_SONG,
  DELETE_WORSHIP_SONG,
  createLogger,
  WindowEvents,
} from '@mycircle/shared';
import type { WorshipSong, WorshipSongListItem } from '../types';

const logger = createLogger('useWorshipSongs');

export const PAGE_SIZE = 24;

export function useWorshipSongs(initialSearch = '') {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearchRaw] = useState(initialSearch);
  const [filterArtist, setFilterArtistRaw] = useState('');
  const [filterTag, setFilterTagRaw] = useState('');
  const [filterFormat, setFilterFormatRaw] = useState<'all' | 'chordpro' | 'text'>('all');
  const [favoriteIds, setFavoriteIds] = useState<string[] | null>(null);

  // Track auth state via Firebase token
  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      try {
        const token = await window.__getFirebaseIdToken?.();
        if (mounted) setIsAuthenticated(!!token);
      } catch {
        if (mounted) setIsAuthenticated(false);
      }
    };
    checkAuth();
    const handler = () => { checkAuth(); };
    window.addEventListener(WindowEvents.AUTH_STATE_CHANGED, handler);
    return () => { mounted = false; window.removeEventListener(WindowEvents.AUTH_STATE_CHANGED, handler); };
  }, []);

  const setSearch = useCallback((q: string) => {
    setSearchRaw(q);
    setPage(1);
  }, []);

  const setFilterArtist = useCallback((a: string) => {
    setFilterArtistRaw(a);
    setPage(1);
  }, []);

  const setFilterTag = useCallback((t: string) => {
    setFilterTagRaw(t);
    setPage(1);
  }, []);

  const setFilterFormat = useCallback((f: 'all' | 'chordpro' | 'text') => {
    setFilterFormatRaw(f);
    setPage(1);
  }, []);

  const setShowFavoritesOnly = useCallback((on: boolean, ids: string[]) => {
    setFavoriteIds(on ? ids : null);
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setSearchRaw('');
    setFilterArtistRaw('');
    setFilterTagRaw('');
    setFilterFormatRaw('all');
    setFavoriteIds(null);
    setPage(1);
  }, []);

  const offset = (page - 1) * PAGE_SIZE;

  const { data, loading, refetch } = useQuery(GET_WORSHIP_SONGS_LIST, {
    variables: {
      limit: PAGE_SIZE,
      offset,
      search: search.trim() || undefined,
      artist: filterArtist || undefined,
      tag: filterTag || undefined,
      format: filterFormat === 'all' ? undefined : filterFormat,
      favoriteIds: favoriteIds ?? undefined,
    },
    fetchPolicy: 'cache-and-network',
  });

  const totalCount: number = data?.worshipSongsList?.totalCount ?? 0;
  const songs = (data?.worshipSongsList?.songs ?? []) as WorshipSongListItem[];
  const allArtists: string[] = data?.worshipSongsList?.allArtists ?? [];
  const allTags: string[] = data?.worshipSongsList?.allTags ?? [];
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const goToPage = useCallback((p: number) => {
    setPage(Math.max(1, Math.min(p, totalPages)));
  }, [totalPages]);

  const [addSongMutation] = useMutation(ADD_WORSHIP_SONG, {
    refetchQueries: [{ query: GET_WORSHIP_SONGS_LIST, variables: { limit: PAGE_SIZE, offset } }],
  });

  const [updateSongMutation] = useMutation(UPDATE_WORSHIP_SONG, {
    refetchQueries: [{ query: GET_WORSHIP_SONGS_LIST, variables: { limit: PAGE_SIZE, offset } }],
  });

  const [deleteSongMutation] = useMutation(DELETE_WORSHIP_SONG, {
    refetchQueries: [{ query: GET_WORSHIP_SONGS_LIST, variables: { limit: PAGE_SIZE, offset } }],
  });

  const addSong = useCallback(
    async (song: Omit<WorshipSong, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<string> => {
      const result = await addSongMutation({ variables: { input: song } });
      return result.data?.addWorshipSong?.id ?? '';
    },
    [addSongMutation],
  );

  const updateSong = useCallback(
    async (id: string, updates: Partial<Omit<WorshipSong, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>>) => {
      await updateSongMutation({ variables: { id, input: updates } });
    },
    [updateSongMutation],
  );

  const deleteSong = useCallback(
    async (id: string) => {
      await deleteSongMutation({ variables: { id } });
    },
    [deleteSongMutation],
  );

  const getSong = useCallback(async (id: string): Promise<WorshipSong | null> => {
    try {
      const client = getApolloClient();
      const result = await client.query({
        query: GET_WORSHIP_SONG,
        variables: { id },
        fetchPolicy: 'cache-first',
      });
      return (result.data?.worshipSong ?? null) as WorshipSong | null;
    } catch (err) {
      logger.error('Failed to get worship song:', id, err);
      return null;
    }
  }, []);

  return {
    songs,
    totalCount,
    totalPages,
    page,
    allArtists,
    allTags,
    loading,
    isAuthenticated,
    search,
    setSearch,
    filterArtist,
    setFilterArtist,
    filterTag,
    setFilterTag,
    filterFormat,
    setFilterFormat,
    favoriteIds,
    setShowFavoritesOnly,
    addSong,
    updateSong,
    deleteSong,
    getSong,
    goToPage,
    resetFilters,
    refresh: refetch,
  };
}
