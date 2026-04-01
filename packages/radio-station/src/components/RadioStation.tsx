import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation, PageContent, useQuery, GET_RADIO_TAGS } from '@mycircle/shared';
import { useRadioStations } from '../hooks/useRadioStations';
import { useRadioPlayer } from '../hooks/useRadioPlayer';
import { useRecentlyPlayed } from '../hooks/useRecentlyPlayed';
import { useSleepTimer } from '../hooks/useSleepTimer';
import StationCard from './StationCard';
import { FilterBar } from './FilterBar';
import StationDetail from './StationDetail';
import type { RadioStation as RadioStationType, RadioTag, RecentlyPlayedEntry } from '../types';

type Tab = 'browse' | 'favorites' | 'recent';

const RadioStation: React.FC = () => {
  const { t } = useTranslation();
  const {
    stations,
    favorites,
    loading,
    error,
    search,
    toggleFavorite,
    isFavorite,
    activeTag,
    activeCountry,
    countries,
    setActiveTag,
    setActiveCountry,
    vote,
    isVoted,
  } = useRadioStations();
  const { play, stop, currentStation, isPlaying } = useRadioPlayer();
  const { recentStations } = useRecentlyPlayed();
  const [activeTab, setActiveTab] = useState<Tab>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStation, setSelectedStation] = useState<RadioStationType | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: tagsData } = useQuery(GET_RADIO_TAGS, { variables: { limit: 50 } });
  const tags: RadioTag[] = (tagsData?.radioTags ?? []) as RadioTag[];

  const sleepTimer = useSleepTimer({ onExpire: stop });

  // Cancel sleep timer when playback stops manually
  useEffect(() => {
    if (!isPlaying && sleepTimer.active) {
      sleepTimer.cancel();
    }
  }, [isPlaying, sleepTimer]);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      search(searchQuery);
    },
    [search, searchQuery],
  );

  const handleSelectStation = useCallback((station: RadioStationType) => {
    setSelectedStation(station);
    setDetailOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailOpen(false);
  }, []);

  const handlePlayFromRecent = useCallback(
    (entry: RecentlyPlayedEntry) => {
      const station: RadioStationType = {
        stationuuid: entry.stationuuid,
        name: entry.name,
        favicon: entry.favicon,
        country: entry.country,
        url: entry.url,
        url_resolved: entry.url_resolved,
        tags: '',
        language: '',
        codec: '',
        bitrate: 0,
        votes: 0,
      };
      play(station);
    },
    [play],
  );

  const browseStations = stations;
  const hasActiveFilters = !!(activeTag || activeCountry);
  const showBrowseEmpty = !loading && !error && activeTab === 'browse' && browseStations.length === 0;

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
          className={`min-h-[44px] px-4 py-2 text-sm font-medium transition-colors ${
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
          className={`min-h-[44px] px-4 py-2 text-sm font-medium transition-colors ${
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
        <button
          type="button"
          onClick={() => setActiveTab('recent')}
          className={`min-h-[44px] px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'recent'
              ? 'border-b-2 border-orange-500 text-orange-600 dark:border-orange-400 dark:text-orange-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
          aria-label={t('radio.tabs.recent')}
        >
          {t('radio.tabs.recent')}
          {recentStations.length > 0 && (
            <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-xs text-orange-600 dark:bg-orange-900 dark:text-orange-300">
              {recentStations.length}
            </span>
          )}
        </button>
      </div>

      {/* Filter bar — Browse tab only */}
      {activeTab === 'browse' && (
        <FilterBar
          tags={tags}
          countries={countries}
          activeTag={activeTag}
          activeCountry={activeCountry}
          onTagChange={setActiveTag}
          onCountryChange={setActiveCountry}
        />
      )}

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

      {/* Browse tab */}
      {activeTab === 'browse' && !loading && !error && (
        <>
          {showBrowseEmpty && (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              {hasActiveFilters ? t('radio.noResults') : t('radio.noResults')}
            </div>
          )}
          {browseStations.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2">
              {browseStations.map((station) => (
                <StationCard
                  key={station.stationuuid}
                  station={station}
                  isFavorite={isFavorite(station.stationuuid)}
                  isPlaying={isPlaying && currentStation?.stationuuid === station.stationuuid}
                  isVoted={isVoted(station.stationuuid)}
                  onPlay={play}
                  onToggleFavorite={toggleFavorite}
                  onVote={vote}
                  onSelectStation={handleSelectStation}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Favorites tab */}
      {activeTab === 'favorites' && !loading && !error && (
        <>
          {favorites.length === 0 && (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              {t('radio.noFavorites')}
            </div>
          )}
          {favorites.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2">
              {favorites.map((station) => (
                <StationCard
                  key={station.stationuuid}
                  station={station}
                  isFavorite={isFavorite(station.stationuuid)}
                  isPlaying={isPlaying && currentStation?.stationuuid === station.stationuuid}
                  isVoted={isVoted(station.stationuuid)}
                  onPlay={play}
                  onToggleFavorite={toggleFavorite}
                  onVote={vote}
                  onSelectStation={handleSelectStation}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Recent tab */}
      {activeTab === 'recent' && (
        <>
          {recentStations.length === 0 && (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              {t('radio.recent.empty')}
            </div>
          )}
          {recentStations.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2">
              {recentStations.map((entry) => {
                const station: RadioStationType = {
                  stationuuid: entry.stationuuid,
                  name: entry.name,
                  favicon: entry.favicon,
                  country: entry.country,
                  url: entry.url,
                  url_resolved: entry.url_resolved,
                  tags: '',
                  language: '',
                  codec: '',
                  bitrate: 0,
                  votes: 0,
                };
                return (
                  <StationCard
                    key={entry.stationuuid}
                    station={station}
                    isFavorite={isFavorite(entry.stationuuid)}
                    isPlaying={isPlaying && currentStation?.stationuuid === entry.stationuuid}
                    isVoted={isVoted(entry.stationuuid)}
                    onPlay={() => handlePlayFromRecent(entry)}
                    onToggleFavorite={toggleFavorite}
                    onVote={vote}
                    onSelectStation={handleSelectStation}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Station Detail slide-over */}
      <StationDetail
        station={selectedStation}
        isOpen={detailOpen}
        isFavorite={selectedStation ? isFavorite(selectedStation.stationuuid) : false}
        isPlaying={isPlaying && currentStation?.stationuuid === selectedStation?.stationuuid}
        isVoted={selectedStation ? isVoted(selectedStation.stationuuid) : false}
        onClose={handleCloseDetail}
        onPlay={play}
        onToggleFavorite={toggleFavorite}
        onVote={vote}
      />

      {/* Sleep timer is wired to PlayerBar via RadioStation — PlayerBar is rendered inside the shell's GlobalAudioPlayer for radio, but we pass sleep state to it */}
      {/* Note: PlayerBar is only shown when the GlobalAudioPlayer is active — the sleep timer wiring happens here */}
      {isPlaying && currentStation && (
        <div className="fixed bottom-16 left-0 right-0 z-40 flex justify-center md:bottom-0">
          {/* Sleep timer countdown shown as floating badge on mobile (PlayerBar is in shell) */}
          {sleepTimer.active && (
            <div className="mb-2 flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-sm text-orange-600 shadow-lg dark:border-orange-800 dark:bg-gray-900 dark:text-orange-400 md:hidden">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('radio.sleep.countdown')
                .replace('{min}', String(Math.floor(sleepTimer.secondsLeft / 60)))
                .replace('{sec}', String(sleepTimer.secondsLeft % 60).padStart(2, '0'))}
              <button
                type="button"
                onClick={sleepTimer.cancel}
                aria-label={t('radio.sleep.cancel')}
                className="ml-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ×
              </button>
            </div>
          )}
        </div>
      )}
    </PageContent>
  );
};

export default RadioStation;
