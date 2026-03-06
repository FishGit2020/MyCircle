import { useState, useCallback, useMemo } from 'react';
import { useTranslation, useChildren, getAgeInMonths, getAgeRemainingDays, useVerseOfDay, parseVerseReference, PageContent, ChildSelector } from '@mycircle/shared';
import type { Child } from '@mycircle/shared';
import { Link } from 'react-router';
import { getAgeRangeForMonths } from '../data/milestones';
import { parentingVerses } from '../data/parentingVerses';
import TimelineView from './TimelineView';

// ─── Verse Section ───────────────────────────────────────────────────────────

function VerseSection() {
  const { t } = useTranslation();
  const { reference, text, loading, shuffle } = useVerseOfDay(parentingVerses, (key) => t(key as any));

  return (
    <div className="bg-amber-50/50 dark:bg-amber-900/10 rounded-lg p-4 mb-6 min-h-[56px]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          {loading ? (
            <div className="h-4 bg-amber-200 dark:bg-amber-800/40 rounded animate-pulse w-3/4" />
          ) : text ? (
            <p className="text-sm italic text-amber-700 dark:text-amber-300 leading-relaxed">
              &ldquo;{text}&rdquo;
            </p>
          ) : null}
          <p className={`text-xs text-amber-600 dark:text-amber-400 font-medium ${text || loading ? 'mt-1' : ''}`}>
            — {reference}
          </p>
          {(() => {
            const parsed = parseVerseReference(reference);
            if (!parsed) return null;
            return (
              <Link
                to={`/bible?book=${encodeURIComponent(parsed.book)}&chapter=${parsed.chapter}`}
                className="inline-block mt-2 text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 transition-colors"
              >
                {t('bible.readChapter')} &rarr;
              </Link>
            );
          })()}
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
  const { children, selectedChild, selectedId, setSelectedId, addChild } = useChildren([0, 60]);
  const [isAdding, setIsAdding] = useState(false);
  const [inputName, setInputName] = useState('');
  const [inputBirthDate, setInputBirthDate] = useState('');

  // Computed from selected child
  const ageInMonths = useMemo(() => {
    if (!selectedChild) return null;
    return getAgeInMonths(selectedChild.birthDate);
  }, [selectedChild]);

  const ageInDays = useMemo(() => {
    if (!selectedChild) return 0;
    return getAgeRemainingDays(selectedChild.birthDate);
  }, [selectedChild]);

  const currentAgeRange = useMemo(() => {
    if (ageInMonths === null) return null;
    return getAgeRangeForMonths(ageInMonths) || null;
  }, [ageInMonths]);

  const ageDisplay = useMemo(() => {
    if (ageInMonths === null) return '';
    if (ageInMonths < 24) {
      const base = t('childDev.monthsOld' as any).replace('{months}', String(ageInMonths));
      if (ageInDays > 0) {
        return base + ', ' + t('childDev.daysCount' as any).replace('{days}', String(ageInDays));
      }
      return base;
    }
    const years = Math.floor(ageInMonths / 12);
    const months = ageInMonths % 12;
    const base = t('childDev.yearsMonthsOld' as any).replace('{years}', String(years)).replace('{months}', String(months));
    if (ageInDays > 0) {
      return base + ', ' + t('childDev.daysCount' as any).replace('{days}', String(ageInDays));
    }
    return base;
  }, [ageInMonths, ageInDays, t]);

  const saveChild = useCallback(async () => {
    if (!inputName.trim() || !inputBirthDate) return;
    const child: Omit<Child, 'id'> = { name: inputName.trim(), birthDate: inputBirthDate };
    await addChild(child);
    setInputName('');
    setInputBirthDate('');
    setIsAdding(false);
    window.__logAnalyticsEvent?.('child_info_save');
  }, [inputName, inputBirthDate, addChild]);

  // ─── Add Child View ─────────────────────────────────────────────────────

  if (children.length === 0 || isAdding) {
    return (
      <PageContent maxWidth="md">
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
            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveChild}
                disabled={!inputName.trim() || !inputBirthDate}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {t('children.addChild' as any)}
              </button>
              {isAdding && (
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="py-2.5 px-4 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition-colors hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                  {t('children.cancel' as any)}
                </button>
              )}
            </div>
          </div>
        </div>
      </PageContent>
    );
  }

  // ─── Main View (Timeline Only) ─────────────────────────────────────────

  return (
    <PageContent maxWidth="4xl">
      {/* Child Selector */}
      {children.length > 0 && (
        <div className="mb-4">
          <ChildSelector
            children={children}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onAdd={() => setIsAdding(true)}
          />
        </div>
      )}

      {/* Header */}
      {selectedChild && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                {selectedChild.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{ageDisplay}</p>
            </div>
          </div>

          {/* Verse */}
          <VerseSection />

          {/* Timeline (the primary and only view) */}
          <TimelineView
            ageInMonths={ageInMonths}
            currentAgeRange={currentAgeRange}
          />
        </>
      )}
    </PageContent>
  );
}
