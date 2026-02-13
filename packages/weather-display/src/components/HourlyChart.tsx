import React from 'react';
import { HourlyForecast, useTranslation, useUnits, convertTemp, tempUnitSymbol } from '@mycircle/shared';

interface Props {
  data: HourlyForecast[];
}

export default function HourlyChart({ data }: Props) {
  const { t, locale } = useTranslation();
  const { tempUnit } = useUnits();
  const hours = data.slice(0, 24);
  if (hours.length < 2) return null;

  const temps = hours.map(h => convertTemp(h.temp, tempUnit));
  const pops = hours.map(h => h.pop);
  const minTemp = Math.floor(Math.min(...temps) - 2);
  const maxTemp = Math.ceil(Math.max(...temps) + 2);
  const tempRange = maxTemp - minTemp || 1;

  const chartWidth = 720;
  const chartHeight = 160;
  const padding = { top: 20, bottom: 30, left: 0, right: 0 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const getX = (i: number) => padding.left + (i / (hours.length - 1)) * plotWidth;
  const getTempY = (temp: number) => padding.top + (1 - (temp - minTemp) / tempRange) * plotHeight;
  const getPopY = (pop: number) => padding.top + plotHeight - pop * plotHeight;

  // Temperature line path (using converted temps)
  const tempPath = temps
    .map((temp, i) => `${i === 0 ? 'M' : 'L'}${getX(i).toFixed(1)},${getTempY(temp).toFixed(1)}`)
    .join(' ');

  // Temperature area fill
  const tempArea = `${tempPath} L${getX(hours.length - 1).toFixed(1)},${(padding.top + plotHeight).toFixed(1)} L${getX(0).toFixed(1)},${(padding.top + plotHeight).toFixed(1)} Z`;

  // Precipitation bars
  const barWidth = plotWidth / hours.length * 0.6;

  const formatTime = (dt: number) => {
    return new Date(dt * 1000).toLocaleTimeString(locale, { hour: 'numeric' });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
      <div className="flex items-center gap-4 mb-3 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-blue-500 inline-block rounded" /> {t('weather.temperature')}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-blue-200 dark:bg-blue-800 inline-block rounded-sm opacity-60" /> {t('weather.rainPercent')}
        </span>
      </div>

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full min-w-[600px]" preserveAspectRatio="none">
          {/* Precipitation bars */}
          {hours.map((h, i) => h.pop > 0 && (
            <rect
              key={`pop-${i}`}
              x={getX(i) - barWidth / 2}
              y={getPopY(h.pop)}
              width={barWidth}
              height={padding.top + plotHeight - getPopY(h.pop)}
              className="fill-blue-200 dark:fill-blue-800 opacity-40"
              rx={2}
            />
          ))}

          {/* Temperature area */}
          <path d={tempArea} className="fill-blue-100 dark:fill-blue-900 opacity-30" />

          {/* Temperature line */}
          <path d={tempPath} fill="none" className="stroke-blue-500" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

          {/* Data points + labels */}
          {hours.map((h, i) => {
            const showLabel = i % Math.max(1, Math.floor(hours.length / 8)) === 0;
            const displayTemp = temps[i];
            return (
              <g key={i}>
                <circle cx={getX(i)} cy={getTempY(displayTemp)} r={showLabel ? 3.5 : 2} className="fill-blue-500" />
                {showLabel && (
                  <>
                    <text
                      x={getX(i)}
                      y={getTempY(displayTemp) - 8}
                      textAnchor="middle"
                      className="fill-gray-700 dark:fill-gray-300"
                      fontSize={10}
                      fontWeight="bold"
                    >
                      {displayTemp}°
                    </text>
                    <text
                      x={getX(i)}
                      y={chartHeight - 4}
                      textAnchor="middle"
                      className="fill-gray-400 dark:fill-gray-500"
                      fontSize={9}
                    >
                      {i === 0 ? t('weather.now') : formatTime(h.dt)}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
