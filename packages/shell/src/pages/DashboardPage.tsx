import React from 'react';
import { useTranslation, getDailyVerse } from '@mycircle/shared';
import WidgetDashboard from '../components/WidgetDashboard';

export default function DashboardPage() {
  const { t } = useTranslation();
  const verse = getDailyVerse();

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
            <p className="text-sm italic text-blue-600 dark:text-blue-400">
              &ldquo;{verse.text}&rdquo;
            </p>
            <p className="text-xs text-blue-500 dark:text-blue-300 mt-1.5 font-medium">
              — {verse.reference}
            </p>
            {verse.copyright && (
              <p className="text-[10px] text-blue-400/60 dark:text-blue-500/50 mt-1 leading-tight">
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
