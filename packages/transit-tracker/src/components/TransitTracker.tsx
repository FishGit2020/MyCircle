import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation, PageContent } from '@mycircle/shared';
import { useTransitArrivals } from '../hooks/useTransitArrivals';
import { useNearbyStops } from '../hooks/useNearbyStops';
import { useFavoriteStops } from '../hooks/useFavoriteStops';
import {
  loadRecentStops,
  saveRecentStops,
  upsertRecentStop,
  removeRecentStop,
} from '../lib/recentStops';
import type { RecentStopEntry } from '../types';
import StopSearch from './StopSearch';
import ArrivalsList from './ArrivalsList';

interface FavoriteCity {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

interface TransitTrackerProps {
  favoriteCities?: FavoriteCity[];
}

const TransitTracker: React.FC<TransitTrackerProps> = ({ favoriteCities }) => {
  const { t } = useTranslation();
  const { stopId: routeStopId } = useParams<{ stopId: string }>();
  const navigate = useNavigate();
  const [selectedStopId, setSelectedStopId] = useState<string | null>(routeStopId || null);
  const [recentStops, setRecentStops] = useState<RecentStopEntry[]>(loadRecentStops);
  const [selectedCityChip, setSelectedCityChip] = useState<string | null>(null);

  const { arrivals, stop, loading, error, refreshError, refresh, lastUpdated } = useTransitArrivals(selectedStopId);
  const { stops: nearbyStops, loading: nearbyLoading, error: nearbyError, permission: nearbyPermission, findNearby } = useNearbyStops();
  const { favorites, isFavorite, toggleFavorite } = useFavoriteStops();

  // Sync URL param to state — including clearing when navigating back to /transit
  useEffect(() => {
    setSelectedStopId(routeStopId || null);
   
  }, [routeStopId]);

  const handleSelectStop = useCallback((stopId: string) => {
    setSelectedStopId(stopId);
    navigate(`/transit/${encodeURIComponent(stopId)}`, { replace: true });
    // Seed an entry from any existing cache row for this stop so the user
    // sees something while the new fetch resolves; metadata is refreshed
    // by the effect below once the server response arrives.
    setRecentStops((prev) => {
      const existing = prev.find((e) => e.stopId === stopId);
      const seed: RecentStopEntry = existing ?? {
        stopId,
        name: '',
        direction: '',
        routeIds: [],
        lastSeenAt: Date.now(),
      };
      const next = upsertRecentStop(prev, { ...seed, lastSeenAt: Date.now() });
      saveRecentStops(next);
      return next;
    });
  }, [navigate]);

  const handleRemoveRecent = useCallback((stopId: string) => {
    const next = removeRecentStop(stopId);
    setRecentStops(next);
    setSelectedStopId(null);
    navigate('/transit', { replace: true });
  }, [navigate]);

  // When the upstream stop metadata resolves, refresh the cached entry so
  // future renders show the correct name/direction/routes without re-fetching.
  useEffect(() => {
    if (!selectedStopId || !stop) return;
    setRecentStops((prev) => {
      const existing = prev.find((e) => e.stopId === selectedStopId);
      const incoming: RecentStopEntry = {
        stopId: selectedStopId,
        name: stop.name || existing?.name || '',
        direction: stop.direction || existing?.direction || '',
        routeIds: stop.routeIds?.length ? stop.routeIds : (existing?.routeIds ?? []),
        lastSeenAt: Date.now(),
      };
      // Only persist if something changed (avoid render loops).
      if (
        existing &&
        existing.name === incoming.name &&
        existing.direction === incoming.direction &&
        existing.routeIds.join(',') === incoming.routeIds.join(',')
      ) {
        return prev;
      }
      const next = upsertRecentStop(prev, incoming);
      saveRecentStops(next);
      return next;
    });

  }, [selectedStopId, stop]);

  const handleBack = useCallback(() => {
    setSelectedStopId(null);
    navigate('/transit', { replace: true });
  }, [navigate]);

  const handleToggleFavorite = useCallback(() => {
    if (!selectedStopId) return;
    toggleFavorite({
      stopId: selectedStopId,
      stopName: stop?.name || selectedStopId,
      direction: stop?.direction || '',
      routes: stop?.routeIds || [],
    });
  }, [selectedStopId, stop, toggleFavorite]);

  // Update recent stops on mount in case localStorage changed elsewhere
  useEffect(() => {
    setRecentStops(loadRecentStops());
  }, []);

  return (
    <PageContent>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-teal-600 dark:text-teal-400">
          {t('transit.title')}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('transit.subtitle')}
        </p>
      </div>

      {selectedStopId ? (
        <div>
          {/* Back + Stop info header */}
          <div className="mb-4 flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              aria-label={t('transit.back')}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-semibold text-gray-900 dark:text-white">
                {stop ? stop.name : `${t('transit.stop')} ${selectedStopId}`}
              </h2>
              {stop?.direction && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{stop.direction}</p>
              )}
            </div>
            {/* Favorite toggle — only show when logged in */}
            {window.__currentUid && (
              <button
                type="button"
                onClick={handleToggleFavorite}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                aria-label={isFavorite(selectedStopId) ? t('transit.unfavorite') : t('transit.favorite')}
              >
                {isFavorite(selectedStopId) ? (
                  <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              aria-label={t('transit.refresh')}
            >
              <svg
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>

          {/* Loading state */}
          {loading && arrivals.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div
                className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-500"
                role="status"
              >
                <span className="sr-only">{t('transit.loading')}</span>
              </div>
            </div>
          )}

          {/* Error state — initial load failed, no data at all */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Refresh-failure banner — prior data is still shown below */}
          {refreshError && (
            <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
              <span>{t('transit.refreshFailed')}</span>
              <button
                type="button"
                onClick={refresh}
                className="min-h-[44px] rounded-lg border border-amber-300 bg-white px-3 py-1 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900 dark:text-amber-100 dark:hover:bg-amber-800"
              >
                {t('transit.retry')}
              </button>
            </div>
          )}

          {/* Stop not found — fetch resolved with no stop record */}
          {!loading && !error && stop === null && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
              <span>{t('transit.stopNotFound')}</span>
              <button
                type="button"
                onClick={() => handleRemoveRecent(selectedStopId)}
                className="min-h-[44px] rounded-lg border border-amber-300 bg-white px-3 py-1 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900 dark:text-amber-100 dark:hover:bg-amber-800"
              >
                {t('transit.removeFromRecent')}
              </button>
            </div>
          )}

          {/* Arrivals list */}
          {(!loading || arrivals.length > 0) && stop !== null ? (
            <ArrivalsList arrivals={arrivals} lastUpdated={lastUpdated} />
          ) : null}
        </div>
      ) : (
        <>
          {favoriteCities && favoriteCities.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                {t('transit.favoriteCities')}
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {favoriteCities.map(city => (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => {
                      setSelectedCityChip(city.id);
                      findNearby({ lat: city.lat, lon: city.lon });
                    }}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      selectedCityChip === city.id
                        ? 'bg-teal-600 text-white border-teal-600 dark:bg-teal-500 dark:border-teal-500'
                        : 'bg-white text-teal-700 border-teal-300 hover:bg-teal-50 dark:bg-gray-800 dark:text-teal-400 dark:border-teal-700 dark:hover:bg-gray-700'
                    }`}
                  >
                    {city.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <StopSearch
            onSelectStop={handleSelectStop}
            nearbyStops={nearbyStops}
            nearbyLoading={nearbyLoading}
            nearbyError={nearbyError}
            nearbyPermission={nearbyPermission}
            onFindNearby={(coords) => {
              setSelectedCityChip(null);
              findNearby(coords);
            }}
            recentStops={recentStops}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
          />
        </>
      )}
    </PageContent>
  );
};

export default TransitTracker;
