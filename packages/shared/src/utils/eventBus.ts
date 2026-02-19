// Event bus for micro frontend communication
type EventCallback = (data: any) => void;

interface EventBus {
  subscribe: (event: string, callback: EventCallback) => () => void;
  publish: (event: string, data?: any) => void;
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
  CHINESE_PROGRESS_CHANGED: 'chinese-progress-changed',
  ENGLISH_PROGRESS_CHANGED: 'english-progress-changed',
  CHINESE_CHARACTERS_CHANGED: 'chinese-characters-changed',
  FLASHCARD_PROGRESS_CHANGED: 'flashcard-progress-changed',
  WORK_TRACKER_CHANGED: 'work-tracker-changed',
} as const;

// Centralized localStorage keys to avoid typo-prone string literals
export const StorageKeys = {
  TEMP_UNIT: 'tempUnit',
  SPEED_UNIT: 'speedUnit',
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
  CHINESE_LEARNING_PROGRESS: 'chinese-learning-progress',
  ENGLISH_LEARNING_PROGRESS: 'english-learning-progress',
  CHINESE_CHARACTERS_CACHE: 'chinese-characters-cache',
  FLASHCARD_BIBLE_CARDS: 'flashcard-bible-cards',
  FLASHCARD_CUSTOM_CARDS: 'flashcard-custom-cards',
  FLASHCARD_PROGRESS: 'flashcard-progress',
  WORK_TRACKER_CACHE: 'work-tracker-cache',
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

  publish(event: string, data?: any): void {
    // Emit custom DOM event for cross-microfrontend communication
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(event, { detail: data }));
    }

    // Also notify local listeners
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
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
export function subscribeToMFEvent<T = any>(
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
