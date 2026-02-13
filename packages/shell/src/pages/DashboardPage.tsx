import React, { useMemo } from 'react';
import { Link } from 'react-router';
import { useTranslation } from '@weather/shared';
import { useAuth } from '../context/AuthContext';
import UseMyLocation from '../components/UseMyLocation';
import CitySearchWrapper from '../components/CitySearchWrapper';
import FavoriteCities from '../components/FavoriteCities';

const AFFIRMATIONS = [
  "You are capable of achieving great things today.",
  "Every day is a fresh start full of possibilities.",
  "You bring value to everything you do.",
  "Your potential is limitless — keep going.",
  "Today is yours to shape however you choose.",
  "You are stronger than any challenge ahead.",
  "Small steps forward are still progress.",
  "You deserve all the good that comes your way.",
  "Your ideas matter and the world needs them.",
  "Believe in the magic of new beginnings.",
  "You are exactly where you need to be right now.",
  "The best is yet to come.",
  "You have the power to create positive change.",
  "Trust yourself — you've got this.",
  "Your journey is unique and worth celebrating.",
  "Kindness starts with how you treat yourself.",
  "You are making a difference, even when you can't see it.",
  "Embrace today with courage and curiosity.",
  "You are worthy of rest, joy, and success.",
  "Let today be the day you shine.",
  "Growth happens one brave step at a time.",
  "You are resilient, creative, and unstoppable.",
  "The sun always rises — and so will you.",
  "Your presence brightens the world around you.",
  "Today, choose progress over perfection.",
  "You are enough, just as you are.",
  "Great things are built with patience and heart.",
  "Your story is still being written — make it beautiful.",
  "You have survived every difficult day so far.",
  "Let gratitude be your compass today.",
  "You are a work of art in progress.",
];

function getDailyAffirmation(): string {
  const now = new Date();
  const dayIndex = (now.getFullYear() * 366 + now.getMonth() * 31 + now.getDate()) % AFFIRMATIONS.length;
  return AFFIRMATIONS[dayIndex];
}

const WATCHLIST_STORAGE_KEY = 'stock-tracker-watchlist';
const SUBSCRIPTIONS_KEY = 'podcast-subscriptions';

function getWatchlist(): Array<{ symbol: string; companyName: string }> {
  try {
    const stored = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return [];
}

function getSubscribedIds(): string[] {
  try {
    const stored = localStorage.getItem(SUBSCRIPTIONS_KEY);
    if (stored) return JSON.parse(stored).map(String);
  } catch { /* ignore */ }
  return [];
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
  const { user, favoriteCities, recentCities } = useAuth();
  const watchlist = getWatchlist();
  const subscribedIds = getSubscribedIds();
  const affirmation = useMemo(() => getDailyAffirmation(), []);

  return (
    <div className="space-y-8">
      {/* Hero section with search */}
      <section className="text-center mb-4">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
          {t('home.title')}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6">
          {t('home.subtitle')}
        </p>
        {/* Daily affirmation */}
        <div className="max-w-lg mx-auto mb-6">
          <p className="text-sm italic text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-4 py-3 border border-blue-100 dark:border-blue-800/40">
            &ldquo;{affirmation}&rdquo;
          </p>
        </div>
        <UseMyLocation />
        <div className="mt-4 text-gray-400 dark:text-gray-500 text-sm">{t('home.orSearchBelow')}</div>
      </section>

      <CitySearchWrapper />

      {/* Feature cards grid */}
      <section>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('dashboard.quickAccess')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Weather card */}
          <FeatureCard
            to={favoriteCities.length > 0 ? `/weather/${favoriteCities[0].lat},${favoriteCities[0].lon}?name=${encodeURIComponent(favoriteCities[0].name)}` : '/'}
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

      {/* Favorites section */}
      <FavoriteCities />

      {/* Recent searches */}
      {recentCities.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">{t('dashboard.recentSearches')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {recentCities.slice(0, 6).map(city => (
              <Link
                key={city.id}
                to={`/weather/${city.lat},${city.lon}?name=${encodeURIComponent(city.name)}`}
                className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition text-center"
              >
                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{city.name}</p>
                {city.country && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{city.country}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
