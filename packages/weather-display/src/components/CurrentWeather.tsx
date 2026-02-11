import React from 'react';
import { CurrentWeather as CurrentWeatherType, getWeatherIconUrl, getWindDirection, getWeatherDescription, useUnits, formatTemperature, formatWindSpeed, useTranslation } from '@weather/shared';

interface Props {
  data: CurrentWeatherType;
}

export default function CurrentWeather({ data }: Props) {
  const { t } = useTranslation();
  const { tempUnit, speedUnit } = useUnits();
  const { color, bgColor } = getWeatherDescription(data.weather[0]?.main || 'Clear');

  return (
    <div className={`${bgColor} dark:bg-gray-800 rounded-xl p-6 shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-6xl font-bold ${color} dark:text-white`}>{formatTemperature(data.temp, tempUnit)}</p>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            {t('weather.feelsLike')} {formatTemperature(data.feels_like, tempUnit)}
          </p>
          <p className={`text-lg capitalize mt-1 ${color} dark:text-gray-200`}>
            {data.weather[0]?.description}
          </p>
        </div>

        {data.weather[0] && (
          <img
            src={getWeatherIconUrl(data.weather[0].icon)}
            alt={data.weather[0].description}
            className="w-24 h-24"
          />
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('weather.humidity')}</p>
          <p className="text-xl font-semibold dark:text-white">{data.humidity}%</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('weather.wind')}</p>
          <p className="text-xl font-semibold dark:text-white">
            {formatWindSpeed(data.wind.speed, speedUnit)} {getWindDirection(data.wind.deg)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('weather.pressure')}</p>
          <p className="text-xl font-semibold dark:text-white">{data.pressure} hPa</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('weather.cloudiness')}</p>
          <p className="text-xl font-semibold dark:text-white">{data.clouds.all}%</p>
        </div>
      </div>
    </div>
  );
}
