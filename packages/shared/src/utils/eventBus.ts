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
