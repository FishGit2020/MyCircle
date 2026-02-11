import React from 'react';
import { CurrentWeather, useTranslation } from '@weather/shared';

interface Props {
  data: CurrentWeather;
}

function formatTimestamp(ts: number, timezoneOffset: number): string {
  const date = new Date((ts + timezoneOffset) * 1000);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  });
}

function getDaylightHours(sunrise: number, sunset: number): string {
  const diff = sunset - sunrise;
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

function getDaylightProgress(sunrise: number, sunset: number, dt: number): number {
  if (dt <= sunrise) return 0;
  if (dt >= sunset) return 100;
  return ((dt - sunrise) / (sunset - sunrise)) * 100;
}

export default function SunriseSunset({ data }: Props) {
  const { t, locale } = useTranslation();

  if (!data.sunrise || !data.sunset) return null;

  const progress = getDaylightProgress(data.sunrise, data.sunset, data.dt);
  const daylight = getDaylightHours(data.sunrise, data.sunset);
  const isDay = data.dt >= data.sunrise && data.dt <= data.sunset;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('weather.sunVisibility')}</h3>

      <div className="grid grid-cols-2 gap-6">
        {/* Sun arc */}
        <div className="col-span-2">
          <div className="relative h-20 mx-8">
            {/* Arc background */}
            <svg viewBox="0 0 200 100" className="w-full h-full">
              <path
                d="M 10 90 Q 100 -10 190 90"
                fill="none"
                className="stroke-gray-200 dark:stroke-gray-600"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
              <path
                d="M 10 90 Q 100 -10 190 90"
                fill="none"
                className="stroke-yellow-400"
                strokeWidth={2.5}
                strokeDasharray={`${progress * 2.82} 282`}
                strokeLinecap="round"
              />
              {/* Sun position */}
              {isDay && (
                <circle
                  cx={10 + (progress / 100) * 180}
                  cy={90 - Math.sin((progress / 100) * Math.PI) * 90}
                  r={6}
                  className="fill-yellow-400"
                />
              )}
              {/* Horizon line */}
              <line x1="5" y1="90" x2="195" y2="90" className="stroke-gray-300 dark:stroke-gray-600" strokeWidth={1} />
            </svg>
          </div>
          <div className="flex justify-between text-sm mt-1 mx-4">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400">{t('weather.sunrise')}</p>
              <p className="font-semibold text-orange-500">{formatTimestamp(data.sunrise, data.timezone)}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400">{t('weather.daylight')}</p>
              <p className="font-semibold dark:text-white">{daylight}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400">{t('weather.sunset')}</p>
              <p className="font-semibold text-orange-600">{formatTimestamp(data.sunset, data.timezone)}</p>
            </div>
          </div>
        </div>

        {/* Visibility */}
        {data.visibility != null && (
          <div className="col-span-2 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('weather.visibility')}</p>
              <p className="font-semibold dark:text-white">{(data.visibility / 1000).toFixed(1)} km</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
