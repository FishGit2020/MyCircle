import { useState, useCallback, useMemo } from 'react';
import { useTranslation, useChildren, getAgeInMonths, getAgeRemainingDays, PageContent, ChildSelector } from '@mycircle/shared';
import type { Child } from '@mycircle/shared';
import { getAgeRangeForMonths } from '../data/milestones';
import YouthTimeline from './YouthTimeline';

export default function YouthTracker() {
  const { t } = useTranslation();
  const { children, selectedChild, selectedId, setSelectedId, addChild } = useChildren([60, 216]);
  const [isAdding, setIsAdding] = useState(false);
  const [inputName, setInputName] = useState('');
  const [inputBirthDate, setInputBirthDate] = useState('');

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
    return getAgeRangeForMonths(ageInMonths);
  }, [ageInMonths]);

  const ageDisplay = useMemo(() => {
    if (ageInMonths === null) return '';
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
    window.__logAnalyticsEvent?.('youth_child_add');
  }, [inputName, inputBirthDate, addChild]);

  // ─── Add Child View ─────────────────────────────────────────────────────

  if (children.length === 0 || isAdding) {
    return (
      <PageContent maxWidth="md">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            {t('youth.title' as any)}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('youth.subtitle' as any)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="child-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('children.name' as any)}
              </label>
              <input
                id="child-name"
                type="text"
                value={inputName}
                onChange={e => setInputName(e.target.value)}
                placeholder={t('children.namePlaceholder' as any)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              />
            </div>
            <div>
              <label htmlFor="birth-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('children.birthDate' as any)}
              </label>
              <input
                id="birth-date"
                type="date"
                value={inputBirthDate}
                onChange={e => setInputBirthDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveChild}
                disabled={!inputName.trim() || !inputBirthDate}
                className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
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

  // ─── Main View ──────────────────────────────────────────────────────────

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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                {selectedChild.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{ageDisplay}</p>
            </div>
          </div>

          {/* Timeline */}
          <YouthTimeline
            ageInMonths={ageInMonths}
            currentAgeRange={currentAgeRange}
          />
        </>
      )}
    </PageContent>
  );
}
