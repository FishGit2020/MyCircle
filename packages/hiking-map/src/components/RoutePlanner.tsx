import { useState, useEffect } from 'react';
import { useTranslation, useUnits, formatDistance, useLazyQuery, CALC_ROUTE, CALC_ROUTE_MULTI } from '@mycircle/shared';
import type maplibregl from 'maplibre-gl';
import type { RouteResult } from '../providers/RoutingProvider';
import RouteDisplay from './RouteDisplay';

/**
 * Parse a coordinate string into [lng, lat] for MapLibre.
 * Accepts: "47.67, -122.12" or "(47.67, -122.12)" or "47.67,-122.12"
 * Input order is lat, lng (human-readable) → returns [lng, lat] (MapLibre order).
 */
function parseCoords(input: string): [number, number] | null {
  const cleaned = input.replace(/[()]/g, '').trim();
  const parts = cleaned.split(',').map(s => parseFloat(s.trim()));
  if (parts.length !== 2 || parts.some(isNaN)) return null;
  const [lat, lng] = parts;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return [lng, lat]; // [lng, lat] for MapLibre
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

interface WaypointEntry {
  value: string;
}

interface Props {
  map: maplibregl.Map | null;
  /** Pre-filled start coords from map click, format: "lat, lng" */
  externalStart?: string;
  /** Pre-filled end coords from map click, format: "lat, lng" */
  externalEnd?: string;
  /** Called when user clears the route (also clears map markers) */
  onClearWaypoints?: () => void;
  /** Called whenever the planned route changes (or clears to null). */
  onRouteChange?: (route: RouteResult | null, start: string, end: string) => void;
}

export default function RoutePlanner({ map, externalStart, externalEnd, onClearWaypoints, onRouteChange }: Props) {
  const { t } = useTranslation();
  const { distanceUnit } = useUnits();

  // Waypoints array: first = start, last = end, any in between = intermediate
  const [waypoints, setWaypoints] = useState<WaypointEntry[]>([{ value: '' }, { value: '' }]);
  const [error, setError] = useState('');
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [locating, setLocating] = useState(false);

  const [fetchRoute] = useLazyQuery(CALC_ROUTE);
  const [fetchRouteMulti, { loading }] = useLazyQuery(CALC_ROUTE_MULTI);

  // Sync external (map-click) coords into first/last waypoint inputs
  useEffect(() => {
    if (externalStart !== undefined) {
      setWaypoints(prev => prev.map((wp, i) => i === 0 ? { value: externalStart } : wp));
    }
  }, [externalStart]);

  useEffect(() => {
    if (externalEnd !== undefined) {
      setWaypoints(prev => prev.map((wp, i) => i === prev.length - 1 ? { value: externalEnd } : wp));
    }
  }, [externalEnd]);

  const start = waypoints[0]?.value ?? '';
  const end = waypoints[waypoints.length - 1]?.value ?? '';

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) { setError(t('hiking.locationUnavailable')); return; }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const str = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
        setWaypoints(prev => prev.map((wp, i) => i === 0 ? { value: str } : wp));
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) setError(t('hiking.locationDenied'));
        else if (err.code === 2) setError(t('hiking.locationUnavailable'));
        else setError(t('hiking.locationTimeout'));
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const addWaypoint = () => {
    // Insert new empty waypoint before the last (end) entry
    setWaypoints(prev => [
      ...prev.slice(0, -1),
      { value: '' },
      prev[prev.length - 1],
    ]);
  };

  const removeWaypoint = (index: number) => {
    if (waypoints.length <= 2) return;
    setWaypoints(prev => prev.filter((_, i) => i !== index));
  };

  const moveWaypoint = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= waypoints.length) return;
    setWaypoints(prev => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const updateWaypoint = (index: number, value: string) => {
    setWaypoints(prev => prev.map((wp, i) => i === index ? { value } : wp));
  };

  const handlePlan = async () => {
    if (!map) return;
    const parsed = waypoints.map(wp => parseCoords(wp.value));
    if (parsed.some(p => p === null)) {
      setError(t('hiking.coordsError'));
      return;
    }
    setError('');

    try {
      let raw: { coordinates: [number, number][]; distance: number; duration: number } | null = null;

      if (waypoints.length === 2) {
        const [s, e] = parsed as [number, number][];
        const { data } = await fetchRoute({
          variables: { startLon: s[0], startLat: s[1], endLon: e[0], endLat: e[1] },
        });
        raw = data?.calcRoute ?? null;
      } else {
        const wpVars = (parsed as [number, number][]).map(([lon, lat]) => ({ lon, lat }));
        const { data } = await fetchRouteMulti({ variables: { waypoints: wpVars } });
        raw = data?.calcRouteMulti ?? null;
      }

      if (!raw) { setError(t('hiking.routeError')); return; }

      const result: RouteResult = {
        geometry: { type: 'LineString', coordinates: raw.coordinates },
        distance: raw.distance,
        duration: raw.duration,
        waypoints: (parsed as [number, number][]).map(([lng, lat], i) => ({
          lat, lng, label: waypoints[i].value,
        })),
      };
      setRoute(result);
      onRouteChange?.(result, start, end);

      // Fit map to route bounds
      const coords = result.geometry.coordinates as [number, number][];
      if (coords.length > 1) {
        const mgl = (window as any).maplibregl; // eslint-disable-line @typescript-eslint/no-explicit-any
        if (mgl?.LngLatBounds) {
          const bounds = coords.reduce(
            (b: any, c: [number, number]) => b.extend(c), // eslint-disable-line @typescript-eslint/no-explicit-any
            new mgl.LngLatBounds(coords[0], coords[0])
          );
          if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 60, maxZoom: 16 });
        }
      }
    } catch {
      setError(t('hiking.routeError'));
    }
  };

  const handleClear = () => {
    setRoute(null);
    setError('');
    setWaypoints([{ value: '' }, { value: '' }]);
    onClearWaypoints?.();
    onRouteChange?.(null, '', '');
  };

  const canPlan = !loading && waypoints.every(wp => wp.value.trim() !== '');

  return (
    <>
      {/* Route line drawn on the map */}
      <RouteDisplay map={map} geometry={route?.geometry ?? null} />

      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{t('hiking.routePlanner')}</h3>

        <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
          {t('hiking.tapToSetRoute')}
        </p>

        <div className="space-y-2">
          {waypoints.map((wp, i) => {
            const isStart = i === 0;
            const isEnd = i === waypoints.length - 1;
            const isIntermediate = !isStart && !isEnd;
            const dotColor = isStart ? 'bg-green-500' : isEnd ? 'bg-red-500' : 'bg-yellow-500';
            const placeholder = isStart
              ? t('hiking.startPoint')
              : isEnd
              ? t('hiking.endPoint')
              : `${t('hiking.waypoint')} ${i}`;

            return (
              <div key={i} className="flex items-center gap-1">
                <div className="relative flex-1">
                  <div className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full ${dotColor} pointer-events-none`} />
                  <input
                    type="text"
                    value={wp.value}
                    onChange={e => updateWaypoint(i, e.target.value)}
                    placeholder={placeholder}
                    className={`w-full pl-7 ${isStart ? 'pr-8' : 'pr-3'} py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400`}
                  />
                  {isStart && (
                    <button
                      type="button"
                      onClick={handleUseMyLocation}
                      disabled={locating}
                      title={t('hiking.useMyLocation')}
                      aria-label={t('hiking.useMyLocation')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-700 disabled:opacity-50 transition"
                    >
                      {locating ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>

                {/* Move up/down + remove for intermediate waypoints */}
                {isIntermediate && (
                  <div className="flex flex-col gap-0.5">
                    <button type="button" onClick={() => moveWaypoint(i, 'up')}
                      aria-label={t('hiking.moveWaypointUp')} title={t('hiking.moveWaypointUp')}
                      className="p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button type="button" onClick={() => moveWaypoint(i, 'down')}
                      aria-label={t('hiking.moveWaypointDown')} title={t('hiking.moveWaypointDown')}
                      className="p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                )}
                {isIntermediate && (
                  <button type="button" onClick={() => removeWaypoint(i)}
                    aria-label={t('hiking.removeWaypoint')} title={t('hiking.removeWaypoint')}
                    className="p-1 rounded text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}

          <p className="text-xs text-gray-400">{t('hiking.coordsHint')}</p>
        </div>

        {/* Add Waypoint button */}
        <button
          type="button"
          onClick={addWaypoint}
          className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {t('hiking.addWaypoint')}
        </button>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handlePlan}
            disabled={!canPlan}
            className="flex-1 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 transition"
          >
            {loading ? t('hiking.planning') : t('hiking.planRoute')}
          </button>
          {(route || waypoints.some(wp => wp.value)) && (
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

        {route && (
          <div className="flex gap-3">
            <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('hiking.distance')}</p>
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{formatDistance(route.distance, distanceUnit)}</p>
            </div>
            <div className="flex-1 bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('hiking.duration')}</p>
              <p className="text-sm font-semibold text-green-700 dark:text-green-300">{formatDuration(route.duration)}</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
