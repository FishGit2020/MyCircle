import { useState, useCallback } from 'react';
import { StorageKeys } from '@mycircle/shared';

export type ReaderTheme = 'default' | 'sepia' | 'night';

const THEME_STYLES: Record<ReaderTheme, Record<string, Record<string, string>>> = {
  default: {
    body: {
      'font-family': 'Georgia, serif',
      'line-height': '1.8',
      padding: '1rem',
      'text-align': 'justify',
    },
  },
  sepia: {
    body: {
      'font-family': 'Georgia, serif',
      'line-height': '1.8',
      padding: '1rem',
      'text-align': 'justify',
      background: '#f4ecd8',
      color: '#4a3728',
    },
    a: { color: '#7c4f2a' },
  },
  night: {
    body: {
      'font-family': 'Georgia, serif',
      'line-height': '1.8',
      padding: '1rem',
      'text-align': 'justify',
      background: '#1a1a2e',
      color: '#c8c8d4',
    },
    a: { color: '#60a5fa' },
  },
};

function loadTheme(): ReaderTheme {
  try {
    const stored = localStorage.getItem(StorageKeys.READER_THEME);
    if (stored === 'sepia' || stored === 'night' || stored === 'default') return stored;
  } catch { /* ignore */ }
  return 'default';
}

export function useReaderTheme() {
  const [theme, setThemeState] = useState<ReaderTheme>(loadTheme);

  const setTheme = useCallback((newTheme: ReaderTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(StorageKeys.READER_THEME, newTheme);
    } catch { /* ignore */ }
  }, []);

  // Returns the CSS rules object to pass to rendition.themes.default()
  // For 'default' theme: also respects system dark mode
  const getThemeStyles = useCallback((isDark: boolean) => {
    if (theme !== 'default') return THEME_STYLES[theme];
    const base = { ...THEME_STYLES.default };
    if (isDark) {
      return {
        ...base,
        body: { ...base.body, color: '#e5e7eb', background: '#1f2937' },
        a: { color: '#60a5fa' },
      };
    }
    return base;
  }, [theme]);

  const applyTheme = useCallback((
    rendition: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    isDark: boolean,
  ) => {
    try {
      rendition.themes.default(getThemeStyles(isDark));
    } catch { /* ignore */ }
  }, [getThemeStyles]);

  return { theme, setTheme, getThemeStyles, applyTheme };
}
