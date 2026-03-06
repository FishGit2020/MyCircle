import { useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  UserProfile,
  updateUserDarkMode,
  updateUserLocale,
  updateUserTempUnit,
  updateUserSpeedUnit,
} from '../lib/firebase';

export interface PreferencesResult {
  updateDarkMode: (darkMode: boolean) => Promise<void>;
  updateLocale: (locale: string) => Promise<void>;
  updateTempUnit: (unit: 'C' | 'F') => Promise<void>;
  updateSpeedUnit: (unit: 'ms' | 'mph' | 'kmh') => Promise<void>;
}

export function usePreferences(
  user: User | null,
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>,
): PreferencesResult {
  const updateDarkMode = useCallback(async (darkMode: boolean) => {
    if (user) {
      await updateUserDarkMode(user.uid, darkMode);
      setProfile((prev) => (prev ? { ...prev, darkMode } : null));
    }
  }, [user, setProfile]);

  const updateLocale = useCallback(async (locale: string) => {
    if (user) {
      await updateUserLocale(user.uid, locale);
      setProfile((prev) => (prev ? { ...prev, locale } : null));
    }
  }, [user, setProfile]);

  const updateTempUnit = useCallback(async (tempUnit: 'C' | 'F') => {
    if (user) {
      await updateUserTempUnit(user.uid, tempUnit);
      setProfile((prev) => (prev ? { ...prev, tempUnit } : null));
    }
  }, [user, setProfile]);

  const updateSpeedUnit = useCallback(async (speedUnit: 'ms' | 'mph' | 'kmh') => {
    if (user) {
      await updateUserSpeedUnit(user.uid, speedUnit);
      setProfile((prev) => (prev ? { ...prev, speedUnit } : null));
    }
  }, [user, setProfile]);

  return { updateDarkMode, updateLocale, updateTempUnit, updateSpeedUnit };
}
