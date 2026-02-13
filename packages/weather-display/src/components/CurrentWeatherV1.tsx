import React from 'react';
import { CurrentWeather as CurrentWeatherType, getWeatherIconUrl, getWindDirection, getWeatherDescription, useUnits, formatTemperature, formatWindSpeed, useTranslation } from '@mycircle/shared';

interface Props {
  data: CurrentWeatherType;
}

const conditionGradients: Record<string, string> = {
  Clear: 'from-amber-400 to-orange-500',
  Clouds: 'from-gray-400 to-slate-600',
  Rain: 'from-blue-500 to-indigo-700',
  Drizzle: 'from-blue-400 to-cyan-600',
  Thunderstorm: 'from-purple-600 to-gray-900',
  Snow: 'from-blue-100 to-gray-300',
  Mist: 'from-gray-300 to-gray-500',
  Fog: 'from-gray-300 to-gray-500',
  Haze: 'from-yellow-300 to-orange-400',
};

export default function CurrentWeatherV1({ data }: Props) {
  const { t } = useTranslation();
  const { tempUnit, speedUnit } = useUnits();
  const condition = data.weather[0]?.main || 'Clear';
  const gradient = conditionGradients[condition] || conditionGradients.Clear;

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} rounded-xl p-8 shadow-lg text-white`}>
      {/* Watermark icon */}
      {data.weather[0] && (
        <img
          src={getWeatherIconUrl(data.weather[0].icon)}
          alt=""
          aria-hidden="true"
          className="absolute right-4 top-4 w-40 h-40 opacity-20 pointer-events-none"
        />
      )}

      {/* Main content */}
      <div className="relative z-10 text-center">
        <p className="text-7xl font-extrabold drop-shadow-md">
          {formatTemperature(data.temp, tempUnit)}
        </p>
        <p className="text-xl mt-2 capitalize opacity-90">
          {data.weather[0]?.description}
        </p>
        <p className="text-sm mt-1 opacity-75">
          {t('weather.feelsLike')} {formatTemperature(data.feels_like, tempUnit)}
        </p>
      </div>

      {/* Horizontal metrics row */}
      <div className="relative z-10 flex justify-around mt-8 pt-6 border-t border-white/30">
        <div className="text-center">
          <p className="text-xs uppercase tracking-wide opacity-75">{t('weather.humidity')}</p>
          <p className="text-lg font-semibold">{data.humidity}%</p>
        </div>
        <div className="text-center">
          <p className="text-xs uppercase tracking-wide opacity-75">{t('weather.wind')}</p>
          <p className="text-lg font-semibold">
            {formatWindSpeed(data.wind.speed, speedUnit)} {getWindDirection(data.wind.deg)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs uppercase tracking-wide opacity-75">{t('weather.pressure')}</p>
          <p className="text-lg font-semibold">{data.pressure} hPa</p>
        </div>
        <div className="text-center">
          <p className="text-xs uppercase tracking-wide opacity-75">{t('weather.cloudiness')}</p>
          <p className="text-lg font-semibold">{data.clouds.all}%</p>
        </div>
      </div>
    </div>
  );
}
