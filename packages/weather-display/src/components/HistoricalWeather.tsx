import React from 'react';
import { useTranslation, useUnits, formatTemperature, formatWindSpeed, getWeatherIconUrl } from '@mycircle/shared';
import type { CurrentWeather, HistoricalWeatherDay } from '@mycircle/shared';

interface Props {
  current: CurrentWeather;
  historical: HistoricalWeatherDay;
}

export default function HistoricalWeather({ current, historical }: Props) {
  const { t } = useTranslation();
  const { tempUnit, speedUnit } = useUnits();

  const todayHigh = current.temp_max;
  const todayLow = current.temp_min;
  const diff = todayHigh - historical.temp_max;
  const absDiff = Math.abs(diff);

  return (
    <section aria-labelledby="historical-weather-title">
      <h3
        id="historical-weather-title"
        className="text-xl font-semibold text-gray-800 dark:text-white mb-1"
      >
        {t('weather.historicalTitle')}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {t('weather.historicalDesc')}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Today card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg border-2 border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
              {t('weather.today')}
            </span>
            {current.weather[0] && (
              <img
                src={getWeatherIconUrl(current.weather[0].icon)}
                alt={current.weather[0].description}
                className="w-10 h-10"
              />
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 capitalize mb-3">
            {current.weather[0]?.description ?? ''}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Metric label={t('weather.tempHigh')} value={formatTemperature(todayHigh, tempUnit)} />
            <Metric label={t('weather.tempLow')} value={formatTemperature(todayLow, tempUnit)} />
            <Metric label={t('weather.windMax')} value={formatWindSpeed(current.wind.speed, speedUnit)} />
            <Metric label={t('weather.precipitation')} value={`${current.humidity}%`} />
          </div>
        </div>

        {/* Last year card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {t('weather.lastYear')}
            </span>
            <img
              src={getWeatherIconUrl(historical.weather_icon)}
              alt={historical.weather_description}
              className="w-10 h-10"
            />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 capitalize mb-3">
            {historical.weather_description}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Metric label={t('weather.tempHigh')} value={formatTemperature(historical.temp_max, tempUnit)} />
            <Metric label={t('weather.tempLow')} value={formatTemperature(historical.temp_min, tempUnit)} />
            <Metric label={t('weather.windMax')} value={formatWindSpeed(historical.wind_speed_max / 3.6, speedUnit)} />
            <Metric label={t('weather.precipitation')} value={`${historical.precipitation} mm`} />
          </div>
        </div>
      </div>

      {/* Temperature difference badge */}
      {absDiff > 0 && (
        <div className="mt-3 flex justify-center">
          <span
            role="status"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
              diff > 0
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
            }`}
          >
            {diff > 0 ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            )}
            {formatTemperature(absDiff, tempUnit)} {diff > 0 ? t('weather.warmer') : t('weather.cooler')}
          </span>
        </div>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
