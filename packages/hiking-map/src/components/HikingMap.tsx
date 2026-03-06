import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation, PageContent } from '@mycircle/shared';
import type maplibregl from 'maplibre-gl';
import MapView from './MapView';
import GpsLocateButton from './GpsLocateButton';
import MapStyleSwitcher from './MapStyleSwitcher';
import RoutePlanner from './RoutePlanner';
import ZoomControls from './ZoomControls';
import { MAP_CONFIG } from '../config/mapConfig';

/** Format [lng, lat] as "lat, lng" string for route planner inputs. */
function lngLatToString([lng, lat]: [number, number]) {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

export default function HikingMap() {
  const { t } = useTranslation();
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [styleId, setStyleId] = useState(MAP_CONFIG.tileProviders[0].id);
  const [mapStyle, setMapStyle] = useState<string | Record<string, unknown>>(MAP_CONFIG.tileProviders[0].style);

  // Waypoints set by clicking the map
  const [startCoords, setStartCoords] = useState<[number, number] | null>(null);
  const [endCoords, setEndCoords] = useState<[number, number] | null>(null);
  const startMarkerRef = useRef<maplibregl.Marker | null>(null);
  const endMarkerRef = useRef<maplibregl.Marker | null>(null);

  // Auto-locate user when map first loads
  useEffect(() => {
    if (!map || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 13, duration: 1500 });
      },
      () => {}, // silent — keep default center if denied
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, [map]);

  // Sync start marker on map
  useEffect(() => {
    if (!map) return;
    startMarkerRef.current?.remove();
    startMarkerRef.current = null;
    if (!startCoords) return;
    import('maplibre-gl').then(({ default: mgl }) => {
      startMarkerRef.current = new mgl.Marker({ color: '#22c55e' })
        .setLngLat(startCoords)
        .addTo(map);
    });
  }, [map, startCoords]);

  // Sync end marker on map
  useEffect(() => {
    if (!map) return;
    endMarkerRef.current?.remove();
    endMarkerRef.current = null;
    if (!endCoords) return;
    import('maplibre-gl').then(({ default: mgl }) => {
      endMarkerRef.current = new mgl.Marker({ color: '#ef4444' })
        .setLngLat(endCoords)
        .addTo(map);
    });
  }, [map, endCoords]);

  const handleStyleChange = (id: string, style: string | Record<string, unknown>) => {
    setStyleId(id);
    setMapStyle(style);
  };

  // Map click: 1st tap = start, 2nd tap = end, 3rd tap = reset start
  const handleMapClick = useCallback((lngLat: [number, number]) => {
    if (!startCoords) {
      setStartCoords(lngLat);
    } else if (!endCoords) {
      setEndCoords(lngLat);
    } else {
      setEndCoords(null);
      setStartCoords(lngLat);
    }
  }, [startCoords, endCoords]);

  const handleClearWaypoints = () => {
    setStartCoords(null);
    setEndCoords(null);
  };

  const handleSaveMap = () => {
    if (!map) return;
    const canvas = map.getCanvas();
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'hiking-map.png';
    link.click();
  };

  return (
    <PageContent>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('hiking.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('hiking.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={handleSaveMap}
          disabled={!map}
          aria-label={t('hiking.saveMap')}
          title={t('hiking.saveMap')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {t('hiking.saveMap')}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-13rem)]">
        {/* Map */}
        <div className="relative flex-1 min-h-[55vh] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <MapView style={mapStyle} onMapReady={setMap} onMapClick={handleMapClick} />

          {/* Tap-to-set hint when no waypoints set */}
          {map && !startCoords && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
              <div className="bg-black/50 text-white text-xs rounded-full px-3 py-1 whitespace-nowrap">
                {t('hiking.tapToSetRoute')}
              </div>
            </div>
          )}

          {/* Zoom controls — right side */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
            <ZoomControls map={map} />
          </div>

          {/* GPS button — bottom right */}
          <div className="absolute bottom-4 right-4 z-10">
            <GpsLocateButton map={map} />
          </div>

          {/* Style switcher — top left */}
          <div className="absolute top-4 left-4 z-10">
            <MapStyleSwitcher
              providers={MAP_CONFIG.tileProviders}
              activeId={styleId}
              onChange={handleStyleChange}
            />
          </div>

          {/* Waypoint badge — top right when waypoints are active */}
          {startCoords && (
            <div className="absolute top-4 right-16 z-10 flex items-center gap-1 bg-white dark:bg-gray-800 rounded-full px-3 py-1 shadow text-xs font-medium text-gray-700 dark:text-gray-300">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              {endCoords ? (
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block ml-1" />
              ) : (
                <span className="text-gray-400">{t('hiking.tapForEnd')}</span>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="md:w-72 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
          <RoutePlanner
            map={map}
            routingConfig={MAP_CONFIG.routing}
            externalStart={startCoords ? lngLatToString(startCoords) : undefined}
            externalEnd={endCoords ? lngLatToString(endCoords) : undefined}
            onClearWaypoints={handleClearWaypoints}
          />
        </div>
      </div>
    </PageContent>
  );
}
