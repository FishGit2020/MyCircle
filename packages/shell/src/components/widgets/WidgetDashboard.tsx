import React, { useReducer, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTranslation, StorageKeys, WindowEvents, subscribeToMFEvent, MFEvents, eventBus } from '@mycircle/shared';
import type { Episode, Podcast } from '@mycircle/shared';
import { useAuth } from '../../context/AuthContext';
import ErrorBoundary from '../common/ErrorBoundary';
import { logEvent } from '../../lib/firebase';

// ─── Types ───────────────────────────────────────────────────────────────────

export type WidgetType = 'weather' | 'stocks' | 'verse' | 'nowPlaying' | 'notebook' | 'babyTracker' | 'childDev' | 'worship' | 'flashcards' | 'dailyLog' | 'cloudFiles' | 'benchmark' | 'immigration' | 'digitalLibrary' | 'familyGames' | 'docScanner';

export type WidgetSize = 'small' | 'medium' | 'large';

export interface WidgetConfig {
  id: WidgetType;
  visible: boolean;
  size?: WidgetSize;
}

const DEFAULT_LAYOUT: WidgetConfig[] = [
  { id: 'weather', visible: true },
  { id: 'stocks', visible: true },
  { id: 'verse', visible: true },
  { id: 'nowPlaying', visible: true },
  { id: 'notebook', visible: true },
  { id: 'babyTracker', visible: true },
  { id: 'childDev', visible: true },
  { id: 'worship', visible: true },
  { id: 'flashcards', visible: true },
  { id: 'dailyLog', visible: true },
  { id: 'cloudFiles', visible: true },
  { id: 'benchmark', visible: true },
  { id: 'immigration', visible: true },
  { id: 'digitalLibrary', visible: true },
  { id: 'familyGames', visible: true },
  { id: 'docScanner', visible: true },
];

// ─── Persistence ─────────────────────────────────────────────────────────────

const VALID_IDS = new Set<string>(DEFAULT_LAYOUT.map(w => w.id));

function loadLayout(): WidgetConfig[] {
  try {
    const stored = localStorage.getItem(StorageKeys.WIDGET_LAYOUT);
    if (stored) {
      const parsed: WidgetConfig[] = JSON.parse(stored);
      // Remove stale widget IDs that no longer exist (e.g. removed features)
      const filtered = parsed.filter(w => VALID_IDS.has(w.id));
      // Ensure all current widget types exist (forward-compat)
      const ids = new Set(filtered.map(w => w.id));
      for (const def of DEFAULT_LAYOUT) {
        if (!ids.has(def.id)) filtered.push(def);
      }
      // Migrate: ensure every widget has a size (default 'medium')
      return filtered.map(w => ({ ...w, size: w.size || 'medium' }));
    }
  } catch { /* ignore */ }
  return DEFAULT_LAYOUT;
}

function saveLayout(layout: WidgetConfig[]) {
  try {
    localStorage.setItem(StorageKeys.WIDGET_LAYOUT, JSON.stringify(layout));
    window.dispatchEvent(new Event(WindowEvents.WIDGET_LAYOUT_CHANGED));
  } catch { /* ignore */ }
}

// ─── Individual Widgets ──────────────────────────────────────────────────────

const WeatherWidget = React.memo(function WeatherWidget() {
  const { t } = useTranslation();
  const { favoriteCities } = useAuth();

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.weather')}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.weatherDesc')}</p>
        </div>
      </div>
      {favoriteCities.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {favoriteCities.map(city => (
            <Link
              key={city.id}
              to={`/weather/${city.lat},${city.lon}?name=${encodeURIComponent(city.name)}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-100 dark:hover:bg-blue-800/40 active:bg-blue-200 dark:active:bg-blue-700/40 transition-colors"
            >
              {city.name}
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.noFavoriteCity')}</p>
      )}
    </div>
  );
});

const StockWidget = React.memo(function StockWidget() {
  const { t } = useTranslation();
  const [watchlist, setWatchlist] = React.useState<Array<{ symbol: string; companyName: string }>>([]);

  useEffect(() => {
    function load() {
      try {
        const stored = localStorage.getItem(StorageKeys.STOCK_WATCHLIST);
        if (stored) setWatchlist(JSON.parse(stored));
        else setWatchlist([]);
      } catch { /* ignore */ }
    }
    load();
    window.addEventListener(WindowEvents.WATCHLIST_CHANGED, load);
    return () => window.removeEventListener(WindowEvents.WATCHLIST_CHANGED, load);
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.stocks')}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.stocksDesc')}</p>
        </div>
      </div>
      {watchlist.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {watchlist.map(item => (
            <Link
              key={item.symbol}
              to={`/stocks/${item.symbol}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-mono font-medium hover:bg-green-100 dark:hover:bg-green-800/40 active:bg-green-200 dark:active:bg-green-700/40 transition-colors"
            >
              {item.symbol}
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.noStocks')}</p>
      )}
    </div>
  );
});

