import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation, StorageKeys, WindowEvents, useVerseOfDay } from '@mycircle/shared';
import { getGrowthDataForWeek, getTrimester, ComparisonCategory, developmentStages, getStageForWeek } from '../data/babyGrowthData';
import { pregnancyVerses } from '../data/pregnancyVerses';

function calculateGestationalAge(dueDateStr: string): { weeks: number; days: number; totalDays: number } {
  const dueDate = new Date(dueDateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysUntilDue = Math.round((dueDate.getTime() - today.getTime()) / msPerDay);
  const totalDays = 280 - daysUntilDue; // 40 weeks = 280 days
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  return { weeks, days, totalDays };
}

function getWeeksRemaining(dueDateStr: string): number {
  const dueDate = new Date(dueDateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.ceil((dueDate.getTime() - today.getTime()) / msPerWeek);
}

// Heart SVG icon used throughout the component
function HeartIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

export default function BabyTracker() {
  const { t } = useTranslation();
  const [dueDate, setDueDate] = useState<string>('');
  const [inputDate, setInputDate] = useState<string>('');
  const [compareCategory, setCompareCategory] = useState<ComparisonCategory>('fruit');
  const { reference: verseRef, text: verseText, loading: verseLoading, shuffle: shuffleVerse } = useVerseOfDay(pregnancyVerses);

  // Load due date from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(StorageKeys.BABY_DUE_DATE);
    if (stored) {
      setDueDate(stored);
      setInputDate(stored);
    }
  }, []);

  // Listen for external changes (e.g., Firestore restore on sign-in)
  useEffect(() => {
    function handleDueDateChanged() {
      const stored = localStorage.getItem(StorageKeys.BABY_DUE_DATE);
      if (stored) {
        setDueDate(stored);
        setInputDate(stored);
      } else {
        setDueDate('');
        setInputDate('');
      }
    }
    window.addEventListener(WindowEvents.BABY_DUE_DATE_CHANGED, handleDueDateChanged);
    return () => window.removeEventListener(WindowEvents.BABY_DUE_DATE_CHANGED, handleDueDateChanged);
  }, []);

  const saveDueDate = useCallback(() => {
    if (!inputDate) return;
    localStorage.setItem(StorageKeys.BABY_DUE_DATE, inputDate);
    setDueDate(inputDate);
    window.dispatchEvent(new Event(WindowEvents.BABY_DUE_DATE_CHANGED));
    window.__logAnalyticsEvent?.('baby_due_date_save');
  }, [inputDate]);

  const clearDueDate = useCallback(() => {
    localStorage.removeItem(StorageKeys.BABY_DUE_DATE);
    setDueDate('');
    setInputDate('');
    window.dispatchEvent(new Event(WindowEvents.BABY_DUE_DATE_CHANGED));
  }, []);

  // Computed pregnancy state
  const gestationalAge = useMemo(() => {
    if (!dueDate) return null;
    return calculateGestationalAge(dueDate);
  }, [dueDate]);

  const currentWeek = gestationalAge !== null ? gestationalAge.weeks : null;
  const currentDays = gestationalAge !== null ? gestationalAge.days : null;
  const weeksRemaining = dueDate ? getWeeksRemaining(dueDate) : null;

  const growthData = currentWeek !== null ? getGrowthDataForWeek(Math.min(Math.max(currentWeek, 1), 40)) : null;
  const trimester = currentWeek !== null && currentWeek >= 1 && currentWeek <= 40 ? getTrimester(currentWeek) : null;
  const progressPercent = currentWeek !== null ? Math.min(Math.max((currentWeek / 40) * 100, 0), 100) : 0;

  const trimesterLabel = trimester === 1 ? t('baby.trimester1')
    : trimester === 2 ? t('baby.trimester2')
    : trimester === 3 ? t('baby.trimester3')
    : '';

  // Determine edge case states
  const isPastDue = weeksRemaining !== null && weeksRemaining < 0;
  const isDueToday = weeksRemaining === 0;
  const isNotPregnantYet = currentWeek !== null && currentWeek < 0;
  const isValidPregnancy = currentWeek !== null && currentWeek >= 1 && currentWeek <= 40;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
          <HeartIcon className="w-6 h-6 text-pink-500" />
          {t('baby.title')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{t('baby.subtitle')}</p>
      </div>

      {/* Verse Section */}
      <section className="bg-pink-50 dark:bg-pink-900/10 rounded-xl p-5 border border-pink-200 dark:border-pink-800">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            {verseLoading ? (
              <div className="h-4 bg-pink-200 dark:bg-pink-800/40 rounded animate-pulse w-3/4" />
            ) : verseText ? (
              <p className="text-pink-800 dark:text-pink-200 italic leading-relaxed">
                &ldquo;{verseText}&rdquo;
              </p>
            ) : null}
            <p className={`text-pink-600 dark:text-pink-400 text-sm font-semibold ${verseText || verseLoading ? 'mt-2' : ''}`}>
              — {verseRef}
            </p>
          </div>
          <button
            onClick={shuffleVerse}
            className="shrink-0 p-2 rounded-lg text-pink-500 hover:bg-pink-100 dark:hover:bg-pink-800/40 transition-colors"
            aria-label={t('baby.shuffleVerse')}
            title={t('baby.shuffleVerse')}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </section>

      {/* Due Date Input */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          {t('baby.dueDate')}
        </h2>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={inputDate}
            onChange={(e) => setInputDate(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
            aria-label={t('baby.dueDate')}
          />
          <button
            onClick={saveDueDate}
            disabled={!inputDate}
            className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {t('baby.save')}
          </button>
          {dueDate && (
            <button
              onClick={clearDueDate}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors font-medium"
            >
              {t('baby.clear')}
            </button>
          )}
        </div>
      </section>

      {/* Growth Display */}
      {!dueDate && (
        <section className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
          <HeartIcon className="w-12 h-12 text-pink-300 dark:text-pink-700 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">{t('baby.noDueDate')}</p>
        </section>
      )}

      {isNotPregnantYet && (
        <section className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-5 border border-yellow-200 dark:border-yellow-800">
          <p className="text-yellow-700 dark:text-yellow-300 text-center">{t('baby.notPregnantYet')}</p>
        </section>
      )}

      {(isPastDue || isDueToday) && (
        <section className="bg-pink-50 dark:bg-pink-900/10 rounded-xl p-5 border border-pink-200 dark:border-pink-800 text-center">
          <div className="text-4xl mb-2">🎉</div>
          <p className="text-pink-700 dark:text-pink-300 font-semibold text-lg">
            {isDueToday ? t('baby.dueToday') : t('baby.congratulations')}
          </p>
          {isPastDue && weeksRemaining !== null && (
            <p className="text-pink-600 dark:text-pink-400 text-sm mt-1">
              {Math.abs(weeksRemaining)} {t('baby.weeksPast')}
            </p>
          )}
        </section>
      )}

      {isValidPregnancy && growthData && (
        <section className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm space-y-5">
          {/* Week + Trimester Header */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-3xl font-bold text-pink-600 dark:text-pink-400">
                {t('baby.week')} {currentWeek}
              </span>
              {currentDays !== null && currentDays > 0 && (
                <span className="text-lg font-semibold text-pink-400 dark:text-pink-500 ml-1">
                  +{currentDays}d
                </span>
              )}
              <span className="text-gray-400 dark:text-gray-500 mx-2">·</span>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {trimesterLabel}
              </span>
            </div>
            {weeksRemaining !== null && weeksRemaining > 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {weeksRemaining} {t('baby.weeksRemaining')}
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>{t('baby.progress')}</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div
              className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={Math.round(progressPercent)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t('baby.progress')}
            >
              <div
                className="h-full bg-gradient-to-r from-pink-400 to-pink-600 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {/* Trimester markers */}
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1 px-0.5">
              <span>T1</span>
              <span>T2</span>
              <span>T3</span>
            </div>
          </div>

          {/* Size Comparison */}
          <div className="text-center py-4 bg-pink-50 dark:bg-pink-900/10 rounded-lg">
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
              {t('baby.size')}
            </p>
            {/* Category toggle buttons */}
            <div className="flex justify-center gap-1.5 mb-3" role="radiogroup" aria-label={t('baby.compareCategory')}>
              {(['fruit', 'animal', 'vegetable'] as ComparisonCategory[]).map(cat => (
                <button
                  key={cat}
                  role="radio"
                  aria-checked={compareCategory === cat}
                  onClick={() => setCompareCategory(cat)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    compareCategory === cat
                      ? 'bg-pink-500 text-white dark:bg-pink-600'
                      : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-pink-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  {t(`baby.category${cat.charAt(0).toUpperCase() + cat.slice(1)}` as any)}
                </button>
              ))}
            </div>
            <p className="text-2xl font-bold text-pink-600 dark:text-pink-400 capitalize">
              {growthData[compareCategory]}
            </p>
          </div>

          {/* Length & Weight */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {t('baby.length')}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                {growthData.lengthCm} cm
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                ({growthData.lengthIn} in)
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {t('baby.weight')}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                {growthData.weightG >= 1000 ? `${(growthData.weightG / 1000).toFixed(1)} kg` : `${growthData.weightG} g`}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                ({growthData.weightOz >= 16 ? `${(growthData.weightOz / 16).toFixed(1)} lb` : `${growthData.weightOz} oz`})
              </p>
            </div>
          </div>

          {/* Development Timeline */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              {t('baby.developmentTimeline')}
            </h3>
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

              {developmentStages.map((stage) => {
                const currentStage = getStageForWeek(currentWeek!);
                const isCompleted = currentWeek! > stage.weekEnd;
                const isCurrent = currentStage?.id === stage.id;
                const isUpcoming = currentWeek! < stage.weekStart;

                return (
                  <div key={stage.id} className="relative flex items-start gap-3 pb-4 last:pb-0">
                    {/* Timeline dot */}
                    <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full shrink-0 text-sm ${
                      isCompleted
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                        : isCurrent
                        ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 ring-2 ring-pink-400 dark:ring-pink-500'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                    }`}>
                      {isCompleted ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span>{stage.icon}</span>
                      )}
                    </div>

                    {/* Content */}
                    <div className={`flex-1 min-w-0 ${isUpcoming ? 'opacity-50' : ''}`}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-semibold ${
                          isCurrent ? 'text-pink-700 dark:text-pink-300' :
                          isCompleted ? 'text-green-700 dark:text-green-300' :
                          'text-gray-500 dark:text-gray-400'
                        }`}>
                          {t(stage.nameKey as any)}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {t('baby.stageWeeks').replace('{start}', String(stage.weekStart)).replace('{end}', String(stage.weekEnd))}
                        </span>
                        {isCurrent && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400">
                            {t('baby.stageCurrent')}
                          </span>
                        )}
                        {isCompleted && (
                          <span className="text-xs text-green-500 dark:text-green-400">
                            {t('baby.stageCompleted')}
                          </span>
                        )}
                      </div>
                      {(isCurrent || isCompleted) && (
                        <p className={`text-xs mt-1 leading-relaxed ${
                          isCurrent ? 'text-pink-600 dark:text-pink-400' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {t(stage.descKey as any)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
