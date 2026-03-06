import { useCallback, useState } from 'react';
import { User } from 'firebase/auth';
import {
  RecentCity,
  FavoriteCity,
  addRecentCity,
  removeRecentCity,
  clearRecentCities,
  toggleFavoriteCity,
  getRecentCities,
  getUserProfile,
  logEvent,
} from '../lib/firebase';

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
  const [recentCities, setRecentCities] = useState<RecentCity[]>([]);
  const [favoriteCities, setFavoriteCities] = useState<FavoriteCity[]>([]);

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
