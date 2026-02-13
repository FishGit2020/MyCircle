import React from 'react';
import { Link } from 'react-router';
import { useTranslation } from '@mycircle/shared';
import { useAuth } from '../context/AuthContext';
import UseMyLocation from '../components/UseMyLocation';
import CitySearchWrapper from '../components/CitySearchWrapper';
import FavoriteCities from '../components/FavoriteCities';
import UnitToggle from '../components/UnitToggle';
import SpeedToggle from '../components/SpeedToggle';

export default function WeatherLandingPage() {
  const { t } = useTranslation();
  const { recentCities } = useAuth();

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
