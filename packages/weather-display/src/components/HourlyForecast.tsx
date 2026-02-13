import React from 'react';
import { HourlyForecast as HourlyForecastType, getWeatherIconUrl, useUnits, formatTemperature, useTranslation } from '@mycircle/shared';

interface Props {
  data: HourlyForecastType[];
}

export default function HourlyForecast({ data }: Props) {
  const { t, locale } = useTranslation();
  const { tempUnit } = useUnits();
  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex space-x-4 pb-4">
        {data.slice(0, 12).map((hour, index) => (
          <div
            key={hour.dt}
            className="flex-shrink-0 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-md text-center min-w-[80px]"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {index === 0 ? t('weather.now') : formatTime(hour.dt)}
            </p>

            {hour.weather[0] && (
              <img
                src={getWeatherIconUrl(hour.weather[0].icon)}
                alt={hour.weather[0].description}
                className="w-10 h-10 mx-auto my-1"
              />
            )}

            <p className="font-semibold dark:text-white">{formatTemperature(hour.temp, tempUnit)}</p>

            {hour.pop > 0 && (
              <p className="text-xs text-blue-500 dark:text-blue-400">
                {Math.round(hour.pop * 100)}%
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
