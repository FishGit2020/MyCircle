import { useState, useMemo, useCallback } from 'react';
import { useTranslation, StorageKeys } from '@mycircle/shared';
import type { WorshipSong } from '../types';

// --- Favorites helpers ---
function loadFavorites(): Set<string> {
  try {
    const stored = localStorage.getItem(StorageKeys.WORSHIP_FAVORITES);
    if (stored) return new Set(JSON.parse(stored));
  } catch { /* */ }
  return new Set();
}

function saveFavorites(favs: Set<string>) {
  try { localStorage.setItem(StorageKeys.WORSHIP_FAVORITES, JSON.stringify([...favs])); } catch { /* */ }
}

type SortMode = 'alpha' | 'recent';

interface SongListProps {
  songs: WorshipSong[];
  loading: boolean;
  isAuthenticated: boolean;
  onSelectSong: (id: string) => void;
  onNewSong: () => void;
}

export default function SongList({ songs, loading, isAuthenticated, onSelectSong, onNewSong }: SongListProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState(loadFavorites);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sort, setSort] = useState<SortMode>('alpha');
  const [filterFormat, setFilterFormat] = useState<'all' | 'chordpro' | 'text'>('all');

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
      return next;
    });
  }, [songs]);

  const processed = useMemo(() => {
    let result = songs;

    // Filter by favorites
    if (showFavoritesOnly) {
      result = result.filter(s => favorites.has(s.id));
    }

    // Filter by format
    if (filterFormat !== 'all') {
      result = result.filter(s => s.format === filterFormat);
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        s => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q) ||
             s.tags?.some(tag => tag.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sort === 'alpha') {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    } else {
      result = [...result].sort((a, b) => (b.updatedAt?.seconds ?? 0) - (a.updatedAt?.seconds ?? 0));
    }

    return result;
  }, [songs, search, favorites, showFavoritesOnly, sort, filterFormat]);

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
          onChange={e => setSearch(e.target.value)}
          placeholder={t('worship.searchPlaceholder')}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
        />
      </div>

      {/* Filter & sort toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Favorites toggle */}
        <button
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
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
              onClick={() => setFilterFormat(fmt)}
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
          <p>{songs.length === 0 ? t('worship.noSongs') : t('worship.noResults')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {processed.map(song => (
            <button
              key={song.id}
              onClick={() => onSelectSong(song.id)}
              className="text-left bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all group relative"
            >
              {/* Favorite star */}
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => toggleFavorite(e, song.id)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); toggleFavorite(e as unknown as React.MouseEvent, song.id); } }}
                className={`absolute top-3 right-3 p-1 rounded transition ${
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
      )}
    </div>
  );
}
