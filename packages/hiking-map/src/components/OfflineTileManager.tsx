import { useState, useEffect } from 'react';
import { useTranslation } from '@mycircle/shared';
import type maplibregl from 'maplibre-gl';
import { useOfflineTiles } from '../hooks/useOfflineTiles';
import { clearAllTiles } from '../services/tileCacheService';
import { MAP_CONFIG } from '../config/mapConfig';

interface Props {
  map: maplibregl.Map | null;
}

/** Extracts a raster tile URL template from the active topo style, if present. */
function getRasterTileUrl(): string | null {
  const topo = MAP_CONFIG.tileProviders.find(p => p.id === 'topo');
  if (!topo || typeof topo.style !== 'object') return null;
  const sources = (topo.style as any).sources;
  if (!sources) return null;
  for (const src of Object.values(sources)) {
    const tiles = (src as any).tiles;
    if (Array.isArray(tiles) && tiles.length > 0) return tiles[0];
  }
  return null;
}

export default function OfflineTileManager({ map }: Props) {
  const { t } = useTranslation();
  const { state, progress, cachedCount, startDownload, cancelDownload, refreshCachedCount } = useOfflineTiles();
  const [isExpanded, setIsExpanded] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    refreshCachedCount();
  }, [refreshCachedCount]);

  const handleDownloadViewport = () => {
    if (!map) return;
    const bounds = map.getBounds();
    const tileUrl = getRasterTileUrl();
    if (!tileUrl) return;
    startDownload(
      {
        minLng: bounds.getWest(),
        minLat: bounds.getSouth(),
        maxLng: bounds.getEast(),
        maxLat: bounds.getNorth(),
      },
      tileUrl,
      10, 16
    );
  };

  const handleClearCache = async () => {
    setClearing(true);
    await clearAllTiles();
    await refreshCachedCount();
    setClearing(false);
  };

  const percent = progress && progress.total > 0
    ? Math.round(((progress.downloaded + progress.failed) / progress.total) * 100)
    : 0;

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
      <button
        type="button"
        onClick={() => setIsExpanded(v => !v)}
        className="flex items-center justify-between w-full text-sm font-semibold text-gray-900 dark:text-white"
      >
        <span>{t('hiking.offlineTitle')}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-2">
          <p className="text-xs text-gray-400 dark:text-gray-500">{t('hiking.offlineHint')}</p>

          {cachedCount > 0 && (
            <p className="text-xs text-green-600 dark:text-green-400">
              {t('hiking.cachedTiles', { count: cachedCount })}
            </p>
          )}

          {state === 'downloading' && progress && (
            <div className="space-y-1">
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {progress.downloaded} / {progress.total} {t('hiking.tilesDownloaded')}
              </p>
              <button
                type="button"
                onClick={cancelDownload}
                className="text-xs text-red-500 hover:text-red-700"
              >
                {t('hiking.cancelDownload')}
              </button>
            </div>
          )}

          {state === 'done' && (
            <p className="text-xs text-green-600 dark:text-green-400">{t('hiking.downloadComplete')}</p>
          )}

          {state === 'error' && (
            <p className="text-xs text-red-500">{t('hiking.downloadError')}</p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDownloadViewport}
              disabled={!map || state === 'downloading' || !getRasterTileUrl()}
              className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 transition"
            >
              {t('hiking.downloadViewport')}
            </button>
            {cachedCount > 0 && (
              <button
                type="button"
                onClick={handleClearCache}
                disabled={clearing}
                className="px-2 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-60 transition"
              >
                {t('hiking.clearCache')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
