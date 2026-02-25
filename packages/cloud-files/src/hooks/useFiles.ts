import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@mycircle/shared';
import { WindowEvents, StorageKeys } from '@mycircle/shared';
import type { FileItem } from '../types';
import { fileToBase64 } from '../utils/fileHelpers';

interface CloudFilesApi {
  getAll: () => Promise<any[]>;
  subscribe: (cb: (files: any[]) => void) => () => void;
  upload: (fileName: string, fileBase64: string, contentType: string) => Promise<{ fileId: string; downloadUrl: string }>;
  share: (fileId: string) => Promise<{ ok: boolean }>;
  delete: (fileId: string) => Promise<{ ok: boolean }>;
}

function getApi(): CloudFilesApi | null {
  return (window as any).__cloudFiles ?? null;
}

export function useFiles() {
  const { t } = useTranslation();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const api = getApi();
    if (!api) return;
    try {
      const data = await api.getAll();
      setFiles(data as FileItem[]);
      try {
        localStorage.setItem(StorageKeys.CLOUD_FILES_CACHE, JSON.stringify(data));
      } catch { /* quota exceeded */ }
      setError(null);
    } catch {
      setError(t('cloudFiles.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    // Load cached data first
    try {
      const cached = localStorage.getItem(StorageKeys.CLOUD_FILES_CACHE);
      if (cached) {
        setFiles(JSON.parse(cached));
        setLoading(false);
      }
    } catch { /* ignore */ }

    const api = getApi();
    if (!api) {
      setLoading(false);
      return;
    }

    // Subscribe to real-time updates
    const unsub = api.subscribe((data) => {
      setFiles(data as FileItem[]);
      setLoading(false);
      try {
        localStorage.setItem(StorageKeys.CLOUD_FILES_CACHE, JSON.stringify(data));
      } catch { /* quota exceeded */ }
    });

    // Also load once
    load();

    return unsub;
  }, [load]);

  const uploadFile = useCallback(async (file: File) => {
    const api = getApi();
    if (!api) throw new Error('Not authenticated');
    const base64 = await fileToBase64(file);
    const result = await api.upload(file.name, base64, file.type);
    window.dispatchEvent(new Event(WindowEvents.CLOUD_FILES_CHANGED));
    return result;
  }, []);

  const shareFile = useCallback(async (fileId: string) => {
    const api = getApi();
    if (!api) throw new Error('Not authenticated');
    await api.share(fileId);
    window.dispatchEvent(new Event(WindowEvents.SHARED_FILES_CHANGED));
  }, []);

  const deleteFile = useCallback(async (fileId: string) => {
    const api = getApi();
    if (!api) throw new Error('Not authenticated');
    await api.delete(fileId);
    window.dispatchEvent(new Event(WindowEvents.CLOUD_FILES_CHANGED));
  }, []);

  return { files, loading, error, uploadFile, shareFile, deleteFile, reload: load };
}
