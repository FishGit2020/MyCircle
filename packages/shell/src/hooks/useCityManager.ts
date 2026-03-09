import { useCallback, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  FavoriteCity,
  RecentCity,
  toggleFavoriteCity,
  getUserProfile,
  logEvent,
} from '../lib/firebase';
import { StorageKeys, eventBus, MFEvents } from '@mycircle/shared';

const MAX_RECENTS = 10;

function loadLocalRecents(): RecentCity[] {
  try {
    const stored = localStorage.getItem(StorageKeys.RECENT_CITIES);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveLocalRecents(cities: RecentCity[]) {
  try {
    localStorage.setItem(StorageKeys.RECENT_CITIES, JSON.stringify(cities.slice(0, MAX_RECENTS)));
  } catch { /* ignore */ }
}

export interface CityManagerResult {
  recentCities: RecentCity[];
  favoriteCities: FavoriteCity[];
  addCity: (city: Omit<RecentCity, 'searchedAt'>) => Promise<void>;
  removeCity: (cityId: string) => Promise<void>;
  clearCities: () => Promise<void>;
  toggleFavorite: (city: FavoriteCity) => Promise<boolean>;
  /** Internal setter — not exposed through AuthContext */
  setRecentCities: React.Dispatch<React.SetStateAction<RecentCity[]>>;
  /** Internal setter — not exposed through AuthContext */
  setFavoriteCities: React.Dispatch<React.SetStateAction<FavoriteCity[]>>;
}

export function useCityManager(user: User | null): CityManagerResult {
  const [recentCities, setRecentCities] = useState<RecentCity[]>(loadLocalRecents);
  const [favoriteCities, setFavoriteCities] = useState<FavoriteCity[]>([]);

  // Refresh state when CitySearch MFE selects a city and updates localStorage
  useEffect(() => {
    const unsubscribe = eventBus.subscribe(MFEvents.CITY_SELECTED, () => {
      setRecentCities(loadLocalRecents());
    });
    return () => unsubscribe();
  }, []);

  const addCity = useCallback(async (city: Omit<RecentCity, 'searchedAt'>) => {
    const prev = loadLocalRecents();
    const filtered = prev.filter(c => c.id !== city.id);
    const updated: RecentCity[] = [
      { ...city, searchedAt: new Date() },
      ...filtered,
    ].slice(0, MAX_RECENTS);
    saveLocalRecents(updated);
    setRecentCities(updated);
    logEvent('city_searched', { city_name: city.name, city_country: city.country });
  }, []);

  const removeCity = useCallback(async (cityId: string) => {
    const updated = loadLocalRecents().filter(c => c.id !== cityId);
    saveLocalRecents(updated);
    setRecentCities(updated);
  }, []);

  const clearCities = useCallback(async () => {
    saveLocalRecents([]);
    setRecentCities([]);
  }, []);

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

  return {
    recentCities,
    favoriteCities,
    addCity,
    removeCity,
    clearCities,
    toggleFavorite,
    setRecentCities,
    setFavoriteCities,
  };
}
