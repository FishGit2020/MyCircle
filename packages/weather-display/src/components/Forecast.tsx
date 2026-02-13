import React from 'react';
import { ForecastDay, getWeatherIconUrl, useUnits, convertTemp, tempUnitSymbol, useTranslation } from '@mycircle/shared';

interface Props {
  data: ForecastDay[];
}

export default function Forecast({ data }: Props) {
  const { t, locale } = useTranslation();
  const { tempUnit } = useUnits();
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {data.map((day, index) => (
        <div
          key={day.dt}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md text-center hover:shadow-lg transition"
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
        </div>
      ))}
    </div>
  );
}
