import { useState, useEffect, useCallback } from 'react';
import {
  useQuery,
  useMutation,
  getApolloClient,
  GET_WORSHIP_SETLISTS,
  GET_WORSHIP_SETLIST,
  ADD_WORSHIP_SETLIST,
  UPDATE_WORSHIP_SETLIST,
  DELETE_WORSHIP_SETLIST,
  WindowEvents,
} from '@mycircle/shared';
import type { Setlist, SetlistListItem, SetlistEntry } from '../types';

interface SetlistUpdateInput {
  name?: string;
  serviceDate?: string | null;
  entries?: SetlistEntry[];
}

export function useWorshipSetlists() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
    return () => {
      mounted = false;
      window.removeEventListener(WindowEvents.AUTH_STATE_CHANGED, handler);
    };
  }, []);

  const { data, loading } = useQuery(GET_WORSHIP_SETLISTS, {
    fetchPolicy: 'cache-and-network',
    skip: !isAuthenticated,
  });

  const setlists = (data?.worshipSetlists ?? []) as SetlistListItem[];

  const [addSetlistMutation] = useMutation(ADD_WORSHIP_SETLIST, {
    refetchQueries: [{ query: GET_WORSHIP_SETLISTS }],
  });

  const [updateSetlistMutation] = useMutation(UPDATE_WORSHIP_SETLIST, {
    refetchQueries: [{ query: GET_WORSHIP_SETLISTS }],
  });

  const [deleteSetlistMutation] = useMutation(DELETE_WORSHIP_SETLIST, {
    refetchQueries: [{ query: GET_WORSHIP_SETLISTS }],
  });

  const addSetlist = useCallback(
    async (input: { name: string; serviceDate?: string }): Promise<string> => {
      const result = await addSetlistMutation({ variables: { input } });
      return result.data?.addWorshipSetlist?.id ?? '';
    },
    [addSetlistMutation],
  );

  const updateSetlist = useCallback(
    async (id: string, input: SetlistUpdateInput): Promise<void> => {
      await updateSetlistMutation({ variables: { id, input } });
    },
    [updateSetlistMutation],
  );

  const deleteSetlist = useCallback(
    async (id: string): Promise<void> => {
      await deleteSetlistMutation({ variables: { id } });
    },
    [deleteSetlistMutation],
  );

  const getSetlist = useCallback(async (id: string): Promise<Setlist | null> => {
    try {
      const client = getApolloClient();
      const result = await client.query({
        query: GET_WORSHIP_SETLIST,
        variables: { id },
        fetchPolicy: 'network-only',
      });
      return (result.data?.worshipSetlist as Setlist) ?? null;
    } catch {
      return null;
    }
  }, []);

  return {
    setlists,
    loading,
    isAuthenticated,
    addSetlist,
    updateSetlist,
    deleteSetlist,
    getSetlist,
  };
}
