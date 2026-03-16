import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

// Capture the subscribeToAuthChanges callback so tests can trigger it
let authChangeCallback: ((user: any) => void) | null = null; // eslint-disable-line @typescript-eslint/no-explicit-any
const mockLogEvent = vi.fn();
const mockIdentifyUser = vi.fn();
const mockClearUserIdentity = vi.fn();
const mockGetUserProfile = vi.fn().mockResolvedValue(null);
const mockRestoreUserData = vi.fn().mockReturnValue({ favoriteCities: [] });

vi.mock('../lib/firebase', () => ({
  subscribeToAuthChanges: (cb: (user: any) => void) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    authChangeCallback = cb;
    return () => {};
  },
  signInWithGoogle: vi.fn(),
  signInWithGoogleHint: vi.fn(),
  signInWithEmail: vi.fn(),
  signUpWithEmail: vi.fn(),
  resetPassword: vi.fn(),
  logOut: vi.fn(),
  getUserProfile: (...args: any[]) => mockGetUserProfile(...args), // eslint-disable-line @typescript-eslint/no-explicit-any
  updateStockWatchlist: vi.fn(),
  updatePodcastSubscriptions: vi.fn(),
  updateUserBabyDueDate: vi.fn(),
  identifyUser: (...args: any[]) => mockIdentifyUser(...args), // eslint-disable-line @typescript-eslint/no-explicit-any
  clearUserIdentity: (...args: any[]) => mockClearUserIdentity(...args), // eslint-disable-line @typescript-eslint/no-explicit-any
  logEvent: (...args: any[]) => mockLogEvent(...args), // eslint-disable-line @typescript-eslint/no-explicit-any
}));

vi.mock('../context/restoreUserData', () => ({
  restoreUserData: (...args: any[]) => mockRestoreUserData(...args), // eslint-disable-line @typescript-eslint/no-explicit-any
}));

vi.mock('../hooks/useKnownAccounts', () => ({
  useKnownAccounts: () => ({
    accounts: [],
    addOrUpdate: vi.fn(),
    remove: vi.fn(),
  }),
}));

vi.mock('../hooks/useFirestoreSync', () => ({
  useFirestoreSync: () => {},
}));

vi.mock('../hooks/useCityManager', () => ({
  useCityManager: () => ({
    recentCities: [],
    favoriteCities: [],
    setFavoriteCities: vi.fn(),
    addCity: vi.fn(),
    removeCity: vi.fn(),
    clearCities: vi.fn(),
    toggleFavorite: vi.fn(),
  }),
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

vi.mock('@mycircle/shared', () => ({
  WindowEvents: {
    AUTH_STATE_CHANGED: 'auth-state-changed',
    WATCHLIST_CHANGED: 'watchlist-changed',
    PODCAST_SUBSCRIPTIONS_CHANGED: 'podcast-subscriptions-changed',
    BABY_DUE_DATE_CHANGED: 'baby-due-date-changed',
    UNITS_CHANGED: 'units-changed',
    LAST_PLAYED_CHANGED: 'last-played-changed',
    BOOK_LAST_PLAYED_CHANGED: 'book-last-played-changed',
    BENCHMARK_CHANGED: 'benchmark-changed',
    CLOUD_FILES_CHANGED: 'cloud-files-changed',
    WIDGET_LAYOUT_CHANGED: 'widget-layout-changed',
    CHILDREN_CHANGED: 'children-changed',
  },
  StorageKeys: {},
  getApolloClient: () => ({ resetStore: vi.fn() }),
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

const mockGoogleUser = {
  uid: 'user-123',
  providerData: [{ providerId: 'google.com' }],
};

const mockEmailUser = {
  uid: 'user-456',
  providerData: [{ providerId: 'password' }],
};

function TestConsumer() {
  const auth = useAuth();
  return <div data-testid="loading">{String(auth.loading)}</div>;
}

function renderAuth() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authChangeCallback = null;
    mockGetUserProfile.mockResolvedValue(null);
    mockRestoreUserData.mockReturnValue({ favoriteCities: [] });
  });

  it('calls logEvent("login") when a user signs in via Google', async () => {
    renderAuth();

    await act(async () => {
      await authChangeCallback?.(mockGoogleUser);
    });

    expect(mockLogEvent).toHaveBeenCalledWith('login', { method: 'google' });
  });

  it('calls logEvent("login") with method "email" for password sign-in', async () => {
    renderAuth();

    await act(async () => {
      await authChangeCallback?.(mockEmailUser);
    });

    expect(mockLogEvent).toHaveBeenCalledWith('login', { method: 'email' });
  });

  it('calls identifyUser with uid and sign_in_method on login', async () => {
    renderAuth();

    await act(async () => {
      await authChangeCallback?.(mockGoogleUser);
    });

    expect(mockIdentifyUser).toHaveBeenCalledWith('user-123', { sign_in_method: 'google' });
  });

  it('does not call logEvent when user signs out', async () => {
    renderAuth();

    await act(async () => {
      await authChangeCallback?.(null);
    });

    expect(mockLogEvent).not.toHaveBeenCalled();
    expect(mockClearUserIdentity).toHaveBeenCalled();
  });

  it('sets loading to false after auth state resolves', async () => {
    const { getByTestId } = renderAuth();
    expect(getByTestId('loading').textContent).toBe('true');

    await act(async () => {
      await authChangeCallback?.(null);
    });

    await waitFor(() => {
      expect(getByTestId('loading').textContent).toBe('false');
    });
  });

  it('loads user profile after sign-in', async () => {
    const mockProfile = { isAdmin: false, favoriteCities: [], darkMode: false };
    mockGetUserProfile.mockResolvedValue(mockProfile);
    renderAuth();

    await act(async () => {
      await authChangeCallback?.(mockGoogleUser);
    });

    expect(mockGetUserProfile).toHaveBeenCalledWith('user-123');
  });
});
