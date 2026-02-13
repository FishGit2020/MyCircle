import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
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
  getRecentCities,
  toggleFavoriteCity,
  updateStockWatchlist,
  updatePodcastSubscriptions,
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
  toggleFavorite: (city: FavoriteCity) => Promise<boolean>;
  syncStockWatchlist: (watchlist: WatchlistItem[]) => Promise<void>;
  syncPodcastSubscriptions: (subscriptionIds: string[]) => Promise<void>;
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
            localStorage.setItem('tempUnit', userProfile.tempUnit);
            window.dispatchEvent(new Event('units-changed'));
          }
          if (userProfile.speedUnit) {
            localStorage.setItem('speedUnit', userProfile.speedUnit);
            window.dispatchEvent(new Event('units-changed'));
          }

          // Restore stock watchlist
          if (userProfile.stockWatchlist && userProfile.stockWatchlist.length > 0) {
            localStorage.setItem('stock-tracker-watchlist', JSON.stringify(userProfile.stockWatchlist));
            window.dispatchEvent(new Event('watchlist-changed'));
          }

          // Restore podcast subscriptions
          if (userProfile.podcastSubscriptions && userProfile.podcastSubscriptions.length > 0) {
            localStorage.setItem('podcast-subscriptions', JSON.stringify(userProfile.podcastSubscriptions));
            window.dispatchEvent(new Event('subscriptions-changed'));
          }
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
        toggleFavorite,
        syncStockWatchlist,
        syncPodcastSubscriptions,
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