const VerseWidget = React.memo(function VerseWidget() {
  const { t } = useTranslation();
  const [bookmarks, setBookmarks] = React.useState<Array<{ book: string; chapter: number; label: string }>>([]);

  useEffect(() => {
    function loadBookmarks() {
      try {
        const stored = localStorage.getItem(StorageKeys.BIBLE_BOOKMARKS);
        if (stored) {
          const parsed = JSON.parse(stored);
          setBookmarks(Array.isArray(parsed) ? parsed : []);
        } else {
          setBookmarks([]);
        }
      } catch { setBookmarks([]); }
    }
    loadBookmarks();
    window.addEventListener(WindowEvents.BIBLE_BOOKMARKS_CHANGED, loadBookmarks);
    return () => window.removeEventListener(WindowEvents.BIBLE_BOOKMARKS_CHANGED, loadBookmarks);
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.bible')}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.bibleDesc')}</p>
        </div>
      </div>
      {bookmarks.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {bookmarks.slice(0, 6).map((b, i) => (
            <Link
              key={i}
              to={`/bible?book=${encodeURIComponent(b.book)}&chapter=${b.chapter}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium hover:bg-amber-100 dark:hover:bg-amber-800/40 active:bg-amber-200 dark:active:bg-amber-700/40 transition-colors"
            >
              <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              {b.label || `${b.book} ${b.chapter}`}
            </Link>
          ))}
          {bookmarks.length > 6 && (
            <span className="text-[10px] text-amber-500 dark:text-amber-400 px-2 py-1">+{bookmarks.length - 6} {t('widgets.moreBookmarks')}</span>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.noBookmarks')}</p>
      )}
    </div>
  );
});

// Display state for NowPlayingWidget (podcast-only)
interface NowPlayingDisplay {
  type: 'podcast';
  title: string;       // episode title
  subtitle: string;    // podcast title
  artwork?: string;
  navigateTo: string;
  savedAt: number;
  episode?: Episode;
  podcast?: Podcast | null;
}

function loadPodcastDisplay(): NowPlayingDisplay | null {
  try {
    // Load played episodes to filter them out
    let playedIds: Set<string> = new Set();
    try {
      const raw = localStorage.getItem(StorageKeys.PODCAST_PLAYED_EPISODES);
      if (raw) playedIds = new Set(JSON.parse(raw));
    } catch { /* ignore */ }

    // Try now-playing first, then last-played
    const nowPlaying = localStorage.getItem(StorageKeys.PODCAST_NOW_PLAYING);
    if (nowPlaying) {
      const data = JSON.parse(nowPlaying);
      if (data.episode && !playedIds.has(data.episode.id)) {
        return {
          type: 'podcast',
          title: data.episode.title,
          subtitle: data.podcast?.title || '',
          artwork: data.episode.image || data.podcast?.artwork,
          navigateTo: data.podcast ? `/podcasts/${data.podcast.id}` : '/podcasts',
          savedAt: 0, // now-playing has no savedAt; treat as older than last-played
          episode: data.episode,
          podcast: data.podcast,
        };
      }
    }
    const lastPlayed = localStorage.getItem(StorageKeys.PODCAST_LAST_PLAYED);
    if (lastPlayed) {
      const data = JSON.parse(lastPlayed);
      if (data.episode && !playedIds.has(data.episode.id)) {
        return {
          type: 'podcast',
          title: data.episode.title,
          subtitle: data.podcast?.title || '',
          artwork: data.episode.image || data.podcast?.artwork,
          navigateTo: data.podcast ? `/podcasts/${data.podcast.id}` : '/podcasts',
          savedAt: data.savedAt || 0,
          episode: data.episode as Episode,
          podcast: data.podcast as Podcast,
        };
      }
    }
  } catch { /* ignore */ }
  return null;
}


const NowPlayingWidget = React.memo(function NowPlayingWidget() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [display, setDisplay] = React.useState<NowPlayingDisplay | null>(null);
  const [isActivelyPlaying, setIsActivelyPlaying] = React.useState(false);
  const [hasSubscriptions, setHasSubscriptions] = React.useState(false);

  useEffect(() => {
    function loadSubs() {
      try {
        const stored = localStorage.getItem(StorageKeys.PODCAST_SUBSCRIPTIONS);
        if (stored) {
          const subs = JSON.parse(stored);
          setHasSubscriptions(Array.isArray(subs) && subs.length > 0);
        } else {
          setHasSubscriptions(false);
        }
      } catch { /* ignore */ }
    }
    loadSubs();
    window.addEventListener(WindowEvents.SUBSCRIPTIONS_CHANGED, loadSubs);
    return () => window.removeEventListener(WindowEvents.SUBSCRIPTIONS_CHANGED, loadSubs);
  }, []);

  // Hydrate display from persisted podcast data only
  const hydrateDisplay = React.useCallback(() => {
    setDisplay(loadPodcastDisplay());
  }, []);

  useEffect(() => {
    hydrateDisplay();

    // Live updates from podcast play/close events
    const unsubPlay = subscribeToMFEvent<{ episode: Episode; podcast: Podcast | null }>(
      MFEvents.PODCAST_PLAY_EPISODE,
      (data) => {
        setDisplay({
          type: 'podcast',
          title: data.episode.title,
          subtitle: data.podcast?.title || '',
          artwork: data.episode.image || data.podcast?.artwork,
          navigateTo: data.podcast ? `/podcasts/${data.podcast.id}` : '/podcasts',
          savedAt: Date.now(),
          episode: data.episode,
          podcast: data.podcast,
        });
        setIsActivelyPlaying(true);
      }
    );

    const unsubClose = subscribeToMFEvent(MFEvents.PODCAST_CLOSE_PLAYER, () => setIsActivelyPlaying(false));

    // Re-hydrate when last-played data changes (e.g. on login)
    function handleLastPlayedChanged() { hydrateDisplay(); }
    window.addEventListener(WindowEvents.LAST_PLAYED_CHANGED, handleLastPlayedChanged);

    return () => {
      unsubPlay();
      unsubClose();
      window.removeEventListener(WindowEvents.LAST_PLAYED_CHANGED, handleLastPlayedChanged);
    };
  }, [hydrateDisplay]);

  const handleContinue = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!display) return;

    navigate(display.navigateTo);

    if (display.episode && display.podcast) {
      eventBus.publish(MFEvents.PODCAST_PLAY_EPISODE, { episode: display.episode, podcast: display.podcast });
    }
  }, [navigate, display]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          isActivelyPlaying
            ? 'bg-purple-500 text-white animate-pulse'
            : 'bg-purple-50 dark:bg-purple-900/30 text-purple-500'
        }`}>
          {isActivelyPlaying ? (
            <div className="flex items-end gap-0.5 h-4" aria-hidden="true">
              <span className="w-1 bg-white rounded-full animate-bounce" style={{ height: '60%', animationDelay: '0ms', animationDuration: '600ms' }} />
              <span className="w-1 bg-white rounded-full animate-bounce" style={{ height: '100%', animationDelay: '150ms', animationDuration: '600ms' }} />
              <span className="w-1 bg-white rounded-full animate-bounce" style={{ height: '40%', animationDelay: '300ms', animationDuration: '600ms' }} />
            </div>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
            {isActivelyPlaying ? t('widgets.nowPlaying') : t('widgets.podcastsTitle')}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isActivelyPlaying
              ? t('widgets.nowPlayingDesc')
              : display
                ? t('widgets.continueWhereLeft')
                : t('widgets.discoverAndListen')}
          </p>
        </div>
      </div>
      {display ? (
        <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 rounded-lg p-2.5">
          <div className="flex items-center gap-2">
            {display.artwork && (
              <img
                src={display.artwork}
                alt=""
                className="w-10 h-10 rounded object-cover flex-shrink-0 ring-2 ring-purple-300 dark:ring-purple-600"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{display.title}</p>
              <p className="text-xs text-purple-600 dark:text-purple-400 truncate">{display.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={handleContinue}
              className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-white bg-purple-500 dark:bg-purple-600 rounded-full hover:bg-purple-600 dark:hover:bg-purple-500 transition active:scale-95"
              aria-label={t('widgets.continueListening')}
            >
              {t('widgets.continueListening')}
            </button>
          </div>
        </div>
      ) : hasSubscriptions ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.nothingPlaying')}</p>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.discoverPodcasts')}</p>
      )}
    </div>
  );
});

const NotebookWidget = React.memo(function NotebookWidget() {
  const { t } = useTranslation();
  const [noteCount, setNoteCount] = React.useState<number | null>(null);
  const [publicCount, setPublicCount] = React.useState<number | null>(null);

  useEffect(() => {
    function load() {
      try {
        const stored = localStorage.getItem(StorageKeys.NOTEBOOK_CACHE);
        if (stored) setNoteCount(JSON.parse(stored));
        else setNoteCount(null);
      } catch { /* ignore */ }
    }
    load();
    window.addEventListener(WindowEvents.NOTEBOOK_CHANGED, load);
    // On auth change, fetch note count directly then poll cache as backup
    const handleAuth = () => {
      load();
      const api = window.__notebook;
      if (api?.getAll) {
        api.getAll().then((notes: any[]) => {
          setNoteCount(notes.length);
          try { localStorage.setItem(StorageKeys.NOTEBOOK_CACHE, JSON.stringify(notes.length)); } catch { /* ignore */ }
        }).catch(() => { /* ignore */ });
      }
      // Poll cache as fallback in case subscription populates it
      const interval = setInterval(load, 1000);
      setTimeout(() => clearInterval(interval), 10000);
    };
    window.addEventListener(WindowEvents.AUTH_STATE_CHANGED, handleAuth);
    return () => {
      window.removeEventListener(WindowEvents.NOTEBOOK_CHANGED, load);
      window.removeEventListener(WindowEvents.AUTH_STATE_CHANGED, handleAuth);
    };
  }, []);

  // Fetch public notes count (lightweight — cached by Firestore persistence)
  useEffect(() => {
    function loadPublic() {
      const api = window.__notebook;
      if (api?.getAllPublic) {
        api.getAllPublic().then((notes: any[]) => {
          setPublicCount(notes.length);
        }).catch(() => { /* ignore */ });
      }
    }
    loadPublic();
    window.addEventListener(WindowEvents.AUTH_STATE_CHANGED, loadPublic);
    return () => window.removeEventListener(WindowEvents.AUTH_STATE_CHANGED, loadPublic);
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.notebook')}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.notebookDesc')}</p>
        </div>
      </div>
      <div className="space-y-1">
        {noteCount !== null && noteCount > 0 ? (
          <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
            {t('notebook.noteCount').replace('{count}', String(noteCount))}
          </p>
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.noNotes')}</p>
        )}
        {publicCount !== null && publicCount > 0 && (
          <p className="text-xs text-indigo-500 dark:text-indigo-400/70">
            {t('widgets.publicNoteCount').replace('{count}', String(publicCount))}
          </p>
        )}
      </div>
    </div>
  );
});

// Inline fruit-size lookup for widget — duplication necessary since we can't import from baby-tracker MFE
const BABY_SIZES: Record<'fruit' | 'animal' | 'vegetable', string[]> = {
  fruit: [
    '', 'poppy seed', 'poppy seed', 'poppy seed', 'poppy seed', 'sesame seed', 'lentil', 'blueberry',
    'raspberry', 'grape', 'kumquat', 'fig', 'lime', 'lemon', 'peach', 'apple', 'avocado', 'pear',
    'bell pepper', 'mango', 'banana', 'pomegranate', 'papaya', 'grapefruit', 'ear of corn', 'acorn squash',
    'large papaya', 'large pomelo', 'eggplant', 'butternut squash', 'large cucumber', 'coconut', 'small papaya',
    'pineapple', 'cantaloupe', 'honeydew melon', 'crenshaw melon', 'winter melon', 'small pumpkin',
    'mini watermelon', 'watermelon',
  ],
  animal: [
    '', 'flea', 'flea', 'flea', 'ant', 'tadpole', 'ladybug', 'bee',
    'tree frog', 'goldfish', 'hummingbird', 'mouse', 'hamster', 'gerbil', 'chipmunk', 'hedgehog', 'duckling', 'baby rabbit',
    'guinea pig', 'ferret', 'kitten', 'sugar glider', 'chinchilla', 'prairie dog', 'cottontail rabbit', 'barn owl',
    'groundhog', 'toy poodle', 'red panda', 'jackrabbit', 'small cat', 'raccoon', 'cocker spaniel',
    'armadillo', 'fox cub', 'beagle puppy', 'otter', 'koala', 'red fox',
    'corgi', 'small lamb',
  ],
  vegetable: [
    '', 'grain of salt', 'grain of salt', 'mustard seed', 'peppercorn', 'sesame seed', 'lentil', 'kidney bean',
    'chickpea', 'olive', 'Brussels sprout', 'baby carrot', 'jalape\u00f1o', 'snap pea pod', 'tomato', 'artichoke', 'beet', 'turnip',
    'bell pepper', 'zucchini', 'sweet potato', 'carrot', 'spaghetti squash', 'potato', 'ear of corn', 'rutabaga',
    'scallion bunch', 'cauliflower', 'eggplant', 'butternut squash', 'cabbage', 'coconut', 'jicama',
    'celery stalk', 'cantaloupe', 'honeydew melon', 'romaine lettuce', 'swiss chard', 'leek',
    'pumpkin', 'watermelon',
  ],
};
const BABY_CATEGORY_ICONS: Record<string, string> = { fruit: '\uD83C\uDF4E', animal: '\uD83D\uDC3E', vegetable: '\uD83E\uDD66' };

const BabyTrackerWidget = React.memo(function BabyTrackerWidget() {
  const { t } = useTranslation();
  const [weekInfo, setWeekInfo] = React.useState<{ week: number; day: number } | null>(null);
  const [category, setCategory] = React.useState<'fruit' | 'animal' | 'vegetable'>('fruit');

  useEffect(() => {
    function compute() {
      try {
        const stored = localStorage.getItem(StorageKeys.BABY_DUE_DATE);
        if (stored) {
          const dueDate = new Date(stored + 'T00:00:00');
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const msPerDay = 24 * 60 * 60 * 1000;
          const totalDaysPregnant = Math.floor((today.getTime() - (dueDate.getTime() - 40 * 7 * msPerDay)) / msPerDay);
          const week = Math.floor(totalDaysPregnant / 7);
          const day = totalDaysPregnant % 7;
          if (week >= 1 && week <= 40) {
            setWeekInfo({ week, day });
          } else {
            setWeekInfo(null);
          }
        } else {
          setWeekInfo(null);
        }
      } catch { setWeekInfo(null); }
    }
    compute();
    window.addEventListener('baby-due-date-changed', compute);
    return () => window.removeEventListener('baby-due-date-changed', compute);
  }, []);

  const sizeLabel = weekInfo ? (BABY_SIZES[category][weekInfo.week] || '') : '';

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-pink-50 dark:bg-pink-900/30 flex items-center justify-center text-pink-500">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.babyTracker')}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.babyTrackerDesc')}</p>
        </div>
      </div>
      {weekInfo ? (
        <>
          <p className="text-sm text-pink-600 dark:text-pink-400 font-medium capitalize">
            {t('baby.week')} {weekInfo.week}{weekInfo.day > 0 ? ` + ${weekInfo.day} ${t('baby.days')}` : ''} — {sizeLabel}
          </p>
          <div className="flex gap-1 mt-1.5">
            {(['fruit', 'animal', 'vegetable'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCategory(cat); }}
                className={`px-2 py-0.5 rounded-full text-xs min-h-[28px] transition ${
                  category === cat
                    ? 'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 font-medium'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                aria-label={t(`baby.category${cat.charAt(0).toUpperCase() + cat.slice(1)}`)}
              >
                {BABY_CATEGORY_ICONS[cat]}
              </button>
            ))}
          </div>
        </>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.noDueDate')}</p>
      )}
    </div>
  );
});

/* Age range labels for inline lookup (avoids cross-MFE import) */
const CHILD_AGE_RANGES = [
  { min: 0, max: 3, label: '0\u20133 Months' },
  { min: 3, max: 6, label: '3\u20136 Months' },
  { min: 6, max: 9, label: '6\u20139 Months' },
  { min: 9, max: 12, label: '9\u201312 Months' },
  { min: 12, max: 18, label: '12\u201318 Months' },
  { min: 18, max: 24, label: '18\u201324 Months' },
  { min: 24, max: 36, label: '2\u20133 Years' },
  { min: 36, max: 48, label: '3\u20134 Years' },
  { min: 48, max: 60, label: '4\u20135 Years' },
];

function getStageLabel(months: number): string {
  for (const r of CHILD_AGE_RANGES) {
    if (months >= r.min && months < r.max) return r.label;
  }
  return months >= 60 ? '5+ Years' : '';
}

const ChildDevWidget = React.memo(function ChildDevWidget() {
  const { t } = useTranslation();
  const [childName, setChildName] = React.useState<string | null>(null);
  const [ageMonths, setAgeMonths] = React.useState<number | null>(null);

  useEffect(() => {
    function compute() {
      try {
        const name = localStorage.getItem(StorageKeys.CHILD_NAME);
        const birthRaw = localStorage.getItem(StorageKeys.CHILD_BIRTH_DATE);
        setChildName(name);
        if (birthRaw) {
          let birthStr: string;
          try { birthStr = atob(birthRaw); } catch { birthStr = birthRaw; }
          const birth = new Date(birthStr + 'T00:00:00');
          const today = new Date();
          const months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
          setAgeMonths(Math.max(0, months));
        } else {
          setAgeMonths(null);
        }
      } catch { setChildName(null); setAgeMonths(null); }
    }
    compute();
    window.addEventListener('child-data-changed', compute);
    return () => window.removeEventListener('child-data-changed', compute);
  }, []);

  const ageDisplay = ageMonths !== null
    ? ageMonths >= 24
      ? `${Math.floor(ageMonths / 12)}y ${ageMonths % 12}m`
      : `${ageMonths}m`
    : null;

  const stageLabel = ageMonths !== null ? getStageLabel(ageMonths) : null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.childDev')}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.childDevDesc')}</p>
        </div>
      </div>
      {childName && ageDisplay ? (
        <div className="bg-teal-50/50 dark:bg-teal-900/10 rounded-lg p-2.5">
          <p className="text-sm font-medium text-teal-700 dark:text-teal-300">
            {childName} — {ageDisplay}
          </p>
          {stageLabel && (
            <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">
              {stageLabel}
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.noChildData')}</p>
      )}
    </div>
  );
});

const WorshipWidget = React.memo(function WorshipWidget() {
  const { t } = useTranslation();
  const [songCount, setSongCount] = React.useState(0);
  const [favCount, setFavCount] = React.useState(0);

  useEffect(() => {
    function load() {
      try {
        const raw = localStorage.getItem(StorageKeys.WORSHIP_SONGS_CACHE);
        if (raw) {
          const songs = JSON.parse(raw);
          setSongCount(Array.isArray(songs) ? songs.length : 0);
        } else {
          setSongCount(0);
        }
      } catch { setSongCount(0); }
      try {
        const rawFav = localStorage.getItem(StorageKeys.WORSHIP_FAVORITES);
        if (rawFav) {
          const favs = JSON.parse(rawFav);
          setFavCount(Array.isArray(favs) ? favs.length : 0);
        } else {
          setFavCount(0);
        }
      } catch { setFavCount(0); }
    }
    load();
    window.addEventListener(WindowEvents.WORSHIP_SONGS_CHANGED, load);
    window.addEventListener(WindowEvents.WORSHIP_FAVORITES_CHANGED, load);
    return () => {
      window.removeEventListener(WindowEvents.WORSHIP_SONGS_CHANGED, load);
      window.removeEventListener(WindowEvents.WORSHIP_FAVORITES_CHANGED, load);
    };
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center text-violet-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.worship')}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.worshipDesc')}</p>
        </div>
      </div>
      {songCount > 0 || favCount > 0 ? (
        <div className="space-y-1">
          {songCount > 0 && (
            <p className="text-sm text-violet-600 dark:text-violet-400 font-medium">
              {t('widgets.worshipSongCount').replace('{count}', String(songCount))}
            </p>
          )}
          {favCount > 0 && (
            <p className="text-xs text-violet-500 dark:text-violet-400/70">
              {t('widgets.worshipFavCount').replace('{count}', String(favCount))}
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.noWorshipSongs')}</p>
      )}
    </div>
  );
});

const FlashcardsWidget = React.memo(function FlashcardsWidget() {
  const { t } = useTranslation();
  const [masteredCount, setMasteredCount] = React.useState(0);

  useEffect(() => {
    function load() {
      try {
        const raw = localStorage.getItem(StorageKeys.FLASHCARD_PROGRESS);
        if (raw) {
          const progress = JSON.parse(raw);
          setMasteredCount(Array.isArray(progress.masteredIds) ? progress.masteredIds.length : 0);
        } else {
          setMasteredCount(0);
        }
      } catch { /* ignore */ }
    }
    load();
    window.addEventListener(WindowEvents.FLASHCARD_PROGRESS_CHANGED, load);
    return () => window.removeEventListener(WindowEvents.FLASHCARD_PROGRESS_CHANGED, load);
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.flashcards')}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.flashcardsDesc')}</p>
        </div>
      </div>
      {masteredCount > 0 ? (
        <p className="text-xs text-teal-600 dark:text-teal-400/70">
          {t('widgets.flashcardsMastered').replace('{count}', String(masteredCount))}
        </p>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.noFlashcardProgress')}</p>
      )}
    </div>
  );
});

const DailyLogWidget = React.memo(function DailyLogWidget() {
  const { t } = useTranslation();
  const [entryCount, setEntryCount] = React.useState(0);

  useEffect(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    function countThisMonth(entries: any[]): number {
      if (!Array.isArray(entries)) return 0;
      return entries.filter((e: any) => e.date && e.date.startsWith(currentMonth)).length;
    }
    function load() {
      try {
        const raw = localStorage.getItem(StorageKeys.DAILY_LOG_CACHE);
        if (raw) {
          setEntryCount(countThisMonth(JSON.parse(raw)));
        } else {
          setEntryCount(0);
        }
      } catch { setEntryCount(0); }
    }
    load();
    // Also try the bridge API for fresh data
    const api = window.__workTracker;
    if (api?.getAll) {
      api.getAll().then((entries: any[]) => {
        setEntryCount(countThisMonth(entries));
        try { localStorage.setItem(StorageKeys.DAILY_LOG_CACHE, JSON.stringify(entries)); } catch { /* ignore */ }
      }).catch(() => { /* ignore */ });
    }
    window.addEventListener(WindowEvents.DAILY_LOG_CHANGED, load);
    return () => window.removeEventListener(WindowEvents.DAILY_LOG_CHANGED, load);
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.dailyLog')}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.dailyLogDesc')}</p>
        </div>
      </div>
      {entryCount > 0 ? (
        <p className="text-xs text-amber-600 dark:text-amber-400/70">
          {t('widgets.dailyLogEntries').replace('{count}', String(entryCount))}
        </p>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.noDailyLogEntries')}</p>
      )}
    </div>
  );
});

const CloudFilesWidget = React.memo(function CloudFilesWidget() {
  const { t } = useTranslation();
  const [fileCount, setFileCount] = React.useState(0);
  const [sharedCount, setSharedCount] = React.useState(0);

  useEffect(() => {
    function load() {
      try {
        const raw = localStorage.getItem(StorageKeys.CLOUD_FILES_CACHE);
        if (raw) {
          const files = JSON.parse(raw);
          setFileCount(Array.isArray(files) ? files.length : 0);
        } else {
          setFileCount(0);
        }
      } catch { setFileCount(0); }
    }
    load();
    // Also try the bridge API for fresh data
    const api = window.__cloudFiles;
    if (api?.getAll) {
      api.getAll().then((files: any[]) => {
        setFileCount(files.length);
        try { localStorage.setItem(StorageKeys.CLOUD_FILES_CACHE, JSON.stringify(files)); } catch { /* ignore */ }
      }).catch(() => { /* ignore */ });
    }
    if (api?.getAllShared) {
      api.getAllShared().then((files: any[]) => {
        setSharedCount(files.length);
      }).catch(() => { /* ignore */ });
    }
    window.addEventListener(WindowEvents.CLOUD_FILES_CHANGED, load);
    return () => window.removeEventListener(WindowEvents.CLOUD_FILES_CHANGED, load);
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.cloudFiles')}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.cloudFilesDesc')}</p>
        </div>
      </div>
      {fileCount > 0 || sharedCount > 0 ? (
        <div className="space-y-1">
          {fileCount > 0 && (
            <p className="text-xs text-cyan-600 dark:text-cyan-400/70">
              {t('cloudFiles.fileCount').replace('{count}', String(fileCount))}
            </p>
          )}
          {sharedCount > 0 && (
            <p className="text-xs text-cyan-500 dark:text-cyan-400/50">
              {t('widgets.sharedFileCount').replace('{count}', String(sharedCount))}
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.noCloudFiles')}</p>
      )}
    </div>
  );
});

const BenchmarkWidget = React.memo(function BenchmarkWidget() {
  const { t } = useTranslation();
  const [summary, setSummary] = React.useState<{ lastRunAt?: string; fastestEndpoint?: string; fastestTps?: number } | null>(null);

  React.useEffect(() => {
    function load() {
      try {
        const raw = localStorage.getItem(StorageKeys.BENCHMARK_CACHE);
        if (raw) setSummary(JSON.parse(raw));
        else setSummary(null);
      } catch { /* ignore */ }
    }
    load();
    window.addEventListener(WindowEvents.BENCHMARK_CHANGED, load);
    return () => window.removeEventListener(WindowEvents.BENCHMARK_CHANGED, load);
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.benchmark')}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.benchmarkDesc')}</p>
        </div>
      </div>
      {summary?.fastestEndpoint ? (
        <div className="space-y-1">
          <p className="text-xs text-indigo-600 dark:text-indigo-400/70">
            {t('widgets.benchmarkFastest').replace('{endpoint}', summary.fastestEndpoint).replace('{tps}', String(summary.fastestTps?.toFixed(1) ?? '?'))}
          </p>
          {summary.lastRunAt && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('widgets.benchmarkLastRun').replace('{date}', new Date(summary.lastRunAt).toLocaleDateString())}
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.noBenchmark')}</p>
      )}
    </div>
  );
});

// ─── Widget Registry ─────────────────────────────────────────────────────────

const ImmigrationWidget = React.memo(function ImmigrationWidget() {
  const { t } = useTranslation();
  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.immigration')}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.immigrationDesc')}</p>
        </div>
      </div>
    </div>
  );
});

const DigitalLibraryWidget = React.memo(function DigitalLibraryWidget() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [bookmarkCount, setBookmarkCount] = React.useState(0);
  const [isNavigating, setIsNavigating] = React.useState(false);
  const [lastPlayed, setLastPlayed] = React.useState<{
    bookId: string;
    bookTitle: string;
    chapterTitle?: string;
    artwork?: string;
  } | null>(null);
  const [audioProgress, setAudioProgress] = React.useState<{
    position: number;
    duration: number;
  } | null>(null);

  useEffect(() => {
    function load() {
      try {
        const raw = localStorage.getItem(StorageKeys.BOOK_BOOKMARKS);
        if (raw) {
          const all = JSON.parse(raw);
          setBookmarkCount(Array.isArray(all) ? all.length : 0);
        }
      } catch { /* ignore */ }
      try {
        const raw = localStorage.getItem(StorageKeys.BOOK_LAST_PLAYED);
        if (raw) {
          const data = JSON.parse(raw);
          if (data.bookId) setLastPlayed(data);
          else setLastPlayed(null);
        } else {
          setLastPlayed(null);
        }
      } catch { /* ignore */ }
      try {
        const raw = localStorage.getItem(StorageKeys.BOOK_AUDIO_PROGRESS);
        if (raw) setAudioProgress(JSON.parse(raw));
        else setAudioProgress(null);
      } catch { /* ignore */ }
    }
    load();
    window.addEventListener(WindowEvents.BOOK_BOOKMARKS_CHANGED, load);
    window.addEventListener(WindowEvents.BOOK_LAST_PLAYED_CHANGED, load);
    window.addEventListener('book-audio-progress-changed', load);
    const unsubAudioPlay = subscribeToMFEvent<import('@mycircle/shared').AudioSource>(
      MFEvents.AUDIO_PLAY,
      (audioSource) => {
        if (audioSource.type === 'book') {
          setLastPlayed({
            bookId: audioSource.collection.id || '',
            bookTitle: audioSource.collection.title,
            chapterTitle: audioSource.track.title,
            artwork: audioSource.collection.artwork,
          });
        }
      }
    );
    return () => {
      window.removeEventListener(WindowEvents.BOOK_BOOKMARKS_CHANGED, load);
      window.removeEventListener(WindowEvents.BOOK_LAST_PLAYED_CHANGED, load);
      window.removeEventListener('book-audio-progress-changed', load);
      unsubAudioPlay();
    };
  }, []);

  const progressPct = audioProgress && audioProgress.duration > 0
    ? Math.round((audioProgress.position / audioProgress.duration) * 100)
    : 0;

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.digitalLibrary')}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.digitalLibraryDesc')}</p>
        </div>
      </div>
      {lastPlayed ? (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg p-2.5">
          <div className="flex items-center gap-2">
            {lastPlayed.artwork && (
              <img
                src={lastPlayed.artwork}
                alt=""
                className="w-10 h-10 rounded object-cover flex-shrink-0 ring-2 ring-indigo-300 dark:ring-indigo-600"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{lastPlayed.bookTitle}</p>
              {lastPlayed.chapterTitle && (
                <p className="text-xs text-indigo-600 dark:text-indigo-400 truncate">{lastPlayed.chapterTitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsNavigating(true);
                navigate(`/library/${lastPlayed!.bookId}?tab=listen&autoPlay=1`);
              }}
              className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-white bg-indigo-500 dark:bg-indigo-600 rounded-full hover:bg-indigo-600 dark:hover:bg-indigo-500 transition active:scale-95 flex items-center gap-1.5"
              aria-label={t('widgets.continueListening')}
              disabled={isNavigating}
            >
              {isNavigating ? (
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : null}
              {t('widgets.continueListening')}
            </button>
          </div>
          {progressPct > 0 && (
            <div className="mt-2 h-1.5 bg-indigo-100 dark:bg-indigo-900/40 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.noAudiobook')}</p>
      )}
      {bookmarkCount > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {t('widgets.bookBookmarks' as any).replace('{count}', String(bookmarkCount))}
        </p>
      )}
    </div>
  );
});

const FamilyGamesWidget = React.memo(function FamilyGamesWidget() {
  const { t } = useTranslation();
  const [totalGames, setTotalGames] = React.useState(0);

  useEffect(() => {
    const api = window.__familyGames;
    if (!api?.getScores) return;
    const gameTypes = ['trivia', 'math', 'word', 'memory', 'headsup'];
    let total = 0;
    let done = 0;
    gameTypes.forEach(gt => {
      api.getScores(gt).then((scores: any[]) => {
        total += scores.length;
        done++;
        if (done === gameTypes.length) setTotalGames(total);
      }).catch(() => {
        done++;
        if (done === gameTypes.length) setTotalGames(total);
      });
    });
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-fuchsia-50 dark:bg-fuchsia-900/30 flex items-center justify-center text-fuchsia-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.familyGames')}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.familyGamesDesc')}</p>
        </div>
      </div>
      {totalGames > 0 && (
        <p className="text-xs text-fuchsia-600 dark:text-fuchsia-400/70">
          {t('widgets.gamesPlayed' as any).replace('{count}', String(totalGames))}
        </p>
      )}
    </div>
  );
});

const DocScannerWidget = React.memo(function DocScannerWidget() {
  const { t } = useTranslation();
  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.docScanner')}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.docScannerDesc')}</p>
        </div>
      </div>
    </div>
  );
});

const WIDGET_COMPONENTS: Record<WidgetType, React.FC> = {
  weather: WeatherWidget,
  stocks: StockWidget,
  verse: VerseWidget,
  nowPlaying: NowPlayingWidget,
  notebook: NotebookWidget,
  babyTracker: BabyTrackerWidget,
  childDev: ChildDevWidget,
  worship: WorshipWidget,
  flashcards: FlashcardsWidget,
  dailyLog: DailyLogWidget,
  cloudFiles: CloudFilesWidget,
  benchmark: BenchmarkWidget,
  immigration: ImmigrationWidget,
  digitalLibrary: DigitalLibraryWidget,
  familyGames: FamilyGamesWidget,
  docScanner: DocScannerWidget,
};

const WIDGET_ROUTES: Record<WidgetType, string | ((ctx: { favoriteCities: Array<{ lat: number; lon: number; id: string; name: string }> }) => string)> = {
  weather: '/weather',
  stocks: '/stocks',
  verse: '/bible',
  nowPlaying: '/podcasts',
  notebook: '/notebook',
  babyTracker: '/baby',
  childDev: '/child-dev',
  worship: '/worship',
  flashcards: '/flashcards',
  dailyLog: '/daily-log',
  cloudFiles: '/files',
  benchmark: '/benchmark',
  immigration: '/immigration',
  digitalLibrary: '/library',
  familyGames: '/family-games',
  docScanner: '/doc-scanner',
};

// ─── Dashboard Reducer ──────────────────────────────────────────────────────

type DashboardAction =
  | { type: 'SET_LAYOUT'; layout: WidgetConfig[] }
  | { type: 'TOGGLE_EDITING' }
  | { type: 'DRAG_START'; index: number }
  | { type: 'DRAG_OVER'; index: number }
  | { type: 'DRAG_LEAVE' }
  | { type: 'DROP'; dropIndex: number }
  | { type: 'DRAG_END' }
  | { type: 'MOVE_WIDGET'; index: number; direction: -1 | 1 }
  | { type: 'TOGGLE_VISIBILITY'; index: number }
  | { type: 'RESIZE_WIDGET'; index: number; size: WidgetSize }
  | { type: 'RESET' };

interface DashboardState {
  layout: WidgetConfig[];
  editing: boolean;
  dragIndex: number | null;
  dragOverIndex: number | null;
}

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'SET_LAYOUT':
      return { ...state, layout: action.layout };
    case 'TOGGLE_EDITING':
      return { ...state, editing: !state.editing };
    case 'DRAG_START':
      return { ...state, dragIndex: action.index };
    case 'DRAG_OVER':
      return { ...state, dragOverIndex: action.index };
    case 'DRAG_LEAVE':
      return { ...state, dragOverIndex: null };
    case 'DROP': {
      if (state.dragIndex === null || state.dragIndex === action.dropIndex) {
        return { ...state, dragOverIndex: null };
      }
      const next = [...state.layout];
      const [moved] = next.splice(state.dragIndex, 1);
      next.splice(action.dropIndex, 0, moved);
      return { ...state, layout: next, dragOverIndex: null };
    }
    case 'DRAG_END':
      return { ...state, dragIndex: null, dragOverIndex: null };
    case 'MOVE_WIDGET': {
      const target = action.index + action.direction;
      if (target < 0 || target >= state.layout.length) return state;
      const next = [...state.layout];
      [next[action.index], next[target]] = [next[target], next[action.index]];
      return { ...state, layout: next };
    }
    case 'TOGGLE_VISIBILITY':
      return {
        ...state,
        layout: state.layout.map((w, i) =>
          i === action.index ? { ...w, visible: !w.visible } : w
        ),
      };
    case 'RESIZE_WIDGET':
      return {
        ...state,
        layout: state.layout.map((w, i) =>
          i === action.index ? { ...w, size: action.size } : w
        ),
      };
    case 'RESET':
      return { ...state, layout: DEFAULT_LAYOUT };
    case 'RELOAD':
      return { ...state, layout: loadLayout() };
    default:
      return state;
  }
}

// ─── Main Dashboard Component ────────────────────────────────────────────────

export default function WidgetDashboard() {
  const { t } = useTranslation();
  const { favoriteCities } = useAuth();
  const [state, dispatch] = useReducer(dashboardReducer, undefined, () => ({
    layout: loadLayout(),
    editing: false,
    dragIndex: null,
    dragOverIndex: null,
  }));
  const { layout, editing, dragIndex, dragOverIndex } = state;
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  // Persist layout on change
  useEffect(() => {
    selfDispatchRef.current = true;
    saveLayout(layout);
  }, [layout]);

  // Reload layout when auth context updates localStorage (e.g. sign-in restore)
  const selfDispatchRef = useRef(false);
  useEffect(() => {
    const handler = () => {
      if (selfDispatchRef.current) { selfDispatchRef.current = false; return; }
      dispatch({ type: 'RELOAD' });
    };
    window.addEventListener(WindowEvents.WIDGET_LAYOUT_CHANGED, handler);
    return () => window.removeEventListener(WindowEvents.WIDGET_LAYOUT_CHANGED, handler);
  }, []);

  // ── Drag handlers ──────────────────────────────────────────────────────

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    dispatch({ type: 'DRAG_START', index });
    dragNodeRef.current = e.currentTarget as HTMLDivElement;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    // Slight delay for visual feedback
    requestAnimationFrame(() => {
      if (dragNodeRef.current) {
        dragNodeRef.current.style.opacity = '0.4';
      }
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    dispatch({ type: 'DRAG_OVER', index });
  }, []);

  const handleDragLeave = useCallback(() => {
    dispatch({ type: 'DRAG_LEAVE' });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    dispatch({ type: 'DROP', dropIndex });
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragNodeRef.current) {
      dragNodeRef.current.style.opacity = '1';
    }
    dispatch({ type: 'DRAG_END' });
  }, []);

  const visibleWidgets = React.useMemo(
    () => layout.filter(w => w.visible),
    [layout]
  );

  return (
    <section aria-label={t('widgets.title')}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          {t('widgets.title')}
        </h3>
        <div className="flex items-center gap-2">
          {editing && (
            <button
              type="button"
              onClick={() => { logEvent('widget_reset'); dispatch({ type: 'RESET' }); }}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              {t('widgets.reset')}
            </button>
          )}
          <button
            type="button"
            onClick={() => dispatch({ type: 'TOGGLE_EDITING' })}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors px-3 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
            aria-pressed={editing}
          >
            {editing ? t('widgets.done') : t('widgets.customize')}
          </button>
        </div>
      </div>

      {/* Editing mode: all widgets including hidden */}
      {editing ? (
        <div
          className="space-y-2"
          role="list"
          aria-label={t('widgets.dragHint')}
        >
          {layout.map((widget, index) => {
            const WidgetComponent = WIDGET_COMPONENTS[widget.id];
            return (
              <div
                key={widget.id}
                role="listitem"
                draggable
                onDragStart={e => handleDragStart(e, index)}
                onDragOver={e => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`
                  relative rounded-xl border-2 p-4 transition-all cursor-grab active:cursor-grabbing
                  ${dragOverIndex === index
                    ? 'border-blue-400 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  }
                  ${!widget.visible ? 'opacity-50' : ''}
                `}
              >
                <div className="flex items-center gap-2 mb-2">
                  {/* Drag handle (desktop only) */}
                  <span className="hidden md:inline text-gray-500 dark:text-gray-400 select-none" aria-hidden="true">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
                      <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                      <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
                    </svg>
                  </span>

                  {/* Move buttons (tap on mobile, click on desktop) */}
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'MOVE_WIDGET', index, direction: -1 })}
                    disabled={index === 0}
                    className="p-1.5 md:p-1 rounded-lg md:rounded text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed active:bg-gray-200 dark:active:bg-gray-600 transition-colors"
                    aria-label={t('widgets.moveUp')}
                  >
                    <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'MOVE_WIDGET', index, direction: 1 })}
                    disabled={index === layout.length - 1}
                    className="p-1.5 md:p-1 rounded-lg md:rounded text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed active:bg-gray-200 dark:active:bg-gray-600 transition-colors"
                    aria-label={t('widgets.moveDown')}
                  >
                    <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <span className="flex-1" />

                  {/* Size selector */}
                  <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                    {(['small', 'medium', 'large'] as const).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => dispatch({ type: 'RESIZE_WIDGET', index, size: s })}
                        className={`text-xs px-2 py-1 transition-colors ${
                          (widget.size || 'medium') === s
                            ? 'bg-blue-500 text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        aria-label={`${t('widgets.size')} ${s}`}
                        aria-pressed={(widget.size || 'medium') === s}
                      >
                        {s === 'small' ? 'S' : s === 'medium' ? 'M' : 'L'}
                      </button>
                    ))}
                  </div>

                  {/* Visibility toggle */}
                  <button
                    type="button"
                    onClick={() => { logEvent('widget_toggle_visibility', { widget_id: widget.id, visible: !widget.visible }); dispatch({ type: 'TOGGLE_VISIBILITY', index }); }}
                    className={`text-xs px-2 py-1 rounded-full transition-colors ${
                      widget.visible
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                    aria-label={t('widgets.toggleVisibility')}
                    aria-pressed={widget.visible}
                  >
                    {widget.visible ? t('widgets.visible') : t('widgets.hidden')}
                  </button>
                </div>
                <div className="pointer-events-none">
                  <ErrorBoundary>
                    <WidgetComponent />
                  </ErrorBoundary>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Normal mode: only visible widgets with data in a responsive grid */
        <div className="grid grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6 gap-4">
          {visibleWidgets.map(widget => {
            const WidgetComponent = WIDGET_COMPONENTS[widget.id];
            const routeDef = WIDGET_ROUTES[widget.id];
            const to = typeof routeDef === 'function' ? routeDef({ favoriteCities }) : routeDef;
            const size = widget.size || 'medium';
            const spanClass = size === 'large'
              ? 'col-span-2 lg:col-span-4 2xl:col-span-3'
              : size === 'small'
                ? 'col-span-1'
                : 'col-span-2 lg:col-span-2';
            const sizeClass = size === 'small' ? 'p-3 min-h-[80px]' : 'p-5 min-h-[120px]';
            return (
              <Link
                key={widget.id}
                to={to}
                className={`block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all ${sizeClass} ${spanClass}`}
              >
                <ErrorBoundary>
                  <WidgetComponent />
                </ErrorBoundary>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
