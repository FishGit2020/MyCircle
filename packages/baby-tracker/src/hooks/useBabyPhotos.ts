import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, WindowEvents, createLogger, GET_BABY_PHOTOS, DELETE_BABY_PHOTO } from '@mycircle/shared';
import { compressImage } from '../utils/compressImage';

const logger = createLogger('useBabyPhotos');

export interface MilestonePhotoData {
  photoUrl: string;
  caption?: string;
}

export function useBabyPhotos() {
  const [uploading, setUploading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorStageId, setErrorStageId] = useState<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  const [deletePhotoMutation] = useMutation(DELETE_BABY_PHOTO, {
    refetchQueries: [{ query: GET_BABY_PHOTOS }],
  });

  // Build the photos map from GraphQL data
  const photos = new Map<number, MilestonePhotoData>(
    (data?.babyPhotos ?? []).map((p: { stageId: number; photoUrl: string; caption?: string | null }) => [
      p.stageId,
      { photoUrl: p.photoUrl, caption: p.caption ?? undefined },
    ])
  );

  const uploadPhoto = useCallback(async (stageId: number, file: File, caption?: string) => {
    if (!window.__babyPhotos) throw new Error('Baby photos API not available');
    setUploading(stageId);
    setError(null);
    try {
      const compressed = await compressImage(file);
      await window.__babyPhotos.upload(stageId, compressed, caption);
      await refetch();
      window.dispatchEvent(new Event(WindowEvents.BABY_MILESTONES_CHANGED));
      window.__logAnalyticsEvent?.('baby_milestone_photo_upload', { stageId });
    } catch (err: any) {
      const msg = err?.message || 'Upload failed';
      setError(msg);
      setErrorStageId(stageId);
      logger.error('Baby photo upload failed:', err);
    } finally {
      setUploading(null);
    }
  }, [refetch]);

  const deletePhoto = useCallback(async (stageId: number) => {
    await deletePhotoMutation({ variables: { stageId } });
    window.dispatchEvent(new Event(WindowEvents.BABY_MILESTONES_CHANGED));
    window.__logAnalyticsEvent?.('baby_milestone_photo_delete', { stageId });
  }, [deletePhotoMutation]);

  const clearError = useCallback(() => { setError(null); setErrorStageId(null); }, []);

  return { photos, uploading, error, errorStageId, clearError, uploadPhoto, deletePhoto, isAuthenticated, loading };
}
