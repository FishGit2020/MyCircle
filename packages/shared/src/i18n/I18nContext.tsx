import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { translations, Locale, TranslationKey } from './translations';
import { StorageKeys } from '../utils/eventBus';

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  try {
    const stored = localStorage.getItem(StorageKeys.LOCALE);
    if (stored === 'en' || stored === 'es' || stored === 'zh') return stored;
  } catch { /* ignore */ }
  // Auto-detect from browser
  const browserLang = navigator.language.slice(0, 2);
  if (browserLang === 'es') return 'es';
  if (browserLang === 'zh') return 'zh';
  return 'en';
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(StorageKeys.LOCALE, newLocale);
    } catch { /* ignore */ }
  }, []);

  const t = useCallback((key: TranslationKey): string => {
    return translations[locale][key] ?? translations.en[key] ?? key;
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    // Fallback for components outside I18nProvider (e.g. micro frontends not wrapped)
    return {
      locale: 'en' as Locale,
      setLocale: () => {},
      t: (key: TranslationKey) => translations.en[key] ?? key,
    };
  }
  return context;
}
