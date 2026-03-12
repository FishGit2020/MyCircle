import { useState, useCallback } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { NearbyStop } from '../types';

interface StopSearchProps {
  onSelectStop: (stopId: string) => void;
  nearbyStops: NearbyStop[];
  nearbyLoading: boolean;
  nearbyError: string | null;
  onFindNearby: () => void;
  recentStops: string[];
}

export default function StopSearch({
  onSelectStop,
  nearbyStops,
  nearbyLoading,
  nearbyError,
  onFindNearby,
  recentStops,
}: StopSearchProps) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (trimmed) {
        onSelectStop(trimmed);
      }
    },
    [inputValue, onSelectStop]
  );

  return (
    <div className="space-y-4">
      {/* Stop ID input */}
      <form onSubmit={handleSubmit}>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={t('transit.stopIdPlaceholder')}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-teal-400 dark:focus:ring-teal-400"
            aria-label={t('transit.stopIdPlaceholder')}
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
        onClick={onFindNearby}
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

      {nearbyError && (
        <p className="text-sm text-red-500 dark:text-red-400">{nearbyError}</p>
      )}

      {/* Nearby stops list */}
      {nearbyStops.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('transit.nearbyStops')}
          </h3>
          <ul className="space-y-1">
            {nearbyStops.map((stop) => (
              <li key={stop.id}>
                <button
                  type="button"
                  onClick={() => onSelectStop(stop.id)}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
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
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent stops */}
      {recentStops.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('transit.recentStops')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {recentStops.map((stopId) => (
              <button
                key={stopId}
                type="button"
                onClick={() => onSelectStop(stopId)}
                className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {stopId}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
