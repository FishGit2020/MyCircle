import React, { useState, useCallback } from 'react';
import { useTranslation, PageContent } from '@mycircle/shared';
import { useRadioStations } from '../hooks/useRadioStations';
import { useRadioPlayer } from '../hooks/useRadioPlayer';
import StationCard from './StationCard';

type Tab = 'browse' | 'favorites';

const RadioStation: React.FC = () => {
  const { t } = useTranslation();
  const { stations, favorites, favoriteIds, loading, error, search, toggleFavorite } = useRadioStations();
  const { play, currentStation, isPlaying } = useRadioPlayer();
  const [activeTab, setActiveTab] = useState<Tab>('browse');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      search(searchQuery);
    },
    [search, searchQuery],
  );

  const isFavorite = useCallback(
    (stationuuid: string) => favoriteIds.includes(stationuuid),
    [favoriteIds],
  );

  const displayStations = activeTab === 'browse' ? stations : favorites;

  return (
    <PageContent>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-orange-600 dark:text-orange-400">
          {t('radio.title')}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('radio.subtitle')}
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('radio.searchPlaceholder')}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-orange-400 dark:focus:ring-orange-400"
            aria-label={t('radio.searchPlaceholder')}
          />
          <button
            type="submit"
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-500"
            aria-label={t('radio.search')}
          >
            {t('radio.search')}
          </button>
        </div>
      </form>

      {/* Tabs */}
      <div className="mb-4 flex border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setActiveTab('browse')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'browse'
              ? 'border-b-2 border-orange-500 text-orange-600 dark:border-orange-400 dark:text-orange-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
          aria-label={t('radio.browse')}
        >
          {t('radio.browse')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('favorites')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'favorites'
              ? 'border-b-2 border-orange-500 text-orange-600 dark:border-orange-400 dark:text-orange-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
          aria-label={t('radio.favorites')}
        >
          {t('radio.favorites')}
          {favorites.length > 0 && (
            <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-xs text-orange-600 dark:bg-orange-900 dark:text-orange-300">
              {favorites.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" role="status">
            <span className="sr-only">{t('radio.loading')}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          {t('radio.error')}: {error}
        </div>
      )}

      {!loading && !error && displayStations.length === 0 && (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400">
          {activeTab === 'favorites' ? t('radio.noFavorites') : t('radio.noResults')}
        </div>
      )}

      {!loading && !error && displayStations.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {displayStations.map((station) => (
            <StationCard
              key={station.stationuuid}
              station={station}
              isFavorite={isFavorite(station.stationuuid)}
              isPlaying={
                isPlaying && currentStation?.stationuuid === station.stationuuid
              }
              onPlay={play}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}
    </PageContent>
  );
};

export default RadioStation;
