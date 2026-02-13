import { useState, useEffect, useCallback } from 'react';
import { WindowEvents, StorageKeys } from '@mycircle/shared';
import type { Note, NoteInput } from '../types';

interface NotebookAPI {
  getAll: () => Promise<Note[]>;
  get: (id: string) => Promise<Note | null>;
  add: (note: NoteInput) => Promise<string>;
  update: (id: string, updates: Partial<NoteInput>) => Promise<void>;
  delete: (id: string) => Promise<void>;
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const api = (window as any).__notebook as NotebookAPI | undefined;

  const loadNotes = useCallback(async () => {
    if (!api) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await api.getAll();
      setNotes(result);
      // Cache note count for dashboard tile
      try {
        localStorage.setItem(StorageKeys.NOTEBOOK_CACHE, JSON.stringify(result.length));
      } catch { /* ignore */ }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Listen to invalidation signals from other tabs/components
  useEffect(() => {
    const handler = () => loadNotes();
    window.addEventListener(WindowEvents.NOTEBOOK_CHANGED, handler);
    return () => window.removeEventListener(WindowEvents.NOTEBOOK_CHANGED, handler);
  }, [loadNotes]);

  const saveNote = useCallback(async (id: string | null, data: NoteInput) => {
    if (!api) throw new Error('Notebook API not available');
    if (id) {
      await api.update(id, data);
    } else {
      await api.add(data);
    }
    window.dispatchEvent(new Event(WindowEvents.NOTEBOOK_CHANGED));
    await loadNotes();
  }, [api, loadNotes]);

  const deleteNote = useCallback(async (id: string) => {
    if (!api) throw new Error('Notebook API not available');
    await api.delete(id);
    window.dispatchEvent(new Event(WindowEvents.NOTEBOOK_CHANGED));
    await loadNotes();
  }, [api, loadNotes]);

  return { notes, loading, error, saveNote, deleteNote, reload: loadNotes };
}
