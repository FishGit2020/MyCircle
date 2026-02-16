import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router';
import { useTranslation, StorageKeys, subscribeToMFEvent, MFEvents, REVERSE_GEOCODE, GET_CURRENT_WEATHER, useLazyQuery, useUnits, formatTemperature } from '@mycircle/shared';
import type { Episode, Podcast } from '@mycircle/shared';
import { useAuth } from '../../context/AuthContext';
import { useDailyVerse } from '../../hooks/useDailyVerse';

// ─── Types ───────────────────────────────────────────────────────────────────

export type WidgetType = 'weather' | 'stocks' | 'verse' | 'nowPlaying' | 'notebook' | 'babyTracker';

export interface WidgetConfig {
  id: WidgetType;
  visible: boolean;
}

const DEFAULT_LAYOUT: WidgetConfig[] = [
  { id: 'weather', visible: true },
  { id: 'stocks', visible: true },
  { id: 'verse', visible: true },
  { id: 'nowPlaying', visible: true },
  { id: 'notebook', visible: true },
  { id: 'babyTracker', visible: true },
];

// ─── Persistence ─────────────────────────────────────────────────────────────

function loadLayout(): WidgetConfig[] {
  try {
    const stored = localStorage.getItem(StorageKeys.WIDGET_LAYOUT);
    if (stored) {
      const parsed: WidgetConfig[] = JSON.parse(stored);
      // Ensure all widget types exist (forward-compat)
      const ids = new Set(parsed.map(w => w.id));
      for (const def of DEFAULT_LAYOUT) {
        if (!ids.has(def.id)) parsed.push(def);
      }
      return parsed;
    }
  } catch { /* ignore */ }
  return DEFAULT_LAYOUT;
}

function saveLayout(layout: WidgetConfig[]) {
  try {
    localStorage.setItem(StorageKeys.WIDGET_LAYOUT, JSON.stringify(layout));
  } catch { /* ignore */ }
}

// ─── Individual Widgets ──────────────────────────────────────────────────────

/** Get a brief clothing tip based on temperature */
function getClothingTip(temp: number, weatherMain: string): string {
  const isRainy = /rain|drizzle|thunderstorm/i.test(weatherMain);
  const isSnowy = /snow/i.test(weatherMain);
  if (isSnowy) return 'widgets.tipSnow';
  if (isRainy) return 'widgets.tipRain';
  if (temp <= 0) return 'widgets.tipFreezing';
  if (temp <= 10) return 'widgets.tipCold';
  if (temp <= 20) return 'widgets.tipCool';
  if (temp <= 28) return 'widgets.tipWarm';
  return 'widgets.tipHot';
}

/** Get a weather condition icon */
function getWeatherIcon(weatherMain: string): string {
  const main = weatherMain.toLowerCase();
  if (main.includes('thunder')) return '\u26C8\uFE0F';
  if (main.includes('rain') || main.includes('drizzle')) return '\u{1F327}\uFE0F';
  if (main.includes('snow')) return '\u{1F328}\uFE0F';
  if (main.includes('cloud')) return '\u2601\uFE0F';
  if (main === 'clear') return '\u2600\uFE0F';
  if (main.includes('fog') || main.includes('mist') || main.includes('haze')) return '\u{1F32B}\uFE0F';
  return '\u{1F324}\uFE0F';
}

