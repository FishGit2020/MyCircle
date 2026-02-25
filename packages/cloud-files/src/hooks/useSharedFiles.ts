import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@mycircle/shared';
import { WindowEvents } from '@mycircle/shared';
import type { SharedFileItem } from '../types';

interface SharedFilesApi {
  getAllShared: () => Promise<any[]>;
  subscribeShared: (cb: (files: any[]) => void) => () => void;
  deleteShared: (fileId: string) => Promise<{ ok: boolean }>;
}

function getApi(): SharedFilesApi | null {
  return (window as any).__cloudFiles ?? null;
}

export function useSharedFiles() {
  const { t } = useTranslation();
  const [files, setFiles] = useState<SharedFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const api = getApi();
    if (!api) return;
    try {
      const data = await api.getAllShared();
      setFiles(data as SharedFileItem[]);
      setError(null);
    } catch {
      setError(t('cloudFiles.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const api = getApi();
    if (!api) {
      setLoading(false);
      return;
    }

    const unsub = api.subscribeShared((data) => {
      setFiles(data as SharedFileItem[]);
      setLoading(false);
    });

    load();

    return unsub;
  }, [load]);

  const deleteSharedFile = useCallback(async (fileId: string) => {
    const api = getApi();
    if (!api) throw new Error('Not authenticated');
    await api.deleteShared(fileId);
    window.dispatchEvent(new Event(WindowEvents.SHARED_FILES_CHANGED));
  }, []);

  return { files, loading, error, deleteSharedFile, reload: load };
}
