import { useState, useEffect, useCallback } from 'react';
import {
  useQuery,
  useMutation,
  getApolloClient,
  GET_WORSHIP_SONGS,
  GET_WORSHIP_SONG,
  ADD_WORSHIP_SONG,
  UPDATE_WORSHIP_SONG,
  DELETE_WORSHIP_SONG,
  createLogger,
  WindowEvents,
} from '@mycircle/shared';
import type { WorshipSong } from '../types';

const logger = createLogger('useWorshipSongs');

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

  const { data, loading, refetch } = useQuery(GET_WORSHIP_SONGS, {
    fetchPolicy: 'cache-and-network',
  });

  const [addSongMutation] = useMutation(ADD_WORSHIP_SONG, {
    refetchQueries: [{ query: GET_WORSHIP_SONGS }],
  });

  const [updateSongMutation] = useMutation(UPDATE_WORSHIP_SONG, {
    refetchQueries: [{ query: GET_WORSHIP_SONGS }],
  });

  const [deleteSongMutation] = useMutation(DELETE_WORSHIP_SONG, {
    refetchQueries: [{ query: GET_WORSHIP_SONGS }],
  });

  const songs = (data?.worshipSongs ?? []) as WorshipSong[];

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
    loading,
    isAuthenticated,
    addSong,
    updateSong,
    deleteSong,
    getSong,
    refresh: refetch,
  };
}
