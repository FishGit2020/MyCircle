import React, { useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { AirQuality as AirQualityType } from '@mycircle/shared';
import type { TranslationKey } from '@mycircle/shared';

interface Props {
  data: AirQualityType;
}

const AQI_CONFIG: Array<{
  label: TranslationKey;
  desc: TranslationKey;
  color: string;
  bgColor: string;
  barColor: string;
}> = [
  { label: 'weather.aqiGood', desc: 'weather.aqiGoodDesc', color: 'text-green-700 dark:text-green-300', bgColor: 'bg-green-100 dark:bg-green-900/30', barColor: 'bg-green-500' },
  { label: 'weather.aqiFair', desc: 'weather.aqiFairDesc', color: 'text-yellow-700 dark:text-yellow-300', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', barColor: 'bg-yellow-500' },
  { label: 'weather.aqiModerate', desc: 'weather.aqiModerateDesc', color: 'text-orange-700 dark:text-orange-300', bgColor: 'bg-orange-100 dark:bg-orange-900/30', barColor: 'bg-orange-500' },
  { label: 'weather.aqiPoor', desc: 'weather.aqiPoorDesc', color: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-100 dark:bg-red-900/30', barColor: 'bg-red-500' },
  { label: 'weather.aqiVeryPoor', desc: 'weather.aqiVeryPoorDesc', color: 'text-purple-700 dark:text-purple-300', bgColor: 'bg-purple-100 dark:bg-purple-900/30', barColor: 'bg-purple-500' },
];

const POLLUTANTS: Array<{ key: keyof Omit<AirQualityType, 'aqi'>; label: string; unit: string }> = [
  { key: 'pm2_5', label: 'PM2.5', unit: '\u00b5g/m\u00b3' },
  { key: 'pm10', label: 'PM10', unit: '\u00b5g/m\u00b3' },
  { key: 'o3', label: 'O\u2083', unit: '\u00b5g/m\u00b3' },
  { key: 'no2', label: 'NO\u2082', unit: '\u00b5g/m\u00b3' },
  { key: 'so2', label: 'SO\u2082', unit: '\u00b5g/m\u00b3' },
  { key: 'co', label: 'CO', unit: '\u00b5g/m\u00b3' },
];

export default function AirQuality({ data }: Props) {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);

  const idx = Math.max(0, Math.min(data.aqi - 1, 4));
  const config = AQI_CONFIG[idx];

  return (
    <section aria-labelledby="aqi-title">
      <h3
        id="aqi-title"
        className="text-xl font-semibold text-gray-800 dark:text-white mb-4"
      >
        {t('weather.airQuality')}
      </h3>

      <div className={`rounded-xl p-5 shadow-lg ${config.bgColor}`}>
        {/* AQI header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className={`text-2xl font-bold ${config.color}`}>
              {t(config.label)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 max-w-md">
              {t(config.desc)}
            </p>
          </div>
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center ${config.barColor} text-white font-bold text-xl`}
            role="img"
            aria-label={`AQI ${data.aqi}`}
          >
            {data.aqi}
          </div>
        </div>

        {/* AQI scale bar */}
        <div className="mt-4" aria-hidden="true">
          <div className="flex gap-1 h-2 rounded-full overflow-hidden">
            {AQI_CONFIG.map((c, i) => (
              <div
                key={i}
                className={`flex-1 ${c.barColor} ${i === idx ? 'ring-2 ring-white ring-offset-1 dark:ring-offset-gray-900' : 'opacity-40'}`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">1</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">5</span>
          </div>
        </div>

        {/* Pollutant details toggle */}
        <button
          onClick={() => setShowDetails(prev => !prev)}
          className="mt-4 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1"
          aria-expanded={showDetails}
        >
          {t('weather.pollutants')}
          <svg
            className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showDetails && (
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {POLLUTANTS.map(({ key, label, unit }) => (
              <div
                key={key}
                className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3"
              >
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {data[key].toFixed(1)} <span className="text-xs font-normal">{unit}</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
