import React from 'react';
import { useTranslation } from '@mycircle/shared';

interface FavoriteCity {
  id: string;
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
}

interface Props {
  favoriteCities: FavoriteCity[];
  onToggleFavorite: (city: FavoriteCity) => Promise<boolean>;
  onClose: () => void;
}

export default function FavoritesManager({ favoriteCities, onToggleFavorite, onClose }: Props) {
  const { t } = useTranslation();

  const handleRemove = async (city: FavoriteCity) => {
    await onToggleFavorite(city);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-gray-900"
      role="dialog"
      aria-label={t('favorites.manageFavorites')}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
          aria-label={t('transit.back')}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          {t('favorites.manageFavorites')}
        </h2>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {favoriteCities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <svg className="w-12 h-12 mb-3 text-gray-300 dark:text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 font-medium">{t('favorites.noFavorites')}</p>
          </div>
        ) : (
          favoriteCities.map(city => (
            <div
              key={city.id}
              className="flex items-center px-4 py-4 border-b border-gray-100 dark:border-gray-800"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-800 dark:text-white">{city.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {city.state && `${city.state}, `}{city.country}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(city)}
                aria-label={t('favorites.removeFromFavorites')}
                className="ml-3 flex items-center justify-center w-9 h-9 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/30 transition-colors flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
