import React from 'react';
import { Link } from 'react-router';
import { useTranslation } from '@mycircle/shared';
import { useAuth } from '../../context/AuthContext';

const WeatherWidget = React.memo(function WeatherWidget() {
  const { t } = useTranslation();
  const { favoriteCities } = useAuth();

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.weather')}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.weatherDesc')}</p>
        </div>
      </div>
      {favoriteCities.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {favoriteCities.map(city => (
            <Link
              key={city.id}
              to={`/weather/${city.lat},${city.lon}?name=${encodeURIComponent(city.name)}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-100 dark:hover:bg-blue-800/40 active:bg-blue-200 dark:active:bg-blue-700/40 transition-colors"
            >
              {city.name}
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.noFavoriteCity')}</p>
      )}
    </div>
  );
});

export default WeatherWidget;
