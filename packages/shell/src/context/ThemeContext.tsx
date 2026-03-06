import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { StorageKeys } from '@mycircle/shared';

export type Theme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setThemeMode: (theme: Theme) => void;
  setThemeFromProfile: (darkMode: boolean, profileTheme?: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(StorageKeys.THEME);
      if (stored === 'light' || stored === 'dark' || stored === 'auto') return stored;
    }
    return 'auto';
  });

  useEffect(() => {
    const root = document.documentElement;
    function applyDark(dark: boolean) {
      if (dark) root.classList.add('dark');
      else root.classList.remove('dark');
    }
    localStorage.setItem(StorageKeys.THEME, theme);
    if (theme === 'auto') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      applyDark(mq.matches);
      const listener = (e: MediaQueryListEvent) => applyDark(e.matches);
      mq.addEventListener('change', listener);
      return () => mq.removeEventListener('change', listener);
    } else {
      applyDark(theme === 'dark');
    }
  }, [theme]);

  // Cycles light → dark → auto → light (for keyboard shortcut)
  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : prev === 'dark' ? 'auto' : 'light');
  }, []);

  const setThemeMode = useCallback((t: Theme) => setTheme(t), []);

  const setThemeFromProfile = useCallback((darkMode: boolean, profileTheme?: Theme) => {
    if (profileTheme === 'light' || profileTheme === 'dark' || profileTheme === 'auto') {
      setTheme(profileTheme);
    } else {
      setTheme(darkMode ? 'dark' : 'light');
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setThemeMode, setThemeFromProfile }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
