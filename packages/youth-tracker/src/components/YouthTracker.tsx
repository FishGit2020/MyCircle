import { useState, useCallback, useMemo } from 'react';
import { useTranslation, useChildren, getAgeInMonths, getAgeRemainingDays, PageContent, ChildSelector } from '@mycircle/shared';
import type { Child } from '@mycircle/shared';
import { getAgeRangeForMonths } from '../data/milestones';
import YouthTimeline from './YouthTimeline';

export default function YouthTracker() {
  const { t } = useTranslation();
  const { children, selectedChild, selectedId, setSelectedId, addChild, updateChild, deleteChild } = useChildren([60, 216]);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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

  const startEditing = useCallback(() => {
    if (!selectedChild) return;
    setInputName(selectedChild.name);
    setInputBirthDate(selectedChild.birthDate);
    setIsEditing(true);
  }, [selectedChild]);

  const saveEdit = useCallback(async () => {
    if (!selectedChild || !inputName.trim() || !inputBirthDate) return;
    await updateChild(selectedChild.id, { name: inputName.trim(), birthDate: inputBirthDate });
    setIsEditing(false);
    window.__logAnalyticsEvent?.('youth_child_edit');
  }, [selectedChild, inputName, inputBirthDate, updateChild]);

  const handleDelete = useCallback(async () => {
    if (!selectedChild) return;
    const confirmed = window.confirm(
      t('children.deleteConfirm' as any).replace('{name}', selectedChild.name)
    );
    if (!confirmed) return;
    await deleteChild(selectedChild.id);
    window.__logAnalyticsEvent?.('youth_child_delete');
  }, [selectedChild, deleteChild, t]);

  // ─── Edit Child View ────────────────────────────────────────────────────

  if (isEditing && selectedChild) {
    return (
      <PageContent maxWidth="md">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            {t('children.editChild' as any)}
          </h2>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="edit-child-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('children.name' as any)}
              </label>
              <input
                id="edit-child-name"
                type="text"
                value={inputName}
                onChange={e => setInputName(e.target.value)}
                placeholder={t('children.namePlaceholder' as any)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              />
            </div>
            <div>
              <label htmlFor="edit-birth-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('children.birthDate' as any)}
              </label>
              <input
                id="edit-birth-date"
                type="date"
                value={inputBirthDate}
                onChange={e => setInputBirthDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveEdit}
                disabled={!inputName.trim() || !inputBirthDate}
                className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {t('children.save' as any)}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="py-2.5 px-4 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition-colors hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                {t('children.cancel' as any)}
              </button>
            </div>
          </div>
        </div>
      </PageContent>
    );
  }

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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={startEditing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                aria-label={t('children.editChild' as any)}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {t('children.editChild' as any)}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                aria-label={t('children.deleteChild' as any)}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {t('children.deleteChild' as any)}
              </button>
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
