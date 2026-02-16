import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeSync() {
  const { profile, loading } = useAuth();
  const { setThemeFromProfile } = useTheme();

  useEffect(() => {
    if (!loading && profile) {
      setThemeFromProfile(profile.darkMode);
    }
  }, [profile, loading, setThemeFromProfile]);

  return null;
}