function WeatherWidget() {
  const { t } = useTranslation();
  const { tempUnit } = useUnits();
  const { favoriteCities } = useAuth();
  const [geoCity, setGeoCity] = useState<string | null>(null);
  const [geoError, setGeoError] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  const [fetchWeather, { data: weatherData }] = useLazyQuery(GET_CURRENT_WEATHER);
  const [fetchGeocode, { data: geocodeData }] = useLazyQuery(REVERSE_GEOCODE);

  // Update city name when geocode completes
  useEffect(() => {
    if (geocodeData?.reverseGeocode?.name) {
      setGeoCity(geocodeData.reverseGeocode.name);
    }
  }, [geocodeData]);

  // Auto-fetch current location weather on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError(true);
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        fetchWeather({ variables: { lat: latitude, lon: longitude } });
        fetchGeocode({ variables: { lat: latitude, lon: longitude } });
        setGeoLoading(false);
      },
      () => {
        setGeoError(true);
        setGeoLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const current = weatherData?.currentWeather;
  const weatherMain = current?.weather?.[0]?.main || '';

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

      {/* Current location weather */}
      {geoLoading && (
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.locating')}</span>
        </div>
      )}

      {current && (
        <div className="bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 rounded-lg p-2.5 mb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg" role="img" aria-label={weatherMain}>{getWeatherIcon(weatherMain)}</span>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {geoCity || t('widgets.yourLocation')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTemperature(current.temp, tempUnit)} · {weatherMain}
                </p>
              </div>
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatTemperature(current.temp, tempUnit)}
            </span>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1.5">
            {t(getClothingTip(current.temp, weatherMain) as any)}
          </p>
        </div>
      )}

      {geoError && !current && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
          {t('widgets.enableLocation')}
        </p>
      )}

      {/* Favorite cities */}
      {favoriteCities.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {favoriteCities.slice(0, 3).map(c => (
            <span key={c.id} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              {c.name}
            </span>
          ))}
          {favoriteCities.length > 3 && (
            <span className="text-xs text-gray-400">+{favoriteCities.length - 3}</span>
          )}
        </div>
      ) : !current ? (
        <p className="text-xs text-gray-400 dark:text-gray-500">{t('widgets.noFavoriteCity')}</p>
      ) : null}
    </div>
  );
}

function StockWidget() {
  const { t } = useTranslation();
  const [watchlist, setWatchlist] = useState<Array<{ symbol: string; companyName: string }>>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(StorageKeys.STOCK_WATCHLIST);
      if (stored) setWatchlist(JSON.parse(stored));
    } catch { /* ignore */ }
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
          {watchlist.slice(0, 4).map(item => (
            <span key={item.symbol} className="text-xs px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-mono">
              {item.symbol}
            </span>
          ))}
          {watchlist.length > 4 && (
            <span className="text-xs text-gray-400">+{watchlist.length - 4}</span>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-400 dark:text-gray-500">{t('widgets.noStocks')}</p>
      )}
    </div>
  );
}

