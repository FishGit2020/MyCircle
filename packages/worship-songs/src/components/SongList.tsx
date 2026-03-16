import { useState, useMemo, useCallback } from 'react';
import { useTranslation, StorageKeys, WindowEvents } from '@mycircle/shared';
import type { WorshipSongListItem } from '../types';

// --- Favorites helpers ---
function loadFavorites(): Set<string> {
  try {
    const stored = localStorage.getItem(StorageKeys.WORSHIP_FAVORITES);
    if (stored) return new Set(JSON.parse(stored));
  } catch { /* */ }
  return new Set();
}

function saveFavorites(favs: Set<string>) {
  try {
    localStorage.setItem(StorageKeys.WORSHIP_FAVORITES, JSON.stringify([...favs]));
    window.dispatchEvent(new Event(WindowEvents.WORSHIP_FAVORITES_CHANGED));
  } catch { /* */ }
}

type SortMode = 'alpha' | 'recent';

interface SongListProps {
  songs: WorshipSongListItem[];
  totalCount: number;
  totalPages: number;
  page: number;
  allArtists: string[];
  allTags: string[];
  loading: boolean;
  isAuthenticated: boolean;
  search: string;
  filterArtist: string;
  filterTag: string;
  filterFormat: 'all' | 'chordpro' | 'text';
  showFavoritesOnly: boolean;
  onSearchChange: (query: string) => void;
  onFilterArtistChange: (artist: string) => void;
  onFilterTagChange: (tag: string) => void;
  onFilterFormatChange: (format: 'all' | 'chordpro' | 'text') => void;
  onFavoritesToggle: (on: boolean, ids: string[]) => void;
  onSelectSong: (id: string) => void;
  onNewSong: () => void;
  onDeleteSong?: (id: string) => void;
  onDownloadSong?: (id: string) => void;
  onPageChange: (page: number) => void;
  onResetFilters?: () => void;
}

