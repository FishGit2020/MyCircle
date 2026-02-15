import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { WindowEvents, StorageKeys } from '@mycircle/shared';
import {
  subscribeToAuthChanges,
  signInWithGoogle,
  logOut,
  getUserProfile,
  updateUserDarkMode,
  updateUserLocale,
  updateUserTempUnit,
  updateUserSpeedUnit,
  addRecentCity,
  removeRecentCity,
  clearRecentCities,
  getRecentCities,
  toggleFavoriteCity,
  updateStockWatchlist,
  updatePodcastSubscriptions,
  updateUserBabyDueDate,
  updateUserBottomNavOrder,
  updateUserNotificationAlerts,
  identifyUser,
  clearUserIdentity,
  logEvent,
  UserProfile,
  RecentCity,
  FavoriteCity,
  WatchlistItem,
} from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  updateDarkMode: (darkMode: boolean) => Promise<void>;
  updateLocale: (locale: string) => Promise<void>;
  updateTempUnit: (unit: 'C' | 'F') => Promise<void>;
  updateSpeedUnit: (unit: 'ms' | 'mph' | 'kmh') => Promise<void>;
  addCity: (city: Omit<RecentCity, 'searchedAt'>) => Promise<void>;
  removeCity: (cityId: string) => Promise<void>;
  clearCities: () => Promise<void>;
  toggleFavorite: (city: FavoriteCity) => Promise<boolean>;
  syncStockWatchlist: (watchlist: WatchlistItem[]) => Promise<void>;
  syncPodcastSubscriptions: (subscriptionIds: string[]) => Promise<void>;
  syncBabyDueDate: (date: string | null) => Promise<void>;
  recentCities: RecentCity[];
  favoriteCities: FavoriteCity[];
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentCities, setRecentCities] = useState<RecentCity[]>([]);
  const [favoriteCities, setFavoriteCities] = useState<FavoriteCity[]>([]);

  const refreshProfile = async () => {
    if (user) {
      const userProfile = await getUserProfile(user.uid);
      setProfile(userProfile);
      if (userProfile) {
        setRecentCities(userProfile.recentCities || []);
        setFavoriteCities(userProfile.favoriteCities || []);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Link analytics sessions to this authenticated user
        identifyUser(firebaseUser.uid, {
          sign_in_method: 'google',
        });
        logEvent('login', { method: 'google' });

        const userProfile = await getUserProfile(firebaseUser.uid);
        setProfile(userProfile);
        if (userProfile) {
          setRecentCities(userProfile.recentCities || []);
          setFavoriteCities(userProfile.favoriteCities || []);

          // Restore saved preferences to localStorage so shared hooks pick them up
          if (userProfile.tempUnit) {
            localStorage.setItem(StorageKeys.TEMP_UNIT, userProfile.tempUnit);
            window.dispatchEvent(new Event(WindowEvents.UNITS_CHANGED));
          }
          if (userProfile.speedUnit) {
            localStorage.setItem(StorageKeys.SPEED_UNIT, userProfile.speedUnit);
            window.dispatchEvent(new Event(WindowEvents.UNITS_CHANGED));
          }

          // Restore stock watchlist
          if (userProfile.stockWatchlist && userProfile.stockWatchlist.length > 0) {
            localStorage.setItem(StorageKeys.STOCK_WATCHLIST, JSON.stringify(userProfile.stockWatchlist));
            window.dispatchEvent(new Event(WindowEvents.WATCHLIST_CHANGED));
          }

          // Restore podcast subscriptions
          if (userProfile.podcastSubscriptions && userProfile.podcastSubscriptions.length > 0) {
            localStorage.setItem(StorageKeys.PODCAST_SUBSCRIPTIONS, JSON.stringify(userProfile.podcastSubscriptions));
            window.dispatchEvent(new Event(WindowEvents.SUBSCRIPTIONS_CHANGED));
          }

          // Restore baby due date
          if (userProfile.babyDueDate) {
            localStorage.setItem(StorageKeys.BABY_DUE_DATE, userProfile.babyDueDate);
            window.dispatchEvent(new Event(WindowEvents.BABY_DUE_DATE_CHANGED));
          }

          // Restore bottom nav order
          if (userProfile.bottomNavOrder && userProfile.bottomNavOrder.length > 0) {
            localStorage.setItem(StorageKeys.BOTTOM_NAV_ORDER, JSON.stringify(userProfile.bottomNavOrder));
            window.dispatchEvent(new Event(WindowEvents.BOTTOM_NAV_ORDER_CHANGED));
          }

          // Restore notification alert preferences
          if (userProfile.weatherAlertsEnabled !== undefined) {
            localStorage.setItem(StorageKeys.WEATHER_ALERTS, String(userProfile.weatherAlertsEnabled));
          }
          if (userProfile.podcastAlertsEnabled !== undefined) {
            localStorage.setItem(StorageKeys.PODCAST_ALERTS, String(userProfile.podcastAlertsEnabled));
          }
          if (userProfile.announcementAlertsEnabled !== undefined) {
            localStorage.setItem(StorageKeys.ANNOUNCEMENT_ALERTS, String(userProfile.announcementAlertsEnabled));
          }
          window.dispatchEvent(new Event(WindowEvents.NOTIFICATION_ALERTS_CHANGED));
        }
      } else {
        clearUserIdentity();
        setProfile(null);
        setRecentCities([]);
        setFavoriteCities([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  };

  const signOutUser = async () => {
    try {
      await logOut();
      setProfile(null);
      setRecentCities([]);
      setFavoriteCities([]);
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  };

  const updateDarkMode = async (darkMode: boolean) => {
    if (user) {
      await updateUserDarkMode(user.uid, darkMode);
      setProfile((prev) => (prev ? { ...prev, darkMode } : null));
    }
  };

  const updateLocale = useCallback(async (locale: string) => {
    if (user) {
      await updateUserLocale(user.uid, locale);
      setProfile((prev) => (prev ? { ...prev, locale } : null));
    }
  }, [user]);

  const updateTempUnit = useCallback(async (tempUnit: 'C' | 'F') => {
    if (user) {
      await updateUserTempUnit(user.uid, tempUnit);
      setProfile((prev) => (prev ? { ...prev, tempUnit } : null));
    }
  }, [user]);

  const updateSpeedUnit = useCallback(async (speedUnit: 'ms' | 'mph' | 'kmh') => {
    if (user) {
      await updateUserSpeedUnit(user.uid, speedUnit);
      setProfile((prev) => (prev ? { ...prev, speedUnit } : null));
    }
  }, [user]);

  const addCity = useCallback(async (city: Omit<RecentCity, 'searchedAt'>) => {
    if (user) {
      await addRecentCity(user.uid, city);
      const cities = await getRecentCities(user.uid);
      setRecentCities(cities);
    }
    logEvent('city_searched', { city_name: city.name, city_country: city.country });
  }, [user]);

  const removeCity = useCallback(async (cityId: string) => {
    if (user) {
      await removeRecentCity(user.uid, cityId);
      const cities = await getRecentCities(user.uid);
      setRecentCities(cities);
    }
  }, [user]);

  const clearCities = useCallback(async () => {
    if (user) {
      await clearRecentCities(user.uid);
      setRecentCities([]);
    }
  }, [user]);

  const toggleFavorite = useCallback(async (city: FavoriteCity): Promise<boolean> => {
    if (user) {
      const isNowFavorite = await toggleFavoriteCity(user.uid, city);
      const updatedProfile = await getUserProfile(user.uid);
      if (updatedProfile) {
        setFavoriteCities(updatedProfile.favoriteCities || []);
      }
      return isNowFavorite;
    }
    return false;
  }, [user]);

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

  // Auto-sync baby due date changes from localStorage to Firestore
  useEffect(() => {
    function handleBabyDueDateChanged() {
      const date = localStorage.getItem(StorageKeys.BABY_DUE_DATE);
      if (user) {
        updateUserBabyDueDate(user.uid, date);
      }
    }
    window.addEventListener(WindowEvents.BABY_DUE_DATE_CHANGED, handleBabyDueDateChanged);
    return () => window.removeEventListener(WindowEvents.BABY_DUE_DATE_CHANGED, handleBabyDueDateChanged);
  }, [user]);

  // Auto-sync bottom nav order changes from localStorage to Firestore
  useEffect(() => {
    function handleBottomNavOrderChanged() {
      const stored = localStorage.getItem(StorageKeys.BOTTOM_NAV_ORDER);
      if (user) {
        try {
          const order = stored ? JSON.parse(stored) : null;
          updateUserBottomNavOrder(user.uid, order);
        } catch { /* ignore parse errors */ }
      }
    }
    window.addEventListener(WindowEvents.BOTTOM_NAV_ORDER_CHANGED, handleBottomNavOrderChanged);
    return () => window.removeEventListener(WindowEvents.BOTTOM_NAV_ORDER_CHANGED, handleBottomNavOrderChanged);
  }, [user]);

  // Auto-sync notification alert preferences from localStorage to Firestore
  useEffect(() => {
    function handleNotificationAlertsChanged() {
      if (user) {
        updateUserNotificationAlerts(user.uid, {
          weatherAlertsEnabled: localStorage.getItem(StorageKeys.WEATHER_ALERTS) === 'true',
          podcastAlertsEnabled: localStorage.getItem(StorageKeys.PODCAST_ALERTS) === 'true',
          announcementAlertsEnabled: localStorage.getItem(StorageKeys.ANNOUNCEMENT_ALERTS) === 'true',
        });
      }
    }
    window.addEventListener(WindowEvents.NOTIFICATION_ALERTS_CHANGED, handleNotificationAlertsChanged);
    return () => window.removeEventListener(WindowEvents.NOTIFICATION_ALERTS_CHANGED, handleNotificationAlertsChanged);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signOut: signOutUser,
        updateDarkMode,
        updateLocale,
        updateTempUnit,
        updateSpeedUnit,
        addCity,
        removeCity,
        clearCities,
        toggleFavorite,
        syncStockWatchlist,
        syncPodcastSubscriptions,
        syncBabyDueDate,
        recentCities,
        favoriteCities,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
