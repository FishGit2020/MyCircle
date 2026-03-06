import { useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  UserProfile,
  updateUserDarkMode,
  updateUserTheme,
  updateUserLocale,
  updateUserTempUnit,
  updateUserSpeedUnit,
  updateUserDistanceUnit,
} from '../lib/firebase';

export interface PreferencesResult {
  updateDarkMode: (darkMode: boolean) => Promise<void>;
  updateTheme: (theme: 'light' | 'dark' | 'auto') => Promise<void>;
  updateLocale: (locale: string) => Promise<void>;
  updateTempUnit: (unit: 'C' | 'F') => Promise<void>;
  updateSpeedUnit: (unit: 'ms' | 'mph' | 'kmh') => Promise<void>;
  updateDistanceUnit: (unit: 'km' | 'mi') => Promise<void>;
  updateUnitSystem: (system: 'us' | 'metric') => Promise<void>;
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

  const updateTheme = useCallback(async (theme: 'light' | 'dark' | 'auto') => {
    if (user) {
      await updateUserTheme(user.uid, theme);
      setProfile((prev) => (prev ? { ...prev, theme } : null));
    }
  }, [user, setProfile]);

  const updateUnitSystem = useCallback(async (system: 'us' | 'metric') => {
    if (user) {
      const tempUnit = system === 'us' ? 'F' as const : 'C' as const;
      const speedUnit = system === 'us' ? 'mph' as const : 'kmh' as const;
      const distanceUnit = system === 'us' ? 'mi' as const : 'km' as const;
      await Promise.all([
        updateUserTempUnit(user.uid, tempUnit),
        updateUserSpeedUnit(user.uid, speedUnit),
        updateUserDistanceUnit(user.uid, distanceUnit),
      ]);
      setProfile((prev) => (prev ? { ...prev, tempUnit, speedUnit, distanceUnit } : null));
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

  const updateDistanceUnit = useCallback(async (distanceUnit: 'km' | 'mi') => {
    if (user) {
      await updateUserDistanceUnit(user.uid, distanceUnit);
      setProfile((prev) => (prev ? { ...prev, distanceUnit } : null));
    }
  }, [user, setProfile]);

  return { updateDarkMode, updateTheme, updateLocale, updateTempUnit, updateSpeedUnit, updateDistanceUnit, updateUnitSystem };
}
