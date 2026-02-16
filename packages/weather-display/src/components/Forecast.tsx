import React, { useState } from 'react';
import { ForecastDay, getWeatherIconUrl, useUnits, convertTemp, tempUnitSymbol, useTranslation } from '@mycircle/shared';

interface Props {
  data: ForecastDay[];
}

export default function Forecast({ data }: Props) {
  const { t, locale } = useTranslation();
  const { tempUnit } = useUnits();
  const [expandedDt, setExpandedDt] = useState<number | null>(null);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {data.map((day, index) => {
        const isExpanded = expandedDt === day.dt;
        return (
          <div
            key={day.dt}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md text-center hover:shadow-lg transition cursor-pointer"
            onClick={() => setExpandedDt(isExpanded ? null : day.dt)}
            role="button"
            tabIndex={0}
            aria-expanded={isExpanded}
            aria-label={`${index === 0 ? t('weather.today') : formatDate(day.dt)}: ${day.weather[0]?.description ?? ''}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setExpandedDt(isExpanded ? null : day.dt);
              }
            }}
          >
            <p className="font-medium text-gray-700 dark:text-gray-200">
              {index === 0 ? t('weather.today') : formatDate(day.dt)}
            </p>

            {day.weather[0] && (
              <img
                src={getWeatherIconUrl(day.weather[0].icon)}
                alt={day.weather[0].description}
                className="w-12 h-12 mx-auto my-2"
              />
            )}

            <div className="flex justify-center space-x-2 text-sm">
              <span className="font-semibold dark:text-white">{convertTemp(day.temp.max, tempUnit)}°</span>
              <span className="text-gray-400 dark:text-gray-500">{convertTemp(day.temp.min, tempUnit)}°</span>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">
              {day.weather[0]?.description}
            </p>

            {day.pop > 0 && (
              <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                {Math.round(day.pop * 100)}% {t('weather.rain')}
              </p>
            )}

            {/* Expandable details */}
            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs space-y-1.5">
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>{t('weather.dayTemp')}</span>
                  <span className="font-medium text-gray-700 dark:text-gray-200">{convertTemp(day.temp.day, tempUnit)}°</span>
                </div>
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>{t('weather.nightTemp')}</span>
                  <span className="font-medium text-gray-700 dark:text-gray-200">{convertTemp(day.temp.night, tempUnit)}°</span>
                </div>
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>{t('weather.humidity')}</span>
                  <span className="font-medium text-gray-700 dark:text-gray-200">{day.humidity}%</span>
                </div>
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>{t('weather.wind')}</span>
                  <span className="font-medium text-gray-700 dark:text-gray-200">{day.wind_speed} m/s</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
