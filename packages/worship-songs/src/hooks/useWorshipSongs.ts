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

const PAGE_SIZE = 50;

export function useWorshipSongs() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  const { data, loading, refetch, fetchMore } = useQuery(GET_WORSHIP_SONGS_LIST, {
    variables: { limit: PAGE_SIZE, offset: 0 },
    fetchPolicy: 'cache-and-network',
  });

  const totalCount: number = data?.worshipSongsList?.totalCount ?? 0;
  const songs = (data?.worshipSongsList?.songs ?? []) as WorshipSongListItem[];
  const hasMore = songs.length < totalCount;

  const loadMore = useCallback(async () => {
    if (!hasMore) return;
    await fetchMore({
      variables: { limit: PAGE_SIZE, offset: songs.length },
      updateQuery: (prev: any, { fetchMoreResult }: any) => {
        if (!fetchMoreResult) return prev;
        return {
          worshipSongsList: {
            ...fetchMoreResult.worshipSongsList,
            songs: [
              ...prev.worshipSongsList.songs,
              ...fetchMoreResult.worshipSongsList.songs,
            ],
          },
        };
      },
    });
  }, [fetchMore, hasMore, songs.length]);

  const [addSongMutation] = useMutation(ADD_WORSHIP_SONG, {
    refetchQueries: [{ query: GET_WORSHIP_SONGS_LIST, variables: { limit: PAGE_SIZE, offset: 0 } }],
  });

  const [updateSongMutation] = useMutation(UPDATE_WORSHIP_SONG, {
    refetchQueries: [{ query: GET_WORSHIP_SONGS_LIST, variables: { limit: PAGE_SIZE, offset: 0 } }],
  });

  const [deleteSongMutation] = useMutation(DELETE_WORSHIP_SONG, {
    refetchQueries: [{ query: GET_WORSHIP_SONGS_LIST, variables: { limit: PAGE_SIZE, offset: 0 } }],
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
    hasMore,
    loading,
    isAuthenticated,
    addSong,
    updateSong,
    deleteSong,
    getSong,
    loadMore,
    refresh: refetch,
  };
}
