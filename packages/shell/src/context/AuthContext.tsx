import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { WindowEvents, StorageKeys, getApolloClient, createLogger } from '@mycircle/shared';
import {
  subscribeToAuthChanges,
  signInWithGoogle,
  signInWithGoogleHint,
  signInWithEmail as firebaseSignInWithEmail,
  signUpWithEmail as firebaseSignUpWithEmail,
  resetPassword as firebaseResetPassword,
  logOut,
  getUserProfile,
  updateStockWatchlist,
  updatePodcastSubscriptions,
  updateUserBabyDueDate,
  identifyUser,
  clearUserIdentity,
  logEvent,
  UserProfile,
  RecentCity,
  FavoriteCity,
  WatchlistItem,
  KnownAccount,
} from '../lib/firebase';
import { useKnownAccounts } from '../hooks/useKnownAccounts';
import { useFirestoreSync } from '../hooks/useFirestoreSync';
import { useCityManager } from '../hooks/useCityManager';
import { usePreferences } from '../hooks/usePreferences';
import { restoreUserData } from './restoreUserData';

const logger = createLogger('AuthContext');

/** Keys preserved across sign-out (device-level prefs + account list) */
const keysToPreserve = new Set([
  StorageKeys.THEME,
  StorageKeys.LOCALE,
  StorageKeys.WEATHER_ALERTS,
  StorageKeys.ANNOUNCEMENT_ALERTS,
  StorageKeys.KNOWN_ACCOUNTS,
  StorageKeys.RECENT_CITIES,
]);

