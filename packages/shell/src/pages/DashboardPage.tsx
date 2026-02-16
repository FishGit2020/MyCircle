import React from 'react';
import { useTranslation, getDailyVerse } from '@mycircle/shared';
import { WidgetDashboard } from '../components/widgets';
import { useDailyVerse } from '../hooks/useDailyVerse';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { verse: apiVerse, loading } = useDailyVerse();
  const localVerse = getDailyVerse();
  const verse = apiVerse || localVerse;

  return (
    <div className="space-y-8">
      {/* Hero section */}
      <section className="text-center mb-4">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
          {t('home.title')}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6">
          {t('home.subtitle')}
        </p>
        {/* Daily Bible verse */}
        <div className="max-w-lg mx-auto">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-4 py-3 border border-blue-100 dark:border-blue-800/40">
            {loading ? (
              <div className="h-4 bg-blue-200 dark:bg-blue-800/40 rounded animate-pulse w-3/4 mx-auto" />
            ) : verse.text ? (
              <p className="text-sm italic text-blue-600 dark:text-blue-400">
                &ldquo;{verse.text}&rdquo;
              </p>
            ) : null}
            <p className={`text-xs text-blue-700 dark:text-blue-300 font-medium ${verse.text || loading ? 'mt-1.5' : ''}`}>
              — {verse.reference}
            </p>
            {verse.copyright && (
              <p className="text-[10px] text-blue-500/80 dark:text-blue-400/70 mt-1 leading-tight">
                {verse.copyright}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Widget Dashboard */}
      <WidgetDashboard />
    </div>
  );
}
