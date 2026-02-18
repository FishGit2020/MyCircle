import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation, Locale } from '@mycircle/shared';
import { useAuth } from '../../context/AuthContext';
import { logEvent } from '../../lib/firebase';

const LOCALES: { value: Locale; labelKey: string; flag: string }[] = [
  { value: 'en', labelKey: 'language.en', flag: '🇺🇸' },
  { value: 'es', labelKey: 'language.es', flag: '🇪🇸' },
  { value: 'zh', labelKey: 'language.zh', flag: '🇨🇳' },
];

export default function LanguageSelector() {
  const { locale, setLocale, t } = useTranslation();
  const { user, profile, updateLocale } = useAuth();
  const initialSyncDone = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // On sign-in, load locale from profile if available
  useEffect(() => {
    if (user && profile?.locale && !initialSyncDone.current) {
      const profileLocale = profile.locale as Locale;
      if ((profileLocale === 'en' || profileLocale === 'es' || profileLocale === 'zh') && profileLocale !== locale) {
        setLocale(profileLocale);
      }
      initialSyncDone.current = true;
    }
    if (!user) {
      initialSyncDone.current = false;
    }
  }, [user, profile, locale, setLocale]);

  // Outside-click dismissal
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Escape key dismissal
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleChange = useCallback((newLocale: Locale) => {
    setLocale(newLocale);
    logEvent('language_change', { locale: newLocale });
    if (user) {
      updateLocale(newLocale);
    }
    setIsOpen(false);
  }, [setLocale, user, updateLocale]);

  const currentLocale = LOCALES.find((l) => l.value === locale);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={t('language.label')}
        className="flex items-center gap-1 p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.6 9h16.8M3.6 15h16.8" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3a15 15 0 0 1 4 9 15 15 0 0 1-4 9 15 15 0 0 1-4-9 15 15 0 0 1 4-9Z" />
        </svg>
        <span className="text-xs font-medium">{currentLocale?.value.toUpperCase()}</span>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
        >
          <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              {t('language.label')}
            </span>
          </div>
          {LOCALES.map((l) => {
            const active = l.value === locale;
            return (
              <button
                key={l.value}
                role="menuitem"
                type="button"
                onClick={() => handleChange(l.value)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span>{l.flag}</span>
                <span className="flex-1 text-left">{t(l.labelKey)}</span>
                {active && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
