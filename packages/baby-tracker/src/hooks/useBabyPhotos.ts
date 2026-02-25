import { useState, useEffect, useCallback } from 'react';
import { StorageKeys, WindowEvents } from '@mycircle/shared';
import { compressImage } from '../utils/compressImage';

declare global {
  interface Window {
    __babyPhotos?: {
      upload: (stageId: number, file: Blob, caption?: string) => Promise<string>;
      getAll: () => Promise<Array<{ id: string; photoUrl: string; caption?: string; uploadedAt?: any }>>;
      delete: (stageId: number) => Promise<void>;
    };
    __getFirebaseIdToken?: () => Promise<string | null>;
  }
}

export interface MilestonePhotoData {
  photoUrl: string;
  caption?: string;
}

function getCached(): Map<number, MilestonePhotoData> {
  try {
    const raw = localStorage.getItem(StorageKeys.BABY_MILESTONES_CACHE);
    if (!raw) return new Map();
    const arr: Array<[number, MilestonePhotoData]> = JSON.parse(raw);
    return new Map(arr);
  } catch {
    return new Map();
  }
}

function setCache(photos: Map<number, MilestonePhotoData>) {
  try {
    localStorage.setItem(StorageKeys.BABY_MILESTONES_CACHE, JSON.stringify([...photos]));
  } catch { /* ignore */ }
}

export function useBabyPhotos() {
  const [photos, setPhotos] = useState<Map<number, MilestonePhotoData>>(getCached);
  const [uploading, setUploading] = useState<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check auth state
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
    const interval = setInterval(checkAuth, 5000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  // Load from Firestore when authenticated
  useEffect(() => {
    if (!isAuthenticated || !window.__babyPhotos) return;
    let mounted = true;
    window.__babyPhotos.getAll().then((docs) => {
      if (!mounted) return;
      const map = new Map<number, MilestonePhotoData>();
      for (const d of docs) {
        map.set(Number(d.id), { photoUrl: d.photoUrl, caption: d.caption });
      }
      setPhotos(map);
      setCache(map);
    }).catch(() => { /* use cache */ });
    return () => { mounted = false; };
  }, [isAuthenticated]);

  // Listen for external changes
  useEffect(() => {
    const handler = () => {
      if (!window.__babyPhotos) return;
      window.__babyPhotos.getAll().then((docs) => {
        const map = new Map<number, MilestonePhotoData>();
        for (const d of docs) {
          map.set(Number(d.id), { photoUrl: d.photoUrl, caption: d.caption });
        }
        setPhotos(map);
        setCache(map);
      }).catch(() => { /* ignore */ });
    };
    window.addEventListener(WindowEvents.BABY_MILESTONES_CHANGED, handler);
    return () => window.removeEventListener(WindowEvents.BABY_MILESTONES_CHANGED, handler);
  }, []);

  const uploadPhoto = useCallback(async (stageId: number, file: File, caption?: string) => {
    if (!window.__babyPhotos) throw new Error('Baby photos API not available');
    setUploading(stageId);
    try {
      const compressed = await compressImage(file);
      const photoUrl = await window.__babyPhotos.upload(stageId, compressed, caption);
      setPhotos(prev => {
        const next = new Map(prev);
        next.set(stageId, { photoUrl, caption });
        setCache(next);
        return next;
      });
      window.dispatchEvent(new Event(WindowEvents.BABY_MILESTONES_CHANGED));
      window.__logAnalyticsEvent?.('baby_milestone_photo_upload', { stageId });
    } finally {
      setUploading(null);
    }
  }, []);

  const deletePhoto = useCallback(async (stageId: number) => {
    if (!window.__babyPhotos) throw new Error('Baby photos API not available');
    await window.__babyPhotos.delete(stageId);
    setPhotos(prev => {
      const next = new Map(prev);
      next.delete(stageId);
      setCache(next);
      return next;
    });
    window.dispatchEvent(new Event(WindowEvents.BABY_MILESTONES_CHANGED));
    window.__logAnalyticsEvent?.('baby_milestone_photo_delete', { stageId });
  }, []);

  return { photos, uploading, uploadPhoto, deletePhoto, isAuthenticated };
}
