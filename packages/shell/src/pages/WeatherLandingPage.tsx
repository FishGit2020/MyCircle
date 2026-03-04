import React from 'react';
import { Link } from 'react-router';
import { useTranslation } from '@mycircle/shared';
import { useAuth } from '../context/AuthContext';
import { UseMyLocation, CitySearchWrapper, FavoriteCities } from '../components/widgets';
import { UnitToggle, SpeedToggle } from '../components/settings';

export default function WeatherLandingPage() {
  const { t } = useTranslation();
  const { user, recentCities, favoriteCities } = useAuth();

  return (
    <div className="space-y-8">
      {/* Hero section with search */}
      <section className="text-center mb-4">
        <div className="flex justify-end gap-2 mb-2">
          <UnitToggle />
          <SpeedToggle />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          {t('dashboard.weather')}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6">
          {t('home.quickWeatherDesc')}
        </p>
        <UseMyLocation />
        <div className="mt-4 text-gray-400 dark:text-gray-500 text-sm">{t('home.orSearchBelow')}</div>
      </section>

      <CitySearchWrapper />

      {/* Favorites section */}
      <FavoriteCities />

      {/* Compare CTA — shown when user has 2+ favorites */}
      {user && favoriteCities.length >= 2 && (
        <section>
          <Link
            to="/weather/compare"
            className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 hover:shadow-md transition group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-800/40 text-blue-600 dark:text-blue-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">{t('compare.ctaTitle')}</h3>
                <p className="text-xs text-blue-600 dark:text-blue-400 truncate">
                  {t('compare.ctaDesc', { cityA: favoriteCities[0].name, cityB: favoriteCities[1].name })}
                </p>
              </div>
            </div>
            <svg className="w-5 h-5 text-blue-400 dark:text-blue-500 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </section>
      )}

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
