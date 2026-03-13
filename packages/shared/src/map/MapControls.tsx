import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../i18n';
import type maplibregl from 'maplibre-gl';

export interface MapControlsProps {
  map: maplibregl.Map | null;
  showFullscreen?: boolean;
  showGpsLocate?: boolean;
  showScale?: boolean;
  showStyleSwitcher?: boolean;
  onStyleChange?: (style: 'street' | 'topo') => void;
  /** Called with [lng, lat] when GPS locate succeeds. */
  onLocate?: (lngLat: [number, number]) => void;
  className?: string;
}

type GpsState = 'idle' | 'locating' | 'error';

/**
 * Shared map controls overlay.
 * Renders React buttons positioned absolutely over a map container.
 *
 * Layout:
 * - Top-right: Zoom (+/-), Fullscreen, GPS Locate (stacked)
 * - Bottom-left: Scale bar (via MapLibre ScaleControl)
 * - Top-left: Style switcher (Street/Topo) when showStyleSwitcher=true
 */
export default function MapControls({
  map,
  showFullscreen = true,
  showGpsLocate = true,
  showScale = true,
  showStyleSwitcher = false,
  onStyleChange,
  onLocate,
  className = '',
}: MapControlsProps) {
  const { t } = useTranslation();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [gpsState, setGpsState] = useState<GpsState>('idle');
  const [activeStyle, setActiveStyle] = useState<'street' | 'topo'>('street');

  // Add MapLibre ScaleControl once
  useEffect(() => {
    if (!map || !showScale) return;
    let ctrl: maplibregl.ScaleControl | undefined;
    import('maplibre-gl').then(({ default: ml }) => {
      try {
        ctrl = new ml.ScaleControl({ maxWidth: 150 });
        map.addControl(ctrl, 'bottom-left');
      } catch {
        // Map may have been destroyed
      }
    });
    return () => {
      if (ctrl) {
        try { map.removeControl(ctrl); } catch { /* destroyed */ }
      }
    };
  }, [map, showScale]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const handleZoomIn = useCallback(() => {
    try { map?.zoomIn(); } catch { /* destroyed */ }
  }, [map]);

  const handleZoomOut = useCallback(() => {
    try { map?.zoomOut(); } catch { /* destroyed */ }
  }, [map]);

  const handleFullscreen = useCallback(() => {
    if (!map) return;
    try {
      const container = map.getContainer();
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        container.requestFullscreen();
      }
    } catch {
      // Fullscreen not supported
    }
  }, [map]);

  const handleLocate = useCallback(() => {
    if (!map || !navigator.geolocation) return;
    setGpsState('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lngLat: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        try { map.flyTo({ center: lngLat, zoom: 14 }); } catch { /* destroyed */ }
        onLocate?.(lngLat);
        setGpsState('idle');
      },
      () => setGpsState('error'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [map, onLocate]);

  const handleStyleToggle = useCallback(() => {
    const next = activeStyle === 'street' ? 'topo' : 'street';
    setActiveStyle(next);
    onStyleChange?.(next);
  }, [activeStyle, onStyleChange]);

  // Shared button base classes (44px touch target via p-2 on 32px icon area)
  const btnBase =
    'flex items-center justify-center w-9 h-9 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 ' +
    'hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition select-none ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';

  return (
    <div className={className}>
      {/* === Top-right: Zoom + Fullscreen + GPS === */}
      <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2">
        {/* Zoom group */}
        <div className="flex flex-col rounded-lg overflow-hidden shadow-lg border border-gray-200 dark:border-gray-600">
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={!map}
            aria-label={t('map.zoomIn')}
            className={`${btnBase} border-b border-gray-200 dark:border-gray-600 rounded-none text-lg font-light`}
          >
            {/* Plus icon */}
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M8 2v12M2 8h12" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={!map}
            aria-label={t('map.zoomOut')}
            className={`${btnBase} rounded-none text-lg font-light`}
          >
            {/* Minus icon */}
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M2 8h12" />
            </svg>
          </button>
        </div>

        {/* Fullscreen */}
        {showFullscreen && (
          <button
            type="button"
            onClick={handleFullscreen}
            disabled={!map}
            aria-label={isFullscreen ? t('map.exitFullscreen') : t('map.fullscreen')}
            className={`${btnBase} rounded-lg shadow-lg border border-gray-200 dark:border-gray-600`}
          >
            {isFullscreen ? (
              /* Exit fullscreen (compress) icon */
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M6 2v4H2M10 2v4h4M6 14v-4H2M10 14v-4h4" />
              </svg>
            ) : (
              /* Fullscreen (expand) icon */
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" />
              </svg>
            )}
          </button>
        )}

        {/* GPS Locate */}
        {showGpsLocate && (
          <button
            type="button"
            onClick={handleLocate}
            disabled={!map || gpsState === 'locating'}
            aria-label={t('map.myLocation')}
            className={`${btnBase} rounded-lg shadow-lg border ${
              gpsState === 'error'
                ? 'border-red-400 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                : 'border-gray-200 dark:border-gray-600'
            }`}
          >
            {gpsState === 'locating' ? (
              /* Spinner */
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="8" cy="8" r="6" strokeOpacity="0.3" />
                <path d="M14 8a6 6 0 00-6-6" />
              </svg>
            ) : (
              /* Crosshair icon */
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <circle cx="8" cy="8" r="3" />
                <path d="M8 1v3M8 12v3M1 8h3M12 8h3" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* === Top-left: Style switcher === */}
      {showStyleSwitcher && (
        <div className="absolute top-3 left-3 z-10">
          <button
            type="button"
            onClick={handleStyleToggle}
            disabled={!map}
            aria-label={activeStyle === 'street' ? t('map.topoView') : t('map.streetView')}
            className={`${btnBase} rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 gap-1.5 w-auto px-2.5`}
          >
            {/* Layers icon */}
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M8 1L1 5.5l7 4.5 7-4.5L8 1z" />
              <path d="M1 8l7 4.5L15 8" />
              <path d="M1 10.5l7 4.5 7-4.5" />
            </svg>
            <span className="text-xs font-medium">
              {activeStyle === 'street' ? t('map.streetView') : t('map.topoView')}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
