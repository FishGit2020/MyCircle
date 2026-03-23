import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, WindowEvents, createLogger, GET_BABY_PHOTOS, DELETE_BABY_PHOTO, GET_BABY_MILESTONE_NOTES, SAVE_BABY_MILESTONE_NOTES } from '@mycircle/shared';
import { compressImage } from '../utils/compressImage';

const logger = createLogger('useBabyPhotos');

export interface MilestonePhotoData {
  photoId: string;
  photoUrl: string;
  caption?: string;
}

export function useBabyPhotos() {
  const [uploading, setUploading] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [errorStageId, setErrorStageId] = useState<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [savingNotes, setSavingNotes] = useState<Set<number>>(new Set());

  // Check auth state
  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      if (document.visibilityState === 'hidden') return;
      try {
        const token = await window.__getFirebaseIdToken?.();
        if (mounted) setIsAuthenticated(!!token);
      } catch {
        if (mounted) setIsAuthenticated(false);
      }
    };
    checkAuth();
    const interval = setInterval(checkAuth, 5000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const { data, loading, refetch } = useQuery(GET_BABY_PHOTOS, {
    skip: !isAuthenticated,
  });

  const { data: notesData, loading: notesLoading, refetch: refetchNotes } = useQuery(GET_BABY_MILESTONE_NOTES, {
    skip: !isAuthenticated,
  });

  const [deletePhotoMutation] = useMutation(DELETE_BABY_PHOTO, {
    refetchQueries: [{ query: GET_BABY_PHOTOS }],
  });

  const [saveNotesMutation] = useMutation(SAVE_BABY_MILESTONE_NOTES, {
    refetchQueries: [{ query: GET_BABY_MILESTONE_NOTES }],
  });

  // Build the photos map: stageId -> array of photos
  const photos = new Map<number, MilestonePhotoData[]>();
  for (const p of (data?.babyPhotos ?? []) as { stageId: number; photoId: string; photoUrl: string; caption?: string | null }[]) {
    const arr = photos.get(p.stageId) ?? [];
    arr.push({ photoId: p.photoId, photoUrl: p.photoUrl, caption: p.caption ?? undefined });
    photos.set(p.stageId, arr);
  }

  // Build notes map: stageId -> notes string
  const notes = new Map<number, string>(
    (notesData?.babyMilestoneNotes ?? [])
      .filter((n: { stageId: number; notes?: string | null }) => n.notes != null)
      .map((n: { stageId: number; notes: string }) => [n.stageId, n.notes])
  );

  const uploadPhoto = useCallback(async (stageId: number, file: File, caption?: string) => {
    if (!window.__babyPhotos) throw new Error('Baby photos API not available');
    setUploading(prev => new Set(prev).add(stageId));
    setError(null);
    try {
      const compressed = await compressImage(file);
      await window.__babyPhotos.upload(stageId, compressed, caption);
      await refetch();
      window.dispatchEvent(new Event(WindowEvents.BABY_MILESTONES_CHANGED));
      window.__logAnalyticsEvent?.('baby_milestone_photo_upload', { stageId });
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      const msg = err?.message || 'Upload failed';
      setError(msg);
      setErrorStageId(stageId);
      logger.error('Baby photo upload failed:', err);
    } finally {
      setUploading(prev => { const s = new Set(prev); s.delete(stageId); return s; });
    }
  }, [refetch]);

  const deletePhoto = useCallback(async (stageId: number, photoId: string) => {
    await deletePhotoMutation({ variables: { stageId, photoId } });
    window.dispatchEvent(new Event(WindowEvents.BABY_MILESTONES_CHANGED));
    window.__logAnalyticsEvent?.('baby_milestone_photo_delete', { stageId });
  }, [deletePhotoMutation]);

  const saveNotes = useCallback(async (stageId: number, notesText: string) => {
    setSavingNotes(prev => new Set(prev).add(stageId));
    try {
      await saveNotesMutation({ variables: { stageId, notes: notesText } });
      await refetchNotes();
    } finally {
      setSavingNotes(prev => { const s = new Set(prev); s.delete(stageId); return s; });
    }
  }, [saveNotesMutation, refetchNotes]);

  const clearError = useCallback(() => { setError(null); setErrorStageId(null); }, []);

  const isUploading = useCallback((stageId: number) => uploading.has(stageId), [uploading]);
  const isSavingNotes = useCallback((stageId: number) => savingNotes.has(stageId), [savingNotes]);

  return { photos, notes, isUploading, isSavingNotes, error, errorStageId, clearError, uploadPhoto, deletePhoto, saveNotes, isAuthenticated, loading: loading || notesLoading };
}