export default function SongList({
  songs, _totalCount, totalPages, page, allArtists, allTags,
  loading, isAuthenticated, search, filterArtist, filterTag, filterFormat, showFavoritesOnly,
  onSearchChange, onFilterArtistChange, onFilterTagChange, onFilterFormatChange, onFavoritesToggle,
  onSelectSong, onNewSong, onDeleteSong, onDownloadSong, onPageChange, onResetFilters,
}: SongListProps) {
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState(loadFavorites);
  const [sort, setSort] = useState<SortMode>('alpha');

  const hasActiveFilter = search.trim() !== '' || filterArtist !== '' || filterTag !== '' || filterFormat !== 'all' || showFavoritesOnly;

  const toggleFavorite = useCallback((e: React.MouseEvent, songId: string) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(songId)) {
        next.delete(songId);
      } else {
        next.add(songId);
        const song = songs.find(s => s.id === songId);
        if (song) window.__logAnalyticsEvent?.('worship_song_favorite', { song_title: song.title });
      }
      saveFavorites(next);
      // If favorites filter is active, update server-side filter with new set
      if (showFavoritesOnly) {
        onFavoritesToggle(true, [...next]);
      }
      return next;
    });
  }, [songs, showFavoritesOnly, onFavoritesToggle]);

  const handleFavoritesToggle = useCallback(() => {
    const newVal = !showFavoritesOnly;
    onFavoritesToggle(newVal, [...favorites]);
  }, [showFavoritesOnly, favorites, onFavoritesToggle]);

  // Sort is still client-side (only applies to current page)
  const processed = useMemo(() => {
    const result = [...songs];
    if (sort === 'alpha') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      result.sort((a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime());
    }
    return result;
  }, [songs, sort]);

  // Build visible page numbers: show up to 5 pages around current
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [page, totalPages]);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('worship.title')}
        </h2>
        {isAuthenticated && (
          <button
            onClick={onNewSong}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {t('worship.addSong')}
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder={t('worship.searchPlaceholder')}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
        />
      </div>

      {/* Filter & sort toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Favorites toggle */}
        <button
          onClick={handleFavoritesToggle}
          className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition ${
            showFavoritesOnly
              ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-yellow-300 dark:hover:border-yellow-700'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill={showFavoritesOnly ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          {t('worship.favorites')}
        </button>

        {/* Format filter */}
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {(['all', 'chordpro', 'text'] as const).map(fmt => (
            <button
              key={fmt}
              onClick={() => onFilterFormatChange(fmt)}
              className={`px-2.5 py-1.5 text-xs font-medium transition ${
                filterFormat === fmt
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {fmt === 'all' ? t('worship.filterAll') : fmt === 'chordpro' ? t('worship.formatChordpro') : t('worship.formatText')}
            </button>
          ))}
        </div>

        {/* Artist filter — uses server-provided complete list */}
        {allArtists.length > 1 && (
          <select
            value={filterArtist}
            onChange={e => onFilterArtistChange(e.target.value)}
            className="px-2 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 focus:ring-1 focus:ring-blue-400 outline-none"
            aria-label={t('worship.filterArtist')}
          >
            <option value="">{t('worship.allArtists')}</option>
            {allArtists.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        )}

        {/* Tag filter — uses server-provided complete list */}
        {allTags.length > 0 && (
          <select
            value={filterTag}
            onChange={e => onFilterTagChange(e.target.value)}
            className="px-2 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 focus:ring-1 focus:ring-blue-400 outline-none"
            aria-label={t('worship.filterTag')}
          >
            <option value="">{t('worship.allTags')}</option>
            {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
          </select>
        )}

        {/* Reset filters */}
        {hasActiveFilter && onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-700 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            {t('worship.resetFilters')}
          </button>
        )}

        {/* Sort */}
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden ml-auto">
          <button
            onClick={() => setSort('alpha')}
            className={`px-2.5 py-1.5 text-xs font-medium transition ${
              sort === 'alpha'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {t('worship.sortAlpha')}
          </button>
          <button
            onClick={() => setSort('recent')}
            className={`px-2.5 py-1.5 text-xs font-medium transition ${
              sort === 'recent'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {t('worship.sortRecent')}
          </button>
        </div>
      </div>

      {!isAuthenticated && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 italic">
          {t('worship.loginToEdit')}
        </p>
      )}

      {/* Song grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : processed.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <p>{songs.length === 0 && !search.trim() ? t('worship.noSongs') : t('worship.noResults')}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {processed.map(song => (
              <button
                key={song.id}
                onClick={() => onSelectSong(song.id)}
                className="text-left bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all group relative"
              >
                {/* Action icons — top right: delete, download, favorite */}
                <div className="absolute top-3 right-3 flex items-center gap-0.5">
                  {/* Delete button */}
                  {isAuthenticated && onDeleteSong && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); onDeleteSong(song.id); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onDeleteSong(song.id); } }}
                      className="p-1 rounded text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 hover:text-red-500 dark:hover:text-red-400 transition"
                      aria-label={t('worship.deleteSong')}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </span>
                  )}
                  {/* Download button */}
                  {onDownloadSong && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); onDownloadSong(song.id); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onDownloadSong(song.id); } }}
                      className="p-1 rounded text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 hover:text-blue-500 dark:hover:text-blue-400 transition"
                      aria-label={t('worship.download')}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </span>
                  )}
                  {/* Favorite star */}
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => toggleFavorite(e, song.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); toggleFavorite(e as unknown as React.MouseEvent, song.id); } }}
                    className={`p-1 rounded transition ${
                      favorites.has(song.id)
                        ? 'text-yellow-500'
                        : 'text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100'
                    }`}
                    aria-label={favorites.has(song.id) ? t('worship.favorited') : t('worship.favorite')}
                  >
                    <svg className="w-4 h-4" fill={favorites.has(song.id) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </span>
                </div>

                <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate pr-8">
                  {song.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                  {song.artist}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">
                    {song.originalKey}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    song.format === 'chordpro'
                      ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {song.format === 'chordpro' ? t('worship.formatChordpro') : t('worship.formatText')}
                  </span>
                </div>
                {song.tags && song.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {song.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <nav className="mt-6 flex items-center justify-center gap-1" aria-label={t('worship.pagination')}>
              {/* Previous */}
              <button
                type="button"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-40 disabled:cursor-not-allowed min-h-[36px]"
                aria-label={t('worship.prevPage')}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Page numbers */}
              {pageNumbers[0] > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => onPageChange(1)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition min-h-[36px]"
                  >
                    1
                  </button>
                  {pageNumbers[0] > 2 && (
                    <span className="px-1 text-xs text-gray-400 dark:text-gray-500" aria-hidden="true">&hellip;</span>
                  )}
                </>
              )}
              {pageNumbers.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition min-h-[36px] ${
                    p === page
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  aria-current={p === page ? 'page' : undefined}
                >
                  {p}
                </button>
              ))}
              {pageNumbers[pageNumbers.length - 1] < totalPages && (
                <>
                  {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                    <span className="px-1 text-xs text-gray-400 dark:text-gray-500" aria-hidden="true">&hellip;</span>
                  )}
                  <button
                    type="button"
                    onClick={() => onPageChange(totalPages)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition min-h-[36px]"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              {/* Next */}
              <button
                type="button"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-40 disabled:cursor-not-allowed min-h-[36px]"
                aria-label={t('worship.nextPage')}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Page info */}
              <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                {t('worship.pageOf', { page: String(page), total: String(totalPages) })}
              </span>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
