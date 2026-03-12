import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation, PageContent } from '@mycircle/shared';
import { useTransitArrivals } from '../hooks/useTransitArrivals';
import { useNearbyStops } from '../hooks/useNearbyStops';
import { useFavoriteStops } from '../hooks/useFavoriteStops';
import StopSearch from './StopSearch';
import ArrivalsList from './ArrivalsList';

const RECENT_STOPS_KEY = 'transit-recent-stops';
const MAX_RECENT = 5;

function loadRecentStops(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_STOPS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.slice(0, MAX_RECENT);
    }
  } catch { /* ignore */ }
  return [];
}

function saveRecentStops(stops: string[]) {
  try {
    localStorage.setItem(RECENT_STOPS_KEY, JSON.stringify(stops.slice(0, MAX_RECENT)));
  } catch { /* ignore */ }
}

const TransitTracker: React.FC = () => {
  const { t } = useTranslation();
  const { stopId: routeStopId } = useParams<{ stopId: string }>();
  const navigate = useNavigate();
  const [selectedStopId, setSelectedStopId] = useState<string | null>(routeStopId || null);
  const [recentStops, setRecentStops] = useState<string[]>(loadRecentStops);

  const { arrivals, stop, loading, error, refresh, lastUpdated } = useTransitArrivals(selectedStopId);
  const { stops: nearbyStops, loading: nearbyLoading, error: nearbyError, findNearby } = useNearbyStops();
  const { favorites, isFavorite, toggleFavorite } = useFavoriteStops();

  // Sync URL param to state on initial load
  useEffect(() => {
    if (routeStopId && routeStopId !== selectedStopId) {
      setSelectedStopId(routeStopId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeStopId]);

  const handleSelectStop = useCallback((stopId: string) => {
    setSelectedStopId(stopId);
    navigate(`/transit/${encodeURIComponent(stopId)}`, { replace: true });
    setRecentStops((prev) => {
      const next = [stopId, ...prev.filter((id) => id !== stopId)].slice(0, MAX_RECENT);
      saveRecentStops(next);
      return next;
    });
  }, [navigate]);

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
            {/* Favorite toggle */}
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

          {/* Error state */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Arrivals list */}
          {!loading || arrivals.length > 0 ? (
            <ArrivalsList arrivals={arrivals} lastUpdated={lastUpdated} loading={loading} onRefresh={refresh} />
          ) : null}
        </div>
      ) : (
        <StopSearch
          onSelectStop={handleSelectStop}
          nearbyStops={nearbyStops}
          nearbyLoading={nearbyLoading}
          nearbyError={nearbyError}
          onFindNearby={findNearby}
          recentStops={recentStops}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
        />
      )}
    </PageContent>
  );
};

export default TransitTracker;
