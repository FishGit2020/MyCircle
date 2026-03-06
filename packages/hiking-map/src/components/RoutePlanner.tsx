import { useState, useEffect } from 'react';
import { useTranslation } from '@mycircle/shared';
import type maplibregl from 'maplibre-gl';

const ROUTE_SOURCE = 'hiking-route';
const ROUTE_LAYER = 'hiking-route-line';

async function fetchOsrmRoute(baseUrl: string, start: [number, number], end: [number, number]) {
  const url = `${baseUrl}/route/v1/foot/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Route fetch failed');
  const data = await res.json();
  if (!data.routes?.[0]) throw new Error('No route found');
  return data.routes[0];
}

function drawRoute(map: maplibregl.Map, geometry: GeoJSON.Geometry) {
  if (map.getLayer(ROUTE_LAYER)) map.removeLayer(ROUTE_LAYER);
  if (map.getSource(ROUTE_SOURCE)) map.removeSource(ROUTE_SOURCE);
  map.addSource(ROUTE_SOURCE, { type: 'geojson', data: { type: 'Feature', properties: {}, geometry } });
  map.addLayer({
    id: ROUTE_LAYER,
    type: 'line',
    source: ROUTE_SOURCE,
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#3b82f6', 'line-width': 4 },
  });
}

function clearRoute(map: maplibregl.Map) {
  if (map.getLayer(ROUTE_LAYER)) map.removeLayer(ROUTE_LAYER);
  if (map.getSource(ROUTE_SOURCE)) map.removeSource(ROUTE_SOURCE);
}

/**
 * Parse a coordinate string into [lng, lat] for MapLibre.
 * Accepts: "47.67, -122.12" or "(47.67, -122.12)" or "47.67,-122.12"
 * Input order is lat, lng (human-readable) → returns [lng, lat] (MapLibre order).
 */
function parseCoords(input: string): [number, number] | null {
  // Strip optional parentheses and extra whitespace
  const cleaned = input.replace(/[()]/g, '').trim();
  const parts = cleaned.split(',').map(s => parseFloat(s.trim()));
  if (parts.length !== 2 || parts.some(isNaN)) return null;
  const [lat, lng] = parts;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return [lng, lat]; // [lng, lat] for MapLibre
}

function formatDistance(meters: number) {
  return meters >= 1000
    ? `${(meters / 1000).toFixed(1)} km`
    : `${Math.round(meters)} m`;
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

interface Props {
  map: maplibregl.Map | null;
  routingBaseUrl: string;
  /** Pre-filled start coords from map click, format: "lat, lng" */
  externalStart?: string;
  /** Pre-filled end coords from map click, format: "lat, lng" */
  externalEnd?: string;
  /** Called when user clears the route (also clears map markers) */
  onClearWaypoints?: () => void;
}

export default function RoutePlanner({ map, routingBaseUrl, externalStart, externalEnd, onClearWaypoints }: Props) {
  const { t } = useTranslation();
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<{ distance: number; duration: number } | null>(null);

  // Sync external (map-click) coords into text inputs
  useEffect(() => {
    if (externalStart !== undefined) setStart(externalStart);
  }, [externalStart]);

  useEffect(() => {
    if (externalEnd !== undefined) setEnd(externalEnd);
  }, [externalEnd]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const str = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
        setStart(str);
      },
      () => setError(t('hiking.locationError')),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handlePlan = async () => {
    if (!map) return;
    const startCoords = parseCoords(start);
    const endCoords = parseCoords(end);
    if (!startCoords || !endCoords) {
      setError(t('hiking.coordsError'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const route = await fetchOsrmRoute(routingBaseUrl, startCoords, endCoords);
      drawRoute(map, route.geometry);
      setStats({ distance: route.distance, duration: route.duration });
      // Fit map to route bounds
      const coords = (route.geometry as GeoJSON.LineString).coordinates as [number, number][];
      if (coords.length > 1) {
        const mgl = (window as any).maplibregl;
        if (mgl?.LngLatBounds) {
          const bounds = coords.reduce(
            (b: any, c: [number, number]) => b.extend(c),
            new mgl.LngLatBounds(coords[0], coords[0])
          );
          if (!bounds.isEmpty()) {
            map.fitBounds(bounds, { padding: 60, maxZoom: 16 });
          }
        }
      }
    } catch {
      setError(t('hiking.routeError'));
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    if (map) clearRoute(map);
    setStats(null);
    setError('');
    setStart('');
    setEnd('');
    onClearWaypoints?.();
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{t('hiking.routePlanner')}</h3>

      {/* Instruction */}
      <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
        {t('hiking.tapToSetRoute')}
      </p>

      <div className="space-y-2">
        {/* Start point */}
        <div className="relative">
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-green-500 pointer-events-none" />
          <input
            type="text"
            value={start}
            onChange={e => setStart(e.target.value)}
            placeholder={t('hiking.startPoint')}
            className="w-full pl-7 pr-8 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
          />
          <button
            type="button"
            onClick={handleUseMyLocation}
            title={t('hiking.useMyLocation')}
            aria-label={t('hiking.useMyLocation')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-700 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
            </svg>
          </button>
        </div>

        {/* End point */}
        <div className="relative">
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-red-500 pointer-events-none" />
          <input
            type="text"
            value={end}
            onChange={e => setEnd(e.target.value)}
            placeholder={t('hiking.endPoint')}
            className="w-full pl-7 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
          />
        </div>

        <p className="text-xs text-gray-400">{t('hiking.coordsHint')}</p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handlePlan}
          disabled={loading || !start || !end}
          className="flex-1 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 transition"
        >
          {loading ? t('hiking.planning') : t('hiking.planRoute')}
        </button>
        {(stats || start || end) && (
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            {t('hiking.clearRoute')}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {stats && (
        <div className="flex gap-3">
          <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('hiking.distance')}</p>
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{formatDistance(stats.distance)}</p>
          </div>
          <div className="flex-1 bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('hiking.duration')}</p>
            <p className="text-sm font-semibold text-green-700 dark:text-green-300">{formatDuration(stats.duration)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
