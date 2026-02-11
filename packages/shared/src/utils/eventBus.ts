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
  USER_LOCATION_CHANGED: 'mf:user-location-changed'
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