/** Clear user-specific localStorage and dispatch change events */
function clearUserSpecificStorage() {
  Object.values(StorageKeys).forEach((key) => {
    if (!keysToPreserve.has(key)) {
      localStorage.removeItem(key);
    }
  });
  window.dispatchEvent(new Event(WindowEvents.WATCHLIST_CHANGED));
  window.dispatchEvent(new Event(WindowEvents.SUBSCRIPTIONS_CHANGED));
  window.dispatchEvent(new Event(WindowEvents.WORSHIP_SONGS_CHANGED));
  window.dispatchEvent(new Event(WindowEvents.WORSHIP_FAVORITES_CHANGED));
  window.dispatchEvent(new Event(WindowEvents.NOTEBOOK_CHANGED));
  window.dispatchEvent(new Event(WindowEvents.BIBLE_BOOKMARKS_CHANGED));
  window.dispatchEvent(new Event(WindowEvents.FLASHCARD_PROGRESS_CHANGED));
  window.dispatchEvent(new Event(WindowEvents.DAILY_LOG_CHANGED));
  window.dispatchEvent(new Event(WindowEvents.CHILD_DATA_CHANGED));
  window.dispatchEvent(new Event(WindowEvents.BABY_DUE_DATE_CHANGED));
  window.dispatchEvent(new Event(WindowEvents.UNITS_CHANGED));
  window.dispatchEvent(new Event(WindowEvents.LAST_PLAYED_CHANGED));
  window.dispatchEvent(new Event(WindowEvents.BOOK_LAST_PLAYED_CHANGED));
  window.dispatchEvent(new Event(WindowEvents.BENCHMARK_CHANGED));
  window.dispatchEvent(new Event(WindowEvents.CLOUD_FILES_CHANGED));
  window.dispatchEvent(new Event(WindowEvents.WIDGET_LAYOUT_CHANGED));
  window.dispatchEvent(new Event(WindowEvents.CHILDREN_CHANGED));
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateDarkMode: (darkMode: boolean) => Promise<void>;
  updateTheme: (theme: 'light' | 'dark' | 'auto') => Promise<void>;
  updateLocale: (locale: string) => Promise<void>;
  updateTempUnit: (unit: 'C' | 'F') => Promise<void>;
  updateSpeedUnit: (unit: 'ms' | 'mph' | 'kmh') => Promise<void>;
  updateDistanceUnit: (unit: 'km' | 'mi') => Promise<void>;
  updateUnitSystem: (system: 'us' | 'metric') => Promise<void>;
  addCity: (city: Omit<RecentCity, 'searchedAt'>) => Promise<void>;
  removeCity: (cityId: string) => Promise<void>;
  clearCities: () => Promise<void>;
  toggleFavorite: (city: FavoriteCity) => Promise<boolean>;
  favoritesCapReached: boolean;
  syncStockWatchlist: (watchlist: WatchlistItem[]) => Promise<void>;
  syncPodcastSubscriptions: (subscriptionIds: string[]) => Promise<void>;
  syncBabyDueDate: (date: string | null) => Promise<void>;
  recentCities: RecentCity[];
  favoriteCities: FavoriteCity[];
  refreshProfile: () => Promise<void>;
  knownAccounts: KnownAccount[];
  switchToAccount: (account: KnownAccount, password?: string) => Promise<void>;
  removeKnownAccount: (uid: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { accounts: knownAccounts, addOrUpdate, remove: removeKnownAccount } = useKnownAccounts();

  const cityManager = useCityManager(user);
  const preferences = usePreferences(user, setProfile);
  useFirestoreSync(user);

  const refreshProfile = async () => {
    if (user) {
      const userProfile = await getUserProfile(user.uid);
      setProfile(userProfile);
      window.__isAdmin = userProfile?.isAdmin ?? false;
      if (userProfile) {
        cityManager.setFavoriteCities(userProfile.favoriteCities || []);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        addOrUpdate(firebaseUser);

        const method = firebaseUser.providerData[0]?.providerId === 'password' ? 'email' : 'google';
        identifyUser(firebaseUser.uid, { sign_in_method: method });
        logEvent('login', { method });

        clearUserSpecificStorage();

        const userProfile = await getUserProfile(firebaseUser.uid);
        setProfile(userProfile);
        window.__isAdmin = userProfile?.isAdmin ?? false;
        if (userProfile) {
          const { favoriteCities } = restoreUserData(userProfile, firebaseUser.uid);
          cityManager.setFavoriteCities(favoriteCities);
        }
        window.dispatchEvent(new Event(WindowEvents.AUTH_STATE_CHANGED));
      } else {
        clearUserIdentity();
        setProfile(null);
        cityManager.setFavoriteCities([]);
        window.dispatchEvent(new Event(WindowEvents.AUTH_STATE_CHANGED));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      logger.error('Sign in failed:', error);
      throw error;
    }
  };

  const signInWithEmailFn = async (email: string, password: string) => {
    try {
      await firebaseSignInWithEmail(email, password);
    } catch (error) {
      logger.error('Email sign in failed:', error);
      throw error;
    }
  };

  const signUpWithEmailFn = async (email: string, password: string, displayName?: string) => {
    try {
      await firebaseSignUpWithEmail(email, password, displayName);
    } catch (error) {
      logger.error('Email sign up failed:', error);
      throw error;
    }
  };

  const resetPasswordFn = async (email: string) => {
    try {
      await firebaseResetPassword(email);
    } catch (error) {
      logger.error('Password reset failed:', error);
      throw error;
    }
  };

  const signOutUser = async () => {
    try {
      await logOut();
      clearUserSpecificStorage();
      window.dispatchEvent(new Event(WindowEvents.AUTH_STATE_CHANGED));

      await getApolloClient().clearStore();

      setProfile(null);
      cityManager.setFavoriteCities([]);
    } catch (error) {
      logger.error('Sign out failed:', error);
      throw error;
    }
  };

  const switchToAccount = async (account: KnownAccount, password?: string) => {
    if (account.providerId === 'google.com') {
      await signInWithGoogleHint(account.email!);
    } else {
      if (!password) throw new Error('Password required for email accounts');
      await firebaseSignInWithEmail(account.email!, password);
    }
  };

  const syncStockWatchlist = useCallback(async (watchlist: WatchlistItem[]) => {
    if (user) {
      await updateStockWatchlist(user.uid, watchlist);
    }
  }, [user]);

  const syncPodcastSubscriptions = useCallback(async (subscriptionIds: string[]) => {
    if (user) {
      await updatePodcastSubscriptions(user.uid, subscriptionIds);
    }
  }, [user]);

  const syncBabyDueDate = useCallback(async (date: string | null) => {
    if (user) {
      await updateUserBabyDueDate(user.uid, date);
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signInWithEmail: signInWithEmailFn,
        signUpWithEmail: signUpWithEmailFn,
        resetPassword: resetPasswordFn,
        signOut: signOutUser,
        updateDarkMode: preferences.updateDarkMode,
        updateTheme: preferences.updateTheme,
        updateLocale: preferences.updateLocale,
        updateTempUnit: preferences.updateTempUnit,
        updateSpeedUnit: preferences.updateSpeedUnit,
        updateDistanceUnit: preferences.updateDistanceUnit,
        updateUnitSystem: preferences.updateUnitSystem,
        addCity: cityManager.addCity,
        removeCity: cityManager.removeCity,
        clearCities: cityManager.clearCities,
        toggleFavorite: cityManager.toggleFavorite,
        favoritesCapReached: cityManager.favoritesCapReached,
        syncStockWatchlist,
        syncPodcastSubscriptions,
        syncBabyDueDate,
        recentCities: cityManager.recentCities,
        favoriteCities: cityManager.favoriteCities,
        refreshProfile,
        knownAccounts,
        switchToAccount,
        removeKnownAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
