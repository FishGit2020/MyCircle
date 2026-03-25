import { useState, useEffect, useCallback, startTransition } from 'react';
import {
  useQuery,
  useMutation,
  GET_NOTES,
  ADD_NOTE,
  UPDATE_NOTE,
  DELETE_NOTE,
  WindowEvents,
  StorageKeys,
  useTranslation,
} from '@mycircle/shared';
import type { Note, NoteInput } from '../types';

interface NotebookSubscribeAPI {
  subscribe?: (callback: (notes: Note[]) => void) => () => void;
}

export function useNotes() {
  const { t } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth check — mirrors the pattern used by other MFE hooks
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

  // Primary data source: Apollo query (GraphQL-first)
  const { data, loading } = useQuery(GET_NOTES, {
    fetchPolicy: 'cache-and-network',
    skip: !isAuthenticated,
    errorPolicy: 'all',
  });

  const notes = (data?.notes ?? []) as Note[];

  // Mutations
  const [addNoteMutation] = useMutation(ADD_NOTE, {
    refetchQueries: [{ query: GET_NOTES }],
  });
  const [updateNoteMutation] = useMutation(UPDATE_NOTE, {
    refetchQueries: [{ query: GET_NOTES }],
  });
  const [deleteNoteMutation] = useMutation(DELETE_NOTE, {
    refetchQueries: [{ query: GET_NOTES }],
  });

  // Secondary: real-time Firestore subscription via window.__notebook (belt-and-suspenders for cross-device sync)
  useEffect(() => {
    const api = window.__notebook as NotebookSubscribeAPI | undefined;
    if (!api?.subscribe || !isAuthenticated) return;

    const unsubscribe = api.subscribe((data) => {
      // Update dashboard cache on real-time push
      startTransition(() => {
        try {
          localStorage.setItem(StorageKeys.NOTEBOOK_CACHE, JSON.stringify(data.length));
          window.dispatchEvent(new Event(WindowEvents.NOTEBOOK_CHANGED));
        } catch { /* ignore */ }
      });
    });
    return () => { unsubscribe(); };
  }, [isAuthenticated]);

  const saveNote = useCallback(async (id: string | null, data: NoteInput) => {
    setError(null);
    try {
      if (id) {
        await updateNoteMutation({ variables: { id, input: data } });
      } else {
        await addNoteMutation({ variables: { input: data } });
      }
      // Update dashboard cache
      try {
        localStorage.setItem(StorageKeys.NOTEBOOK_CACHE, JSON.stringify(notes.length));
        window.dispatchEvent(new Event(WindowEvents.NOTEBOOK_CHANGED));
      } catch { /* ignore */ }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('notebook.saveError'));
      throw err;
    }
  }, [updateNoteMutation, addNoteMutation, notes.length, t]);

  const deleteNote = useCallback(async (id: string) => {
    setError(null);
    try {
      await deleteNoteMutation({ variables: { id } });
      try {
        window.dispatchEvent(new Event(WindowEvents.NOTEBOOK_CHANGED));
      } catch { /* ignore */ }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('notebook.deleteError'));
      throw err;
    }
  }, [deleteNoteMutation, t]);

  // Stub for backward compatibility (callers that used `reload`)
  const reload = useCallback(() => {}, []);

  return { notes, loading, error, saveNote, deleteNote, reload };
}
