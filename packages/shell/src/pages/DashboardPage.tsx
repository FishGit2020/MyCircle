import React from 'react';
import { Link } from 'react-router';
import { useTranslation, parseVerseReference } from '@mycircle/shared';
import { WidgetDashboard } from '../components/widgets';
import QuickAccessTiles from '../components/layout/QuickAccessTiles';
import { useCuratedVerse } from '../hooks/useCuratedVerse';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { verse, verseFragments, loading } = useCuratedVerse();

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
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-4 py-3 border border-blue-100 dark:border-blue-800/40 min-h-[72px]">
            {loading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-blue-200 dark:bg-blue-700/40 rounded w-3/4 mx-auto" />
                <div className="h-3 bg-blue-200 dark:bg-blue-700/40 rounded w-1/3 mx-auto" />
              </div>
            ) : (
              <>
                {verseFragments ? (
                  <p className="text-base md:text-lg italic text-blue-600 dark:text-blue-400 text-left leading-relaxed">
                    &ldquo;{verseFragments.map((v) => (
                      <span key={v.number}>
                        <sup className="text-[10px] font-bold text-blue-400 dark:text-blue-500 mr-0.5 not-italic select-none">
                          {v.number}
                        </sup>
                        {v.text}{' '}
                      </span>
                    ))}&rdquo;
                  </p>
                ) : verse.text ? (
                  <p className="text-base md:text-lg italic text-blue-600 dark:text-blue-400">
                    &ldquo;{verse.text}&rdquo;
                  </p>
                ) : null}
                <p className={`text-xs text-blue-700 dark:text-blue-300 font-medium ${verse.text || verseFragments ? 'mt-1.5' : ''}`}>
                  — {verse.reference}
                </p>
                {verse.copyright && (
                  <p className="text-[10px] text-blue-500/80 dark:text-blue-400/70 mt-1 leading-tight">
                    {verse.copyright}
                  </p>
                )}
                {(() => {
                  const parsed = parseVerseReference(verse.reference);
                  if (!parsed) return null;
                  return (
                    <Link
                      to={`/bible?book=${encodeURIComponent(parsed.book)}&chapter=${parsed.chapter}`}
                      className="inline-block mt-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                    >
                      {t('bible.readChapter')} &rarr;
                    </Link>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Widget Dashboard — key on uid forces full remount on sign-in/out,
           so all widget state resets cleanly (no stale data from previous user) */}
      <WidgetDashboard key={user?.uid ?? 'anon'} />

      {/* Desktop Quick Access Tiles */}
      <QuickAccessTiles />
    </div>
  );
}