function VerseWidget() {
  const { t } = useTranslation();
  const { verse, loading } = useDailyVerse();

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.verse')}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.verseDesc')}</p>
        </div>
      </div>
      {loading ? (
        <div className="h-4 bg-amber-200 dark:bg-amber-800/40 rounded animate-pulse w-3/4" />
      ) : verse ? (
        <div className="bg-amber-50/50 dark:bg-amber-900/10 rounded-lg p-2.5">
          <p className="text-sm italic text-amber-700 dark:text-amber-300 leading-relaxed">
            &ldquo;{verse.text}&rdquo;
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
            — {verse.reference}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function NowPlayingWidget() {
  const { t } = useTranslation();
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [podcast, setPodcast] = useState<Podcast | null>(null);

  useEffect(() => {
    const unsubPlay = subscribeToMFEvent<{ episode: Episode; podcast: Podcast | null }>(
      MFEvents.PODCAST_PLAY_EPISODE,
      (data) => {
        setEpisode(data.episode);
        setPodcast(data.podcast);
      }
    );
    const unsubClose = subscribeToMFEvent(MFEvents.PODCAST_CLOSE_PLAYER, () => {
      setEpisode(null);
      setPodcast(null);
    });
    return () => { unsubPlay(); unsubClose(); };
  }, []);

  const isPlaying = !!episode;

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          isPlaying
            ? 'bg-purple-500 text-white animate-pulse'
            : 'bg-purple-50 dark:bg-purple-900/30 text-purple-500'
        }`}>
          {isPlaying ? (
            /* Animated equalizer bars when playing */
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
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.nowPlaying')}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.nowPlayingDesc')}</p>
        </div>
      </div>
      {episode ? (
        <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 rounded-lg p-2.5">
          <div className="flex items-center gap-2">
            {episode.image && (
              <img
                src={episode.image}
                alt=""
                className="w-10 h-10 rounded object-cover flex-shrink-0 ring-2 ring-purple-300 dark:ring-purple-600"
              />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{episode.title}</p>
              {podcast && (
                <p className="text-xs text-purple-600 dark:text-purple-400 truncate">{podcast.title}</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-400 dark:text-gray-500">{t('widgets.nothingPlaying')}</p>
      )}
    </div>
  );
}

function NotebookWidget() {
  const { t } = useTranslation();
  const [noteCount, setNoteCount] = useState<number | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(StorageKeys.NOTEBOOK_CACHE);
      if (stored) setNoteCount(JSON.parse(stored));
    } catch { /* ignore */ }
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
      {noteCount !== null && noteCount > 0 ? (
        <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
          {t('notebook.noteCount').replace('{count}', String(noteCount))}
        </p>
      ) : (
        <p className="text-xs text-gray-400 dark:text-gray-500">{t('widgets.noNotes')}</p>
      )}
    </div>
  );
}

// Inline size lookups for widget — duplication necessary since we can't import from baby-tracker MFE
type CompareCategory = 'fruit' | 'animal' | 'vegetable';
const BABY_SIZES: Record<CompareCategory, string[]> = {
  fruit: [
    '', 'poppy seed', 'poppy seed', 'poppy seed', 'poppy seed', 'sesame seed', 'lentil', 'blueberry',
    'raspberry', 'grape', 'kumquat', 'fig', 'lime', 'lemon', 'peach', 'apple', 'avocado', 'pear',
    'bell pepper', 'mango', 'banana', 'carrot', 'papaya', 'grapefruit', 'ear of corn', 'rutabaga',
    'scallion bunch', 'cauliflower', 'eggplant', 'butternut squash', 'cabbage', 'coconut', 'jicama',
    'pineapple', 'cantaloupe', 'honeydew melon', 'romaine lettuce', 'swiss chard', 'leek',
    'mini watermelon', 'watermelon',
  ],
  animal: [
    '', 'flea', 'flea', 'flea', 'ant', 'tadpole', 'ladybug', 'bee', 'tree frog', 'goldfish',
    'hummingbird', 'mouse', 'hamster', 'gerbil', 'chipmunk', 'hedgehog', 'duckling', 'baby rabbit',
    'guinea pig', 'ferret', 'kitten', 'sugar glider', 'chinchilla', 'prairie dog', 'cottontail rabbit',
    'barn owl', 'groundhog', 'toy poodle', 'red panda', 'jackrabbit', 'small cat', 'raccoon',
    'cocker spaniel', 'armadillo', 'fox cub', 'beagle puppy', 'otter', 'koala', 'red fox', 'corgi',
    'small lamb',
  ],
  vegetable: [
    '', 'grain of salt', 'grain of salt', 'mustard seed', 'peppercorn', 'sesame seed', 'lentil',
    'kidney bean', 'chickpea', 'olive', 'Brussels sprout', 'baby carrot', 'jalape\u00f1o',
    'snap pea pod', 'tomato', 'artichoke', 'beet', 'turnip', 'bell pepper', 'zucchini', 'sweet potato',
    'carrot', 'spaghetti squash', 'potato', 'ear of corn', 'rutabaga', 'scallion bunch', 'cauliflower',
    'eggplant', 'butternut squash', 'cabbage', 'coconut', 'jicama', 'celery stalk', 'cantaloupe',
    'honeydew melon', 'romaine lettuce', 'swiss chard', 'leek', 'pumpkin', 'watermelon',
  ],
};
const CATEGORY_ICONS: Record<CompareCategory, string> = { fruit: '\uD83C\uDF4E', animal: '\uD83D\uDC3E', vegetable: '\uD83E\uDD66' };
const CATEGORIES: CompareCategory[] = ['fruit', 'animal', 'vegetable'];

function BabyTrackerWidget() {
  const { t } = useTranslation();
  const [weekInfo, setWeekInfo] = useState<{ week: number; day: number } | null>(null);
  const [category, setCategory] = useState<CompareCategory>(() => {
    try {
      const stored = localStorage.getItem(StorageKeys.BABY_COMPARE_CATEGORY);
      if (stored && (stored === 'fruit' || stored === 'animal' || stored === 'vegetable')) return stored;
    } catch { /* ignore */ }
    return 'fruit';
  });

  const handleCategoryChange = useCallback((cat: CompareCategory) => {
    setCategory(cat);
    try { localStorage.setItem(StorageKeys.BABY_COMPARE_CATEGORY, cat); } catch { /* ignore */ }
  }, []);

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
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCategoryChange(cat); }}
                className={`text-xs px-1.5 py-0.5 rounded-full transition-colors ${
                  category === cat
                    ? 'bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-pink-50 dark:hover:bg-pink-900/20'
                }`}
                aria-label={t(`baby.category${cat.charAt(0).toUpperCase() + cat.slice(1)}` as any)}
              >
                {CATEGORY_ICONS[cat]}
              </button>
            ))}
          </div>
        </>
      ) : (
        <p className="text-xs text-gray-400 dark:text-gray-500">{t('widgets.noDueDate')}</p>
      )}
    </div>
  );
}

// ─── Widget Registry ─────────────────────────────────────────────────────────

const WIDGET_COMPONENTS: Record<WidgetType, React.FC> = {
  weather: WeatherWidget,
  stocks: StockWidget,
  verse: VerseWidget,
  nowPlaying: NowPlayingWidget,
  notebook: NotebookWidget,
  babyTracker: BabyTrackerWidget,
};

const WIDGET_ROUTES: Record<WidgetType, string | ((ctx: { favoriteCities: Array<{ lat: number; lon: number; id: string; name: string }> }) => string)> = {
  weather: (ctx) => ctx.favoriteCities[0] ? `/weather/${ctx.favoriteCities[0].lat},${ctx.favoriteCities[0].lon}?name=${encodeURIComponent(ctx.favoriteCities[0].name)}` : '/weather',
  stocks: '/stocks',
  verse: '/bible',
  nowPlaying: '/podcasts',
  notebook: '/notebook',
  babyTracker: '/baby',
};

// ─── Main Dashboard Component ────────────────────────────────────────────────

export default function WidgetDashboard() {
  const { t } = useTranslation();
  const { favoriteCities } = useAuth();
  const [layout, setLayout] = useState<WidgetConfig[]>(loadLayout);
  const [editing, setEditing] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  // Persist layout on change
  useEffect(() => {
    saveLayout(layout);
  }, [layout]);

  // ── Drag handlers ──────────────────────────────────────────────────────

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragIndex(index);
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
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    if (dragIndex === null || dragIndex === dropIndex) return;

    setLayout(prev => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(dropIndex, 0, moved);
      return next;
    });
  }, [dragIndex]);

  const handleDragEnd = useCallback(() => {
    if (dragNodeRef.current) {
      dragNodeRef.current.style.opacity = '1';
    }
    setDragIndex(null);
    setDragOverIndex(null);
  }, []);

  // ── Keyboard reorder ──────────────────────────────────────────────────

  const moveWidget = useCallback((index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= layout.length) return;
    setLayout(prev => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, [layout.length]);

  const toggleVisibility = useCallback((index: number) => {
    setLayout(prev => prev.map((w, i) =>
      i === index ? { ...w, visible: !w.visible } : w
    ));
  }, []);

  const resetLayout = useCallback(() => {
    setLayout(DEFAULT_LAYOUT);
  }, []);

  const visibleWidgets = layout.filter(w => w.visible);

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
              onClick={resetLayout}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              {t('widgets.reset')}
            </button>
          )}
          <button
            onClick={() => setEditing(e => !e)}
            className="text-sm font-medium text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors px-3 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
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
                  {/* Drag handle */}
                  <span className="text-gray-400 dark:text-gray-500 select-none" aria-hidden="true">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
                      <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                      <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
                    </svg>
                  </span>

                  {/* Keyboard move buttons */}
                  <button
                    onClick={() => moveWidget(index, -1)}
                    disabled={index === 0}
                    className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label={t('widgets.moveUp')}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveWidget(index, 1)}
                    disabled={index === layout.length - 1}
                    className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label={t('widgets.moveDown')}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <span className="flex-1" />

                  {/* Visibility toggle */}
                  <button
                    onClick={() => toggleVisibility(index)}
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
                <div className={!widget.visible ? 'pointer-events-none' : ''}>
                  <WidgetComponent />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Normal mode: only visible widgets in a responsive grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {visibleWidgets.map(widget => {
            const WidgetComponent = WIDGET_COMPONENTS[widget.id];
            const routeDef = WIDGET_ROUTES[widget.id];
            const to = typeof routeDef === 'function' ? routeDef({ favoriteCities }) : routeDef;
            return (
              <Link
                key={widget.id}
                to={to}
                className="block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all"
              >
                <WidgetComponent />
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
