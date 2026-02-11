import React, { useEffect, useRef } from 'react';
import { useTranslation, Locale } from '@weather/shared';
import { useAuth } from '../context/AuthContext';

const LOCALES: { value: Locale; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'es', label: 'ES' },
];

export default function LanguageSelector() {
  const { locale, setLocale } = useTranslation();
  const { user, profile, updateLocale } = useAuth();
  const initialSyncDone = useRef(false);

  // On sign-in, load locale from profile if available
  useEffect(() => {
    if (user && profile?.locale && !initialSyncDone.current) {
      const profileLocale = profile.locale as Locale;
      if ((profileLocale === 'en' || profileLocale === 'es') && profileLocale !== locale) {
        setLocale(profileLocale);
      }
      initialSyncDone.current = true;
    }
    if (!user) {
      initialSyncDone.current = false;
    }
  }, [user, profile, locale, setLocale]);

  const handleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    if (user) {
      updateLocale(newLocale);
    }
  };

  return (
    <select
      value={locale}
      onChange={(e) => handleChange(e.target.value as Locale)}
      className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      aria-label="Select language"
    >
      {LOCALES.map((l) => (
        <option key={l.value} value={l.value}>
          {l.label}
        </option>
      ))}
    </select>
  );
}
