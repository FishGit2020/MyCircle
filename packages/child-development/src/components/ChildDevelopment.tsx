import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation, StorageKeys, WindowEvents, useVerseOfDay } from '@mycircle/shared';
import { getAgeRangeForMonths } from '../data/milestones';
import { parentingVerses } from '../data/parentingVerses';
import TimelineView from './TimelineView';

/**
 * Encode/decode sensitive values to avoid clear-text storage in localStorage.
 * Uses btoa/atob — minimal obfuscation suitable for client-side storage.
 */
function encodeSensitive(value: string): string {
  try { return btoa(value); } catch { return value; }
}
function decodeSensitive(value: string): string {
  try { return atob(value); } catch { return value; }
}

// ─── Verse Section ───────────────────────────────────────────────────────────

function VerseSection() {
  const { t } = useTranslation();
  const { reference, text, shuffle } = useVerseOfDay(parentingVerses, (key) => t(key as any));

  return (
    <div className="bg-amber-50/50 dark:bg-amber-900/10 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          {text && (
            <p className="text-sm italic text-amber-700 dark:text-amber-300 leading-relaxed">
              &ldquo;{text}&rdquo;
            </p>
          )}
          <p className={`text-xs text-amber-600 dark:text-amber-400 font-medium ${text ? 'mt-1' : ''}`}>
            — {reference}
          </p>
        </div>
        <button
          type="button"
          onClick={shuffle}
          className="flex-shrink-0 p-1.5 rounded-lg text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
          aria-label={t('childDev.shuffleVerse' as any)}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ChildDevelopment() {
  const { t } = useTranslation();

  // State
  const [childName, setChildName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [inputName, setInputName] = useState('');
  const [inputBirthDate, setInputBirthDate] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const storedName = localStorage.getItem(StorageKeys.CHILD_NAME);
    const storedDate = localStorage.getItem(StorageKeys.CHILD_BIRTH_DATE);
    if (storedName) { setChildName(storedName); setInputName(storedName); }
    if (storedDate) { const d = decodeSensitive(storedDate); setBirthDate(d); setInputBirthDate(d); }
  }, []);

  // Listen for external changes (Firestore sync)
  useEffect(() => {
    function handleDataChanged() {
      const storedName = localStorage.getItem(StorageKeys.CHILD_NAME);
      const storedDate = localStorage.getItem(StorageKeys.CHILD_BIRTH_DATE);
      if (storedName) { setChildName(storedName); setInputName(storedName); }
      else { setChildName(''); setInputName(''); }
      if (storedDate) { const d = decodeSensitive(storedDate); setBirthDate(d); setInputBirthDate(d); }
      else { setBirthDate(''); setInputBirthDate(''); }
    }
    window.addEventListener(WindowEvents.CHILD_DATA_CHANGED, handleDataChanged);
    return () => window.removeEventListener(WindowEvents.CHILD_DATA_CHANGED, handleDataChanged);
  }, []);

  // Computed
  const ageInMonths = useMemo(() => {
    if (!birthDate) return null;
    const birth = new Date(birthDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
    return Math.max(0, months);
  }, [birthDate]);

  const currentAgeRange = useMemo(() => {
    if (ageInMonths === null) return null;
    return getAgeRangeForMonths(ageInMonths) || null;
  }, [ageInMonths]);

  const ageDisplay = useMemo(() => {
    if (ageInMonths === null) return '';
    if (ageInMonths < 24) {
      return t('childDev.monthsOld' as any).replace('{months}', String(ageInMonths));
    }
    const years = Math.floor(ageInMonths / 12);
    const months = ageInMonths % 12;
    return t('childDev.yearsMonthsOld' as any).replace('{years}', String(years)).replace('{months}', String(months));
  }, [ageInMonths, t]);

  // Actions
  const saveChild = useCallback(() => {
    if (!inputName.trim() || !inputBirthDate) return;
    localStorage.setItem(StorageKeys.CHILD_NAME, inputName.trim());
    localStorage.setItem(StorageKeys.CHILD_BIRTH_DATE, encodeSensitive(inputBirthDate));
    setChildName(inputName.trim());
    setBirthDate(inputBirthDate);
    setIsEditing(false);
    window.dispatchEvent(new Event(WindowEvents.CHILD_DATA_CHANGED));
  }, [inputName, inputBirthDate]);

  // ─── Setup View ──────────────────────────────────────────────────────────

  if (!birthDate || isEditing) {
    return (
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            {t('childDev.title' as any)}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('childDev.subtitle' as any)}
          </p>
        </div>

        <VerseSection />

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="child-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('childDev.childName' as any)}
              </label>
              <input
                id="child-name"
                type="text"
                value={inputName}
                onChange={e => setInputName(e.target.value)}
                placeholder={t('childDev.childNamePlaceholder' as any)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
            <div>
              <label htmlFor="birth-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('childDev.birthDate' as any)}
              </label>
              <input
                id="birth-date"
                type="date"
                value={inputBirthDate}
                onChange={e => setInputBirthDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
            <button
              type="button"
              onClick={saveChild}
              disabled={!inputName.trim() || !inputBirthDate}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {isEditing ? t('childDev.saveChild' as any) : t('childDev.getStarted' as any)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main View (Timeline Only) ─────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            {childName}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">{ageDisplay}</p>
        </div>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="self-start sm:self-auto text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          {t('childDev.editChild' as any)}
        </button>
      </div>

      {/* Verse */}
      <VerseSection />

      {/* Timeline (the primary and only view) */}
      <TimelineView
        ageInMonths={ageInMonths}
        currentAgeRange={currentAgeRange}
      />
    </div>
  );
}
