import React, { useState, useCallback, useRef } from 'react';
import { useTranslation } from '@mycircle/shared';

interface Props {
  lat: number;
  lon: number;
}

type MapLayer = 'temp' | 'precipitation' | 'clouds' | 'wind';

const layers: { id: MapLayer; labelKey: string; icon: string }[] = [
  { id: 'temp', labelKey: 'map.temperature', icon: '\u{1F321}\uFE0F' },
  { id: 'precipitation', labelKey: 'map.rain', icon: '\u{1F327}\uFE0F' },
  { id: 'clouds', labelKey: 'map.clouds', icon: '\u2601\uFE0F' },
  { id: 'wind', labelKey: 'map.wind', icon: '\u{1F32C}\uFE0F' },
];

const layerCodes: Record<MapLayer, string> = {
  temp: 'temp_new',
  precipitation: 'precipitation_new',
  clouds: 'clouds_new',
  wind: 'wind_new',
};

const MIN_ZOOM = 3;
const MAX_ZOOM = 12;

export default function WeatherMap({ lat, lon }: Props) {
  const { t } = useTranslation();
  const [activeLayer, setActiveLayer] = useState<MapLayer>('temp');
  const [zoom, setZoom] = useState(6);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const mapUrl = `https://openweathermap.org/weathermap?basemap=map&cities=true&layer=${layerCodes[activeLayer]}&lat=${lat}&lon=${lon}&zoom=${zoom}`;

  const handleZoomIn = useCallback(() => setZoom(z => Math.min(z + 1, MAX_ZOOM)), []);
  const handleZoomOut = useCallback(() => setZoom(z => Math.max(z - 1, MIN_ZOOM)), []);

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen && containerRef.current) {
      containerRef.current.requestFullscreen?.().catch(() => {
        // Fallback: just toggle the CSS-based fullscreen
      });
    } else if (document.fullscreenElement) {
      document.exitFullscreen?.();
    }
    setIsFullscreen(prev => !prev);
  }, [isFullscreen]);

  // Listen for fullscreen exit via Escape key
  React.useEffect(() => {
    function onFullscreenChange() {
      if (!document.fullscreenElement) setIsFullscreen(false);
    }
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-[100] rounded-none' : ''
      }`}
      style={isFullscreen ? { paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' } : undefined}
    >
      <div className="p-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          {t('map.title')}
        </h3>
        <div className="flex items-center gap-2">
          {/* Layer selector */}
          <div className="flex gap-1">
            {layers.map(layer => (
              <button
                key={layer.id}
                onClick={() => setActiveLayer(layer.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition flex items-center gap-1 ${
                  activeLayer === layer.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title={t(layer.labelKey as any)}
              >
                <span className="text-sm">{layer.icon}</span>
                <span className="hidden sm:inline">{t(layer.labelKey as any)}</span>
              </button>
            ))}
          </div>

          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition"
            aria-label={isFullscreen ? t('map.exitFullscreen') : t('map.fullscreen')}
          >
            {isFullscreen ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="relative" style={{ height: isFullscreen ? 'calc(100vh - 72px)' : 350 }}>
        <iframe
          src={mapUrl}
          className="w-full h-full border-0"
          title={`Weather map - ${activeLayer}`}
          loading="lazy"
          referrerPolicy="no-referrer"
        />

        {/* Location marker overlay */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-md text-xs text-gray-700 dark:text-gray-300">
          <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          {lat.toFixed(2)}, {lon.toFixed(2)}
        </div>

        {/* Zoom controls */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-1">
          <button
            onClick={handleZoomIn}
            disabled={zoom >= MAX_ZOOM}
            className="w-8 h-8 flex items-center justify-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-md text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            aria-label={t('map.zoomIn')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
            </svg>
          </button>
          <span className="w-8 h-6 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 rounded text-[10px] font-mono text-gray-500 dark:text-gray-400">
            {zoom}x
          </span>
          <button
            onClick={handleZoomOut}
            disabled={zoom <= MIN_ZOOM}
            className="w-8 h-8 flex items-center justify-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-md text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            aria-label={t('map.zoomOut')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
