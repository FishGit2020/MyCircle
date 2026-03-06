import { useState } from 'react';
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

function parseCoords(input: string): [number, number] | null {
  const parts = input.split(',').map(s => parseFloat(s.trim()));
  if (parts.length !== 2 || parts.some(isNaN)) return null;
  return [parts[1], parts[0]]; // [lng, lat] for MapLibre
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
}

export default function RoutePlanner({ map, routingBaseUrl }: Props) {
  const { t } = useTranslation();
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<{ distance: number; duration: number } | null>(null);

  const handlePlan = async () => {
    if (!map) return;
    const startCoords = parseCoords(start);
    const endCoords = parseCoords(end);
    if (!startCoords || !endCoords) { setError(t('hiking.routeError')); return; }
    setLoading(true);
    setError('');
    try {
      const route = await fetchOsrmRoute(routingBaseUrl, startCoords, endCoords);
      drawRoute(map, route.geometry);
      setStats({ distance: route.distance, duration: route.duration });
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
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{t('hiking.routePlanner')}</h3>
      <div className="space-y-2">
        <input
          type="text"
          value={start}
          onChange={e => setStart(e.target.value)}
          placeholder={t('hiking.startPoint')}
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
        />
        <input
          type="text"
          value={end}
          onChange={e => setEnd(e.target.value)}
          placeholder={t('hiking.endPoint')}
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
        />
        <p className="text-xs text-gray-400">{t('hiking.coordsHint')}</p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handlePlan}
          disabled={loading}
          className="flex-1 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 transition"
        >
          {loading ? t('hiking.calculating') : t('hiking.planRoute')}
        </button>
        {stats && (
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
