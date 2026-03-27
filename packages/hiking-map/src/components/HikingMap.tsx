import { useState, useEffect, useCallback } from 'react';
import { useTranslation, useUnits, PageContent, setCircleLayer, removeSourceAndLayers, MapControls, formatDistance } from '@mycircle/shared';
import type maplibregl from 'maplibre-gl';
import MapView from './MapView';
import RoutePlanner from './RoutePlanner';
import SavedRoutes from './SavedRoutes';
import OfflineTileManager from './OfflineTileManager';
import RouteDisplay from './RouteDisplay';
import TileCacheOverlay from './TileCacheOverlay';
import GpxImportButton from './GpxImportButton';
import ElevationProfile from './ElevationProfile';
import type { RouteResult } from '../providers/RoutingProvider';
import type { SavedRoute, PublicRoute } from '../services/routeStorageService';
import { gpxTrackToSavedRoute } from '../services/gpxService';
import type { GpxTrack } from '../services/gpxService';
import { MAP_CONFIG } from '../config/mapConfig';

/** Format [lng, lat] as "lat, lng" string for route planner inputs. */
function lngLatToString([lng, lat]: [number, number]) {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

/** Draw or update a single waypoint circle on the map using shared utility. */
function setPointLayer(
  map: maplibregl.Map,
  sourceId: string,
  layerId: string,
  coords: [number, number] | null,
  color: string
) {
  if (!coords) {
    removeSourceAndLayers(map, sourceId, [layerId]);
    return;
  }
  setCircleLayer(map, sourceId, layerId,
    [{ lon: coords[0], lat: coords[1] }],
    { radius: 9, color, strokeWidth: 2.5, strokeColor: '#ffffff' },
  );
}

export default function HikingMap() {
  const { t } = useTranslation();
  const { distanceUnit } = useUnits();
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [mapStyle, setMapStyle] = useState<string | Record<string, unknown>>(MAP_CONFIG.tileProviders[0].style);
  // Incremented on every style.load so circle-layer effects re-run after style switch
  const [styleVersion, setStyleVersion] = useState(0);

  // Waypoints set by clicking the map
  const [startCoords, setStartCoords] = useState<[number, number] | null>(null);
  const [endCoords, setEndCoords] = useState<[number, number] | null>(null);

  // My location dot (shown after GPS locate)
  const [myLocation, setMyLocation] = useState<[number, number] | null>(null);

  // Current planned route (shared between RoutePlanner, SavedRoutes)
  const [currentRoute, setCurrentRoute] = useState<RouteResult | null>(null);
  const [currentStartLabel, setCurrentStartLabel] = useState('');
  const [currentEndLabel, setCurrentEndLabel] = useState('');
  // Route loaded from saved routes (bypasses RoutePlanner line)
  const [loadedRouteGeometry, setLoadedRouteGeometry] = useState<GeoJSON.Geometry | null>(null);

  // Tile cache overlay toggle + version (bumped after download to refresh overlay)
  const [showCacheOverlay, setShowCacheOverlay] = useState(false);
  const [cacheVersion, setCacheVersion] = useState(0);

  // GPX import state
  const [gpxImportedRoute, setGpxImportedRoute] = useState<ReturnType<typeof gpxTrackToSavedRoute> | null>(null);
  const [showElevation, setShowElevation] = useState(false);

  // Auto-locate user when map first loads
  useEffect(() => {
    if (!map || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lngLat: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        map.flyTo({ center: lngLat, zoom: 13, duration: 1500 });
        setMyLocation(lngLat);
      },
      () => {}, // silent — keep default center if denied
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, [map]);

  // Draw start waypoint circle on GL canvas (re-runs after style change)
  useEffect(() => {
    if (!map) return;
    setPointLayer(map, 'wp-start', 'wp-start-circle', startCoords, '#22c55e');
  }, [map, startCoords, styleVersion]);

  // Draw end waypoint circle on GL canvas (re-runs after style change)
  useEffect(() => {
    if (!map) return;
    setPointLayer(map, 'wp-end', 'wp-end-circle', endCoords, '#ef4444');
  }, [map, endCoords, styleVersion]);

  // Draw "my location" blue dot (re-runs after style change)
  useEffect(() => {
    if (!map) return;
    setPointLayer(map, 'my-loc', 'my-loc-circle', myLocation, '#3b82f6');
  }, [map, myLocation, styleVersion]);

  const handleStyleLoad = useCallback(() => {
    setStyleVersion((v) => v + 1);
  }, []);

  const handleStyleChange = useCallback((style: 'street' | 'topo') => {
    const provider = MAP_CONFIG.tileProviders.find((p) => p.id === style);
    if (provider) {
      setMapStyle(provider.style);
    }
  }, []);

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

  const handleLocate = useCallback((lngLat: [number, number]) => {
    setMyLocation(lngLat);
  }, []);

  const handleRouteChange = useCallback((route: RouteResult | null, start: string, end: string) => {
    setCurrentRoute(route);
    setCurrentStartLabel(start);
    setCurrentEndLabel(end);
    setLoadedRouteGeometry(null);
  }, []);

  const handleLoadSavedRoute = useCallback((saved: SavedRoute | PublicRoute) => {
    setLoadedRouteGeometry(saved.geometry);
    setCurrentRoute({ geometry: saved.geometry, distance: saved.distance, duration: saved.duration });
    // Fit the map viewport to the loaded route
    if (map && saved.geometry.type === 'LineString') {
      const coords = (saved.geometry as GeoJSON.LineString).coordinates as [number, number][];
      if (coords.length >= 2) {
        const lngs = coords.map(([lng]) => lng);
        const lats = coords.map(([, lat]) => lat);
        map.fitBounds(
          [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
          { padding: 60, maxZoom: 15, duration: 800 }
        );
      }
    }
  }, [map]);

  const handleGpxImport = useCallback((track: GpxTrack) => {
    const partial = gpxTrackToSavedRoute(track, track.name);
    setGpxImportedRoute(partial);
    setShowElevation(false);
    // Set current route so SavedRoutes "Save Current Route" button appears
    setCurrentRoute({
      geometry: partial.geometry,
      distance: partial.distance,
      duration: 0,
      elevationProfile: partial.elevationProfile,
      sourceFormat: 'gpx-import',
    });
    setCurrentStartLabel(track.name);
    setCurrentEndLabel('');
    setLoadedRouteGeometry(null);
    // Fly map to track bounds
    if (map) {
      const { minLat, maxLat, minLng, maxLng } = track.bounds;
      map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 60, maxZoom: 15, duration: 800 });
    }
  }, [map]);

  const handleSaveMap = () => {
    if (!map) return;
    // triggerRepaint forces a WebGL frame; capture after idle to ensure buffer is populated
    map.once('idle', () => {
      const canvas = map.getCanvas();
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = 'hiking-map.png';
      link.click();
    });
    map.triggerRepaint();
  };

  return (
    <PageContent fill>
      <div className="mb-3 flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('hiking.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('hiking.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <GpxImportButton onImport={handleGpxImport} />
          <button
            type="button"
            onClick={handleSaveMap}
            disabled={!map}
            aria-label={t('hiking.saveMap')}
            title={t('hiking.saveMap')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 transition min-h-[44px]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {t('hiking.saveMap')}
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:flex-1 md:min-h-0">
        {/* Map — relative container with absolute MapView so the map fills exactly the flex space */}
        <div className="relative h-[55vh] md:h-auto md:flex-1 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="absolute inset-0">
            <MapView style={mapStyle} onMapReady={setMap} onMapClick={handleMapClick} onStyleLoad={handleStyleLoad} />
          </div>

          {/* Tap-to-set hint when no waypoints set */}
          {map && !startCoords && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
              <div className="bg-black/50 text-white text-xs rounded-full px-3 py-1 whitespace-nowrap">
                {t('hiking.tapToSetRoute')}
              </div>
            </div>
          )}

          {/* Shared map controls */}
          <MapControls
            map={map}
            showStyleSwitcher
            onStyleChange={handleStyleChange}
            onLocate={handleLocate}
          />

          {/* Waypoint badge — shows tap state */}
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

        {/* Tile cache overlay */}
        <TileCacheOverlay map={map} visible={showCacheOverlay} cacheVersion={cacheVersion} />

        {/* Sidebar */}
        <div className="md:w-72 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
          {/* Loaded saved route overlay */}
          {loadedRouteGeometry && <RouteDisplay map={map} geometry={loadedRouteGeometry} />}
          {/* GPX imported route overlay */}
          {gpxImportedRoute && <RouteDisplay map={map} geometry={gpxImportedRoute.geometry} />}

          <RoutePlanner
            map={map}
            externalStart={startCoords ? lngLatToString(startCoords) : undefined}
            externalEnd={endCoords ? lngLatToString(endCoords) : undefined}
            onClearWaypoints={handleClearWaypoints}
            onRouteChange={handleRouteChange}
          />

          {/* Elevation profile toggle + panel */}
          {currentRoute?.elevationProfile && (() => {
            const profile = currentRoute.elevationProfile;
            if (!profile) return null;
            const gains = profile.reduce((acc, p, i) => {
              if (i === 0) return acc;
              const diff = p.elevationM - profile[i - 1].elevationM;
              return { gain: acc.gain + Math.max(0, diff), loss: acc.loss + Math.max(0, -diff) };
            }, { gain: 0, loss: 0 });
            return (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowElevation(v => !v)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white w-full"
                >
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l5-8 4 5 3-4 5 7H3z" />
                  </svg>
                  {t('hiking.elevationProfile')}
                  <svg className={`w-4 h-4 ml-auto text-gray-400 transition-transform ${showElevation ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showElevation && (
                  <ElevationProfile
                    profile={profile}
                    totalGainM={gains.gain}
                    totalLossM={gains.loss}
                    distanceLabel={formatDistance(profile[profile.length - 1]?.distanceM ?? 0, distanceUnit)}
                  />
                )}
              </div>
            );
          })()}

          <SavedRoutes
            currentRoute={currentRoute}
            currentStart={currentStartLabel}
            currentEnd={currentEndLabel}
            onLoadRoute={handleLoadSavedRoute}
          />

          <OfflineTileManager
            map={map}
            showCacheOverlay={showCacheOverlay}
            onToggleCacheOverlay={() => setShowCacheOverlay(v => !v)}
            onCacheChanged={() => setCacheVersion(v => v + 1)}
          />
        </div>
      </div>
    </PageContent>
  );
}
