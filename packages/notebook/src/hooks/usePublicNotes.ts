import { useState, useEffect, useCallback } from 'react';
import { WindowEvents, useTranslation } from '@mycircle/shared';
import type { PublicNote, NoteInput } from '../types';

interface PublicNotebookAPI {
  getAllPublic: () => Promise<PublicNote[]>;
  subscribePublic?: (callback: (notes: PublicNote[]) => void) => () => void;
  publish: (note: NoteInput) => Promise<string>;
  updatePublic: (id: string, updates: Partial<NoteInput>) => Promise<void>;
  deletePublic: (id: string) => Promise<void>;
}

export function usePublicNotes() {
  const { t } = useTranslation();
  const [notes, setNotes] = useState<PublicNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const api = (window as any).__notebook as (PublicNotebookAPI & Record<string, unknown>) | undefined;

  const loadNotes = useCallback(async () => {
    if (!api?.getAllPublic) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await api.getAllPublic();
      setNotes(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('notebook.loadError'));
    } finally {
      setLoading(false);
    }
  }, [api, t]);

  // Use real-time subscription if available, fall back to one-shot fetch
  useEffect(() => {
    if (api?.subscribePublic) {
      const unsubscribe = api.subscribePublic((data) => {
        setNotes(data);
        setLoading(false);
        setError(null);
      });
      return unsubscribe;
    }
    // Fallback: one-shot fetch + event listener
    loadNotes();
    const handler = () => loadNotes();
    window.addEventListener(WindowEvents.PUBLIC_NOTES_CHANGED, handler);
    return () => window.removeEventListener(WindowEvents.PUBLIC_NOTES_CHANGED, handler);
  }, [api, loadNotes]);

  const publishNote = useCallback(async (data: NoteInput) => {
    if (!api?.publish) throw new Error('Notebook API not available');
    await api.publish(data);
    window.dispatchEvent(new Event(WindowEvents.PUBLIC_NOTES_CHANGED));
  }, [api]);

  const updateNote = useCallback(async (id: string, data: Partial<NoteInput>) => {
    if (!api?.updatePublic) throw new Error('Notebook API not available');
    await api.updatePublic(id, data);
    window.dispatchEvent(new Event(WindowEvents.PUBLIC_NOTES_CHANGED));
  }, [api]);

  const deleteNote = useCallback(async (id: string) => {
    if (!api?.deletePublic) throw new Error('Notebook API not available');
    await api.deletePublic(id);
    window.dispatchEvent(new Event(WindowEvents.PUBLIC_NOTES_CHANGED));
  }, [api]);

  return { notes, loading, error, publishNote, updateNote, deleteNote, reload: loadNotes };
}
