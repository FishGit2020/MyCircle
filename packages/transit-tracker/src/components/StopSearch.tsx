import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { NearbyStop, RecentStopEntry } from '../types';
import type { FavoriteStop } from '../hooks/useFavoriteStops';
import type { NearbyPermission } from '../hooks/useNearbyStops';

/** Check if user is logged in at call-time (read from window, not cached) */
function isLoggedIn(): boolean {
  return !!window.__currentUid;
}

interface StopSearchProps {
  onSelectStop: (stopId: string) => void;
  nearbyStops: NearbyStop[];
  nearbyLoading: boolean;
  nearbyError: string | null;
  nearbyPermission?: NearbyPermission;
  onFindNearby: (coords?: { lat: number; lon: number }) => void;
  recentStops: RecentStopEntry[];
  favorites: FavoriteStop[];
  onToggleFavorite: (stop: { stopId: string; stopName: string; direction: string; routes: string[] }) => void;
}

export default function StopSearch({
  onSelectStop,
  nearbyStops,
  nearbyLoading,
  nearbyError,
  nearbyPermission = 'unknown',
  onFindNearby,
  recentStops,
  favorites,
  onToggleFavorite,
}: StopSearchProps) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const loggedIn = useMemo(() => isLoggedIn(), []);

  // Fuzzy filter nearby stops and favorites by typed text
  const query = inputValue.trim().toLowerCase();
  const filteredNearby = useMemo(() => {
    if (!query) return nearbyStops;
    return nearbyStops.filter(s =>
      s.name.toLowerCase().includes(query) ||
      s.id.toLowerCase().includes(query) ||
      s.direction.toLowerCase().includes(query)
    );
  }, [nearbyStops, query]);

  const filteredFavorites = useMemo(() => {
    if (!query) return favorites;
    return favorites.filter(f =>
      f.stopName.toLowerCase().includes(query) ||
      f.stopId.toLowerCase().includes(query) ||
      f.direction.toLowerCase().includes(query)
    );
  }, [favorites, query]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (!trimmed) return;
      // If input matches a nearby stop name, select it
      const matchedNearby = nearbyStops.find(s => s.name.toLowerCase() === trimmed.toLowerCase());
      if (matchedNearby) { onSelectStop(matchedNearby.id); return; }
      // If input matches a favorite stop name, select it
      const matchedFav = favorites.find(f => f.stopName.toLowerCase() === trimmed.toLowerCase());
      if (matchedFav) { onSelectStop(matchedFav.stopId); return; }
      // Otherwise treat as stop ID
      onSelectStop(trimmed);
    },
    [inputValue, onSelectStop, nearbyStops, favorites]
  );

  return (
    <div className="space-y-4">
      {/* Stop search input */}
      <form onSubmit={handleSubmit}>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={t('transit.stopSearchPlaceholder' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-teal-400 dark:focus:ring-teal-400"
            aria-label={t('transit.stopSearchPlaceholder' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
          />
          <button
            type="submit"
            className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-500"
            aria-label={t('transit.search')}
          >
            {t('transit.search')}
          </button>
        </div>
      </form>

      {/* Find nearby button */}
      <button
        type="button"
        onClick={() => onFindNearby()}
        disabled={nearbyLoading}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        aria-label={t('transit.findNearby')}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {nearbyLoading ? t('transit.findingNearby') : t('transit.findNearby')}
      </button>

      {nearbyPermission === 'denied' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950">
          <p className="font-medium text-amber-800 dark:text-amber-200">{t('transit.locationPermissionDenied')}</p>
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">{t('transit.locationPermissionExplain')}</p>
        </div>
      )}

      {nearbyPermission === 'unavailable' && (
        <p className="text-sm text-amber-700 dark:text-amber-300">{t('transit.locationUnavailable')}</p>
      )}

      {nearbyError && nearbyPermission !== 'denied' && nearbyPermission !== 'unavailable' && (
        <p className="text-sm text-red-500 dark:text-red-400">{nearbyError}</p>
      )}

      {/* No-search-match empty state — only when user typed something and no list matched. */}
      {query &&
        filteredNearby.length === 0 &&
        filteredFavorites.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('transit.noSearchMatch')}</p>
        )}

      {/* Nearby stops list */}
      {filteredNearby.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('transit.nearbyStops')}
          </h3>
          <ul className="space-y-1">
            {filteredNearby.map((stop) => (
              <li key={stop.id} className="flex items-center">
                <button
                  type="button"
                  onClick={() => onSelectStop(stop.id)}
                  className="min-w-0 flex-1 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <span className="font-medium text-gray-900 dark:text-white">{stop.name}</span>
                  {stop.direction && (
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                      {stop.direction}
                    </span>
                  )}
                  <span className="ml-2 text-xs text-teal-600 dark:text-teal-400">
                    {Math.round(stop.distance)}m
                  </span>
                </button>
                {loggedIn && (
                  <button
                    type="button"
                    onClick={() => onToggleFavorite({ stopId: stop.id, stopName: stop.name, direction: stop.direction, routes: [] })}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-yellow-500 dark:text-gray-500 dark:hover:text-yellow-400"
                    aria-label={favorites.some((f) => f.stopId === stop.id) ? t('transit.unfavorite') : t('transit.favorite')}
                  >
                    {favorites.some((f) => f.stopId === stop.id) ? (
                      <svg className="h-4 w-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    )}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Favorite stops — only show when logged in */}
      {loggedIn && filteredFavorites.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('transit.favorites')}
          </h3>
          <ul className="space-y-1">
            {filteredFavorites.map((fav) => (
              <li key={fav.stopId} className="flex items-center">
                <button
                  type="button"
                  onClick={() => onSelectStop(fav.stopId)}
                  className="min-w-0 flex-1 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <span className="font-medium text-gray-900 dark:text-white">{fav.stopName}</span>
                  {fav.direction && (
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                      {fav.direction}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onToggleFavorite({ stopId: fav.stopId, stopName: fav.stopName, direction: fav.direction, routes: fav.routes })}
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-yellow-500 transition-colors hover:text-yellow-600 dark:hover:text-yellow-400"
                  aria-label={t('transit.unfavorite')}
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent stops — rendered from local cache, no network call */}
      {recentStops.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('transit.recentStops')}
          </h3>
          <ul className="space-y-1">
            {recentStops.map((entry) => (
              <li key={entry.stopId}>
                <button
                  type="button"
                  onClick={() => onSelectStop(entry.stopId)}
                  className="flex min-h-[44px] w-full items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-gray-900 dark:text-white">
                      {entry.name || entry.stopId}
                    </div>
                    {entry.direction && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {entry.direction}
                      </div>
                    )}
                  </div>
                  {entry.routeIds.length > 0 && (
                    <div className="flex flex-shrink-0 flex-wrap gap-1">
                      {entry.routeIds.slice(0, 4).map((routeId) => (
                        <span
                          key={routeId}
                          className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold text-teal-700 dark:bg-teal-900 dark:text-teal-200"
                        >
                          {routeId.split('_').pop()}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
