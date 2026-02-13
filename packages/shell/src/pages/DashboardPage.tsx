import React from 'react';
import { Link } from 'react-router';
import { useTranslation, StorageKeys } from '@mycircle/shared';
import { useAuth } from '../context/AuthContext';
import { useDailyVerse } from '../hooks/useDailyVerse';

function getWatchlist(): Array<{ symbol: string; companyName: string }> {
  try {
    const stored = localStorage.getItem(StorageKeys.STOCK_WATCHLIST);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return [];
}

function getSubscribedIds(): string[] {
  try {
    const stored = localStorage.getItem(StorageKeys.PODCAST_SUBSCRIPTIONS);
    if (stored) return JSON.parse(stored).map(String);
  } catch { /* ignore */ }
  return [];
}

function getWorshipSongCount(): number {
  try {
    const stored = localStorage.getItem(StorageKeys.WORSHIP_SONGS_CACHE);
    if (stored) return JSON.parse(stored).length;
  } catch { /* ignore */ }
  return 0;
}

function FeatureCard({
  to,
  title,
  description,
  icon,
  children,
}: {
  to: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all group"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
      {children}
    </Link>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { favoriteCities } = useAuth();
  const watchlist = getWatchlist();
  const subscribedIds = getSubscribedIds();
  const worshipSongCount = getWorshipSongCount();
  const { verse, showVotd, toggleVotd, loading: verseLoading } = useDailyVerse();

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
            {verseLoading ? (
              <div className="h-4 bg-blue-200 dark:bg-blue-800/40 rounded animate-pulse w-3/4 mx-auto" />
            ) : (
              <>
                <p className="text-sm italic text-blue-600 dark:text-blue-400">
                  &ldquo;{verse.text}&rdquo;
                </p>
                <p className="text-xs text-blue-500 dark:text-blue-300 mt-1.5 font-medium">
                  — {verse.reference}{verse.version ? ` (${verse.version})` : ''}
                </p>
                {verse.copyright && (
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                    {verse.copyright}
                  </p>
                )}
              </>
            )}
            <button
              onClick={toggleVotd}
              className="mt-2 text-[11px] text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              {showVotd ? 'Show daily verse' : "View today's verse (YouVersion)"}
            </button>
          </div>
        </div>
      </section>

      {/* Feature cards grid */}
      <section>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('dashboard.quickAccess')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Weather card */}
          <FeatureCard
            to="/weather"
            title={t('dashboard.weather')}
            description={t('home.quickWeatherDesc')}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            }
          >
            {favoriteCities.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {favoriteCities.slice(0, 3).map(city => (
                  <span key={city.id} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    {city.name}
                  </span>
                ))}
                {favoriteCities.length > 3 && (
                  <span className="text-xs text-gray-400">+{favoriteCities.length - 3}</span>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400 dark:text-gray-500">{t('dashboard.noFavorites')}</p>
            )}
          </FeatureCard>

          {/* Stocks card */}
          <FeatureCard
            to="/stocks"
            title={t('dashboard.stocks')}
            description={t('home.quickStocksDesc')}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
          >
            {watchlist.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {watchlist.slice(0, 3).map(item => (
                  <span key={item.symbol} className="text-xs px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-mono">
                    {item.symbol}
                  </span>
                ))}
                {watchlist.length > 3 && (
                  <span className="text-xs text-gray-400">+{watchlist.length - 3}</span>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400 dark:text-gray-500">{t('dashboard.noWatchlist')}</p>
            )}
          </FeatureCard>

          {/* Podcasts card */}
          <FeatureCard
            to="/podcasts"
            title={t('dashboard.podcasts')}
            description={t('home.quickPodcastsDesc')}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            }
          >
            {subscribedIds.length > 0 ? (
              <p className="text-xs text-purple-600 dark:text-purple-400">
                {subscribedIds.length} {subscribedIds.length === 1 ? 'subscription' : 'subscriptions'}
              </p>
            ) : (
              <p className="text-xs text-gray-400 dark:text-gray-500">{t('dashboard.noSubscriptions')}</p>
            )}
          </FeatureCard>

          {/* Bible card */}
          <FeatureCard
            to="/bible"
            title="Bible"
            description="Read scripture daily"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            }
          >
            <p className="text-xs text-amber-600 dark:text-amber-400">Verse of the Day & more</p>
          </FeatureCard>

          {/* Worship card */}
          <FeatureCard
            to="/worship"
            title={t('dashboard.worship')}
            description={t('home.quickWorshipDesc')}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            }
          >
            {worshipSongCount > 0 ? (
              <p className="text-xs text-indigo-600 dark:text-indigo-400">
                {t('worship.songCount').replace('{count}', String(worshipSongCount))}
              </p>
            ) : (
              <p className="text-xs text-gray-400 dark:text-gray-500">{t('worship.noSongs')}</p>
            )}
          </FeatureCard>

          {/* AI card */}
          <FeatureCard
            to="/ai"
            title={t('dashboard.ai')}
            description={t('ai.subtitle')}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            }
          >
            <p className="text-xs text-gray-400 dark:text-gray-500">{t('ai.emptyHint')}</p>
          </FeatureCard>
        </div>
      </section>
    </div>
  );
}
