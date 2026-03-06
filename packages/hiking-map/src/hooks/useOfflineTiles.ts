import { useState, useRef, useCallback } from 'react';
import { downloadTiles, estimateTileCount, getTileCount } from '../services/tileCacheService';
import type { DownloadProgress } from '../services/tileCacheService';

export interface OfflineBbox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

export type DownloadState = 'idle' | 'downloading' | 'done' | 'error';

export interface UseOfflineTilesResult {
  state: DownloadState;
  progress: DownloadProgress | null;
  cachedCount: number;
  estimatedCount: number;
  startDownload: (bbox: OfflineBbox, tileUrlTemplate: string, minZoom?: number, maxZoom?: number) => void;
  cancelDownload: () => void;
  refreshCachedCount: () => Promise<void>;
}

export function useOfflineTiles(): UseOfflineTilesResult {
  const [state, setState] = useState<DownloadState>('idle');
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [cachedCount, setCachedCount] = useState(0);
  const [estimatedCount, setEstimatedCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const refreshCachedCount = useCallback(async () => {
    const count = await getTileCount();
    setCachedCount(count);
  }, []);

  const startDownload = useCallback(
    (bbox: OfflineBbox, tileUrlTemplate: string, minZoom = 10, maxZoom = 16) => {
      if (state === 'downloading') return;

      const estimated = estimateTileCount(bbox, minZoom, maxZoom);
      setEstimatedCount(estimated);
      setState('downloading');
      setProgress({ total: estimated, downloaded: 0, failed: 0 });

      abortRef.current = new AbortController();
      downloadTiles(bbox, tileUrlTemplate, minZoom, maxZoom, setProgress, abortRef.current.signal)
        .then(async (result) => {
          setProgress(result);
          await refreshCachedCount();
          setState(result.failed > 0 && result.downloaded === 0 ? 'error' : 'done');
        })
        .catch(() => setState('error'));
    },
    [state, refreshCachedCount]
  );

  const cancelDownload = useCallback(() => {
    abortRef.current?.abort();
    setState('idle');
  }, []);

  return { state, progress, cachedCount, estimatedCount, startDownload, cancelDownload, refreshCachedCount };
}
