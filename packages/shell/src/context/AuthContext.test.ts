import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

const mockLogEvent = vi.fn();
const mockIdentifyUser = vi.fn();
const mockClearUserIdentity = vi.fn();
const mockGetUserProfile = vi.fn().mockResolvedValue(null);
const mockToggleFavoriteCity = vi.fn().mockResolvedValue(false);
const mockGetApolloClient = vi.fn().mockReturnValue({ clearStore: vi.fn().mockResolvedValue(undefined) });

let authCallback: ((user: any) => void) | null = null;

vi.mock('../lib/firebase', () => ({
  firebaseEnabled: false,
  app: null,
  auth: null,
  db: null,
  perf: null,
  analytics: null,
  subscribeToAuthChanges: (cb: (user: any) => void) => {
    authCallback = cb;
    cb(null); // start signed out
    return () => {};
  },
  signInWithGoogle: vi.fn(),
  signInWithGoogleHint: vi.fn(),
  signInWithEmail: vi.fn(),
  signUpWithEmail: vi.fn(),
  resetPassword: vi.fn(),
  logOut: vi.fn(),
  getUserProfile: (...args: unknown[]) => mockGetUserProfile(...args),
  updateStockWatchlist: vi.fn(),
  updatePodcastSubscriptions: vi.fn(),
  updateUserBabyDueDate: vi.fn(),
  identifyUser: (...args: unknown[]) => mockIdentifyUser(...args),
  clearUserIdentity: (...args: unknown[]) => mockClearUserIdentity(...args),
  logEvent: (...args: unknown[]) => mockLogEvent(...args),
  toggleFavoriteCity: (...args: unknown[]) => mockToggleFavoriteCity(...args),
  updateUserTheme: vi.fn(),
  updateUserTempUnit: vi.fn(),
  updateUserSpeedUnit: vi.fn(),
  updateUserDistanceUnit: vi.fn(),
  updateUserLocale: vi.fn(),
}));

vi.mock('@mycircle/shared', () => ({
  WindowEvents: {
    AUTH_STATE_CHANGED: 'auth-state-changed',
    WATCHLIST_CHANGED: 'watchlist-changed',
    SUBSCRIPTIONS_CHANGED: 'subscriptions-changed',
    WORSHIP_SONGS_CHANGED: 'worship-songs-changed',
    WORSHIP_FAVORITES_CHANGED: 'worship-favorites-changed',
    NOTEBOOK_CHANGED: 'notebook-changed',
    BIBLE_BOOKMARKS_CHANGED: 'bible-bookmarks-changed',
    FLASHCARD_PROGRESS_CHANGED: 'flashcard-progress-changed',
    DAILY_LOG_CHANGED: 'daily-log-changed',
    CHILD_DATA_CHANGED: 'child-data-changed',
    BABY_DUE_DATE_CHANGED: 'baby-due-date-changed',
    UNITS_CHANGED: 'units-changed',
    LAST_PLAYED_CHANGED: 'last-played-changed',
    BOOK_LAST_PLAYED_CHANGED: 'book-last-played-changed',
    BENCHMARK_CHANGED: 'benchmark-changed',
    CLOUD_FILES_CHANGED: 'cloud-files-changed',
    WIDGET_LAYOUT_CHANGED: 'widget-layout-changed',
    CHILDREN_CHANGED: 'children-changed',
    RECENT_CITIES: 'recent-cities',
    CITY_SELECTED: 'city-selected',
  },
  StorageKeys: {
    THEME: 'theme',
    LOCALE: 'locale',
    WEATHER_ALERTS: 'weather-alerts',
    ANNOUNCEMENT_ALERTS: 'announcement-alerts',
    KNOWN_ACCOUNTS: 'known-accounts',
    RECENT_CITIES: 'recent-cities',
    WIDGET_LAYOUT: 'widget-dashboard-layout',
  },
  getApolloClient: () => mockGetApolloClient(),
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
  eventBus: { subscribe: vi.fn(() => vi.fn()), publish: vi.fn() },
  MFEvents: { CITY_SELECTED: 'city_selected' },
}));

vi.mock('./restoreUserData', () => ({
  restoreUserData: vi.fn().mockReturnValue({ favoriteCities: [] }),
}));

vi.mock('../hooks/useKnownAccounts', () => ({
  useKnownAccounts: () => ({ accounts: [], addOrUpdate: vi.fn(), remove: vi.fn() }),
}));

vi.mock('../hooks/useFirestoreSync', () => ({
  useFirestoreSync: vi.fn(),
}));

vi.mock('../hooks/usePreferences', () => ({
  usePreferences: () => ({
    updateDarkMode: vi.fn(),
    updateTheme: vi.fn(),
    updateLocale: vi.fn(),
    updateTempUnit: vi.fn(),
    updateSpeedUnit: vi.fn(),
    updateDistanceUnit: vi.fn(),
    updateUnitSystem: vi.fn(),
  }),
}));

import { AuthProvider, useAuth } from './AuthContext';

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(AuthProvider, null, children);

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  authCallback = null;
});

describe('AuthContext', () => {
  it('calls logEvent with login on sign-in', async () => {
    renderHook(() => useAuth(), { wrapper });

    // Simulate user signing in
    await act(async () => {
      authCallback?.({
        uid: 'user123',
        providerData: [{ providerId: 'google.com' }],
      });
    });

    expect(mockLogEvent).toHaveBeenCalledWith('login', { method: 'google' });
  });

  it('calls identifyUser on sign-in', async () => {
    renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      authCallback?.({
        uid: 'user123',
        providerData: [{ providerId: 'password' }],
      });
    });

    expect(mockIdentifyUser).toHaveBeenCalledWith('user123', { sign_in_method: 'email' });
    expect(mockLogEvent).toHaveBeenCalledWith('login', { method: 'email' });
  });

  it('sets loading to false after auth resolves', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      authCallback?.(null);
    });

    expect(result.current.loading).toBe(false);
  });
});
