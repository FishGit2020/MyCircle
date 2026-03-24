import { createLogger } from './logger';

const logger = createLogger('eventBus');

// Event bus for micro frontend communication
type EventCallback = (data: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any

interface EventBus {
  subscribe: (event: string, callback: EventCallback) => () => void;
  publish: (event: string, data?: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
}

// Event types for type safety
export const MFEvents = {
  CITY_SELECTED: 'mf:city-selected',
  WEATHER_LOADED: 'mf:weather-loaded',
  NAVIGATION_REQUEST: 'mf:navigation-request',
  THEME_CHANGED: 'mf:theme-changed',
  USER_LOCATION_CHANGED: 'mf:user-location-changed',
  PODCAST_PLAY_EPISODE: 'mf:podcast-play-episode',
  PODCAST_CLOSE_PLAYER: 'mf:podcast-close-player',
  PODCAST_QUEUE_EPISODE: 'mf:podcast-queue-episode',
  PODCAST_PLAYBACK_STATE: 'mf:podcast-playback-state',
  PODCAST_TOGGLE_PLAY: 'mf:podcast-toggle-play',
  PODCAST_SEEK: 'mf:podcast-seek',
  PODCAST_SKIP_FORWARD: 'mf:podcast-skip-forward',
  PODCAST_SKIP_BACK: 'mf:podcast-skip-back',
  PODCAST_CHANGE_SPEED: 'mf:podcast-change-speed',
  PODCAST_SET_SLEEP_TIMER: 'mf:podcast-set-sleep-timer',
  PODCAST_REMOVE_FROM_QUEUE: 'mf:podcast-remove-from-queue',
  // Generic audio events (source-agnostic)
  AUDIO_PLAY: 'mf:audio-play',
  AUDIO_CLOSE: 'mf:audio-close',
  AUDIO_PLAYBACK_STATE: 'mf:audio-playback-state',
  AUDIO_TOGGLE_PLAY: 'mf:audio-toggle-play',
  AUDIO_SEEK: 'mf:audio-seek',
  AUDIO_SKIP_FORWARD: 'mf:audio-skip-forward',
  AUDIO_SKIP_BACK: 'mf:audio-skip-back',
  AUDIO_NEXT_TRACK: 'mf:audio-next-track',
  AUDIO_PREV_TRACK: 'mf:audio-prev-track',
  AUDIO_CHANGE_SPEED: 'mf:audio-change-speed',
  AUDIO_SET_SLEEP_TIMER: 'mf:audio-set-sleep-timer',
  AUDIO_QUEUE: 'mf:audio-queue',
  AUDIO_REMOVE_FROM_QUEUE: 'mf:audio-remove-from-queue',
} as const;

// Window-level data-sync events (plain Event, no payload — used as invalidation signals)
export const WindowEvents = {
  UNITS_CHANGED: 'units-changed',
  WATCHLIST_CHANGED: 'watchlist-changed',
  SUBSCRIPTIONS_CHANGED: 'subscriptions-changed',
  WORSHIP_SONGS_CHANGED: 'worship-songs-changed',
  NOTEBOOK_CHANGED: 'notebook-changed',
  PUBLIC_NOTES_CHANGED: 'public-notes-changed',
  BABY_DUE_DATE_CHANGED: 'baby-due-date-changed',
  CHILD_DATA_CHANGED: 'child-data-changed',
  BOTTOM_NAV_ORDER_CHANGED: 'bottom-nav-order-changed',
  NOTIFICATION_ALERTS_CHANGED: 'notification-alerts-changed',
  BIBLE_BOOKMARKS_CHANGED: 'bible-bookmarks-changed',
  CHINESE_CHARACTERS_CHANGED: 'chinese-characters-changed',
  FLASHCARD_PROGRESS_CHANGED: 'flashcard-progress-changed',
  DAILY_LOG_CHANGED: 'daily-log-changed',
  WORSHIP_FAVORITES_CHANGED: 'worship-favorites-changed',
  BABY_MILESTONES_CHANGED: 'baby-milestones-changed',
  CLOUD_FILES_CHANGED: 'cloud-files-changed',
  SHARED_FILES_CHANGED: 'shared-files-changed',
  AUTH_STATE_CHANGED: 'auth-state-changed',
  LAST_PLAYED_CHANGED: 'last-played-changed',
  PODCAST_PLAYED_CHANGED: 'podcast-played-changed',
  BENCHMARK_CHANGED: 'benchmark-changed',
  IMMIGRATION_CASES_CHANGED: 'immigration-cases-changed',
  BOOKS_CHANGED: 'books-changed',
  WIDGET_LAYOUT_CHANGED: 'widget-layout-changed',
  WIDGET_SIZE_CHANGED: 'widget-size-changed',
  BOOK_BOOKMARKS_CHANGED: 'book-bookmarks-changed',
  BOOK_PLAYED_CHAPTERS_CHANGED: 'book-played-chapters-changed',
  BOOK_LAST_PLAYED_CHANGED: 'book-last-played-changed',
  BOOK_LISTEN_TAB_ACTIVE: 'book-listen-tab-active',
  BREADCRUMB_DETAIL: 'breadcrumb-detail',
  FAMILY_GAMES_CHANGED: 'family-games-changed',
  HIKING_ROUTES_CHANGED: 'hiking-routes-changed',
  CHILDREN_CHANGED: 'children-changed',
  TRIP_PLANNER_CHANGED: 'trip-planner-changed',
  POLL_SYSTEM_CHANGED: 'poll-system-changed',
  RADIO_CHANGED: 'radio-changed',
  TRASH_CHANGED: 'trash-changed',
  TRANSIT_CHANGED: 'transit-changed',
  TRANSIT_FAVORITES_CHANGED: 'transit-favorites-changed',
  TRAVEL_PINS_CHANGED: 'travel-pins-changed',
} as const;

// Centralized localStorage keys to avoid typo-prone string literals
export const StorageKeys = {
  TEMP_UNIT: 'tempUnit',
  SPEED_UNIT: 'speedUnit',
  DISTANCE_UNIT: 'distanceUnit',
  THEME: 'theme',
  LOCALE: 'weather-app-locale',
  STOCK_WATCHLIST: 'stock-tracker-watchlist',
  PODCAST_SUBSCRIPTIONS: 'podcast-subscriptions',
  PODCAST_PROGRESS: 'podcast-progress',
  PODCAST_SPEED: 'podcast-speed',
  WEATHER_LIVE: 'weather-live-enabled',
  STOCK_LIVE: 'stock-live-enabled',
  DASHBOARD_WIDGETS: 'weather-dashboard-widgets',
  WORSHIP_SONGS_CACHE: 'worship-songs-cache',
  WORSHIP_FAVORITES: 'worship-favorites',
  WORSHIP_SCROLL_SPEED: 'worship-scroll-speed',
  BIBLE_BOOKMARKS: 'bible-bookmarks',
  BIBLE_LAST_READ: 'bible-last-read',
  BIBLE_FONT_SIZE: 'bible-font-size',
  BIBLE_DEVOTIONAL_LOG: 'bible-devotional-log',
  WIDGET_LAYOUT: 'widget-dashboard-layout',
  WIDGET_SIZE: 'widget-dashboard-size',
  RECENT_CITIES: 'recent-cities',
  LAST_SEEN_ANNOUNCEMENT: 'last-seen-announcement',
  BIBLE_TRANSLATION: 'bible-translation',
  NOTEBOOK_CACHE: 'notebook-cache',
  BABY_DUE_DATE: 'baby-due-date',
  CHILD_NAME: 'child-name',
  CHILD_BIRTH_DATE: 'child-birth-date',
  CHILD_MILESTONES: 'child-milestones',
  BOTTOM_NAV_ORDER: 'bottom-nav-order',
  WEATHER_ALERTS: 'weather-alerts-enabled',
  ANNOUNCEMENT_ALERTS: 'announcement-alerts-enabled',
  RECENTLY_VISITED: 'recently-visited',
  CHINESE_CHARACTERS_CACHE: 'chinese-characters-cache',
  FLASHCARD_BIBLE_CARDS: 'flashcard-bible-cards',
  FLASHCARD_CUSTOM_CARDS: 'flashcard-custom-cards',
  FLASHCARD_PROGRESS: 'flashcard-progress',
  FLASHCARD_TYPE_FILTER: 'flashcard-type-filter',
  DAILY_LOG_CACHE: 'daily-log-cache',
  PODCAST_NOW_PLAYING: 'podcast-now-playing',
  FLASHCARD_PUBLIC_CARDS: 'flashcard-public-cards',
  BABY_MILESTONES_CACHE: 'baby-milestones-cache',
  CLOUD_FILES_CACHE: 'cloud-files-cache',
  PODCAST_LAST_PLAYED: 'podcast-last-played',
  PODCAST_PLAYED_EPISODES: 'podcast-played-episodes',
  KNOWN_ACCOUNTS: 'known-accounts',
  BENCHMARK_CACHE: 'benchmark-cache',
  BENCHMARK_MODEL_MAP: 'benchmark-model-map',
  BENCHMARK_RESULTS: 'benchmark-results',
  BENCHMARK_JUDGE: 'benchmark-judge',
  BENCHMARK_SELECTED_PROMPTS: 'mycircle-benchmark-selected-prompts',
  DAILY_LOG_DAY_FILTER: 'daily-log-day-filter',
  IMMIGRATION_CASES_CACHE: 'immigration-cases-cache',
  BOOKS_CACHE: 'books-cache',
  BOOK_BOOKMARKS: 'book-bookmarks',
  BOOK_AUDIO_PROGRESS: 'book-audio-progress',
  BOOK_PLAYED_CHAPTERS: 'book-played-chapters',
  BOOK_NOW_PLAYING: 'book-now-playing',
  BOOK_LAST_PLAYED: 'book-last-played',
  FAMILY_GAMES_CACHE: 'family-games-cache',
  CHILDREN_CACHE: 'children-cache',
  SELECTED_CHILD_ID: 'selected-child-id',
  RADIO_FAVORITES: 'radio-favorites',
  TRANSIT_RECENT_STOPS: 'transit-recent-stops',
  TRANSIT_FAVORITES: 'transit-favorites',
  TRAVEL_PINS: 'travel-pins-cache',
  FLASHCARD_DECKS: 'flashcard-decks',
  FLASHCARD_DECK_CARDS: 'flashcard-deck-cards',
  FLASHCARD_STREAK: 'flashcard-streak',
} as const;

export interface CitySelectedEvent {
  city: {
    id: string;
    name: string;
    lat: number;
    lon: number;
    country: string;
    state?: string;
  };
}

export interface NavigationRequestEvent {
  path: string;
  params?: Record<string, string>;
}

export interface PodcastPlayEpisodeEvent {
  episode: import('../types/podcast').Episode;
  podcast: import('../types/podcast').Podcast | null;
}

export interface PodcastPlaybackStateEvent {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackSpeed: number;
  sleepMinutes: number;
  sleepRemaining: number;
  queueLength: number;
  queue?: Array<{ id: string | number; title: string }>;
}

/** A single playable audio track */
export interface AudioTrack {
  id: string;
  url: string;
  title: string;
}

/** A collection of tracks (podcast, book, album) */
export interface AudioCollection {
  id: string;
  title: string;
  artwork?: string;
  tracks: AudioTrack[];
}

/** Generic audio source — everything the player needs */
export interface AudioSource {
  type: string;
  track: AudioTrack;
  collection: AudioCollection;
  trackIndex: number;
  navigateTo: string;
  progressKey: string;
  nowPlayingKey: string;
  lastPlayedKey: string;
  lastPlayedEvent: string;
  canQueue?: boolean;
  canShare?: boolean;
  skipSeconds?: number;
}

/** Generic playback state broadcast */
export interface AudioPlaybackStateEvent {
  type: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackSpeed: number;
  sleepMinutes: number;
  sleepRemaining: number;
  trackIndex: number;
  totalTracks: number;
  trackTitle: string;
  queueLength: number;
  queue?: Array<{ id: string; title: string }>;
}

class EventBusImpl implements EventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  subscribe(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  publish(event: string, data?: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any
    // Emit custom DOM event for cross-microfrontend communication
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(event, { detail: data }));
    }

    // Also notify local listeners
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        logger.error(`Error in event listener for ${event}:`, error);
      }
    });
  }
}

// Singleton instance
export const eventBus = new EventBusImpl();

// Hook for React components
export function useEventBus() {
  return eventBus;
}

// Helper to listen to DOM events from other micro frontends
export function subscribeToMFEvent<T = any>( // eslint-disable-line @typescript-eslint/no-explicit-any
  event: string,
  callback: (data: T) => void
): () => void {
  const handler = (e: Event) => {
    callback((e as CustomEvent).detail);
  };

  if (typeof window !== 'undefined') {
    window.addEventListener(event, handler);
    return () => window.removeEventListener(event, handler);
  }

  return () => {};
}
