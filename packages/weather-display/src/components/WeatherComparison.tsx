import React, { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_CURRENT_WEATHER, GET_FORECAST, getWeatherIconUrl, getWindDirection, useTranslation, useUnits, formatTemperature, formatWindSpeed, convertTemp, tempUnitSymbol } from '@mycircle/shared';

interface City {
  id: string;
  name: string;
  country?: string;
  state?: string;
  lat: number;
  lon: number;
}

interface WeatherData {
  currentWeather: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
    wind: { speed: number; deg: number };
    clouds: { all: number };
    weather: Array<{ icon: string; main: string; description: string }>;
  };
}

interface ForecastData {
  forecast: Array<{
    dt: number;
    temp: { min: number; max: number; day: number; night: number };
    weather: Array<{ icon: string; main: string; description: string }>;
    humidity: number;
    wind_speed: number;
    pop: number;
  }>;
}

function CompareCard({ city }: { city: City }) {
  const { t } = useTranslation();
  const { tempUnit, speedUnit } = useUnits();
  const { data, loading } = useQuery<WeatherData>(GET_CURRENT_WEATHER, {
    variables: { lat: city.lat, lon: city.lon },
    fetchPolicy: 'cache-first',
  });

  const w = data?.currentWeather;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg">
      <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-1">{city.name}</h4>
      {city.country && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          {city.state ? `${city.state}, ` : ''}{city.country}
        </p>
      )}

      {loading && (
        <div className="space-y-3 animate-pulse">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-24" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
        </div>
      )}

      {w && (
        <>
          <div className="flex items-center gap-3 mb-3">
            {w.weather[0] && (
              <img src={getWeatherIconUrl(w.weather[0].icon)} alt={w.weather[0].main} className="w-14 h-14" />
            )}
            <div>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">{formatTemperature(w.temp, tempUnit)}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{w.weather[0]?.description}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
              <p className="text-gray-500 dark:text-gray-400 text-xs">{t('weather.feelsLike')}</p>
              <p className="font-semibold dark:text-white">{formatTemperature(w.feels_like, tempUnit)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
              <p className="text-gray-500 dark:text-gray-400 text-xs">{t('weather.humidity')}</p>
              <p className="font-semibold dark:text-white">{w.humidity}%</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
              <p className="text-gray-500 dark:text-gray-400 text-xs">{t('weather.wind')}</p>
              <p className="font-semibold dark:text-white">{formatWindSpeed(w.wind.speed, speedUnit)} {getWindDirection(w.wind.deg)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
              <p className="text-gray-500 dark:text-gray-400 text-xs">{t('weather.pressure')}</p>
              <p className="font-semibold dark:text-white">{w.pressure} hPa</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MiniComparisonChart({ cityA, cityB }: { cityA: City; cityB: City }) {
  const { t, locale } = useTranslation();
  const { tempUnit } = useUnits();
  const { data: forecastA } = useQuery<ForecastData>(GET_FORECAST, {
    variables: { lat: cityA.lat, lon: cityA.lon },
    fetchPolicy: 'cache-first',
  });
  const { data: forecastB } = useQuery<ForecastData>(GET_FORECAST, {
    variables: { lat: cityB.lat, lon: cityB.lon },
    fetchPolicy: 'cache-first',
  });

  const daysA = forecastA?.forecast?.slice(0, 5) ?? [];
  const daysB = forecastB?.forecast?.slice(0, 5) ?? [];

  if (daysA.length === 0 && daysB.length === 0) return null;

  const allTemps = [
    ...daysA.flatMap(d => [convertTemp(d.temp.min, tempUnit), convertTemp(d.temp.max, tempUnit)]),
    ...daysB.flatMap(d => [convertTemp(d.temp.min, tempUnit), convertTemp(d.temp.max, tempUnit)]),
  ];
  const minTemp = Math.floor(Math.min(...allTemps) - 2);
  const maxTemp = Math.ceil(Math.max(...allTemps) + 2);
  const tempRange = maxTemp - minTemp || 1;

  const chartWidth = 500;
  const chartHeight = 200;
  const pad = { top: 25, bottom: 35, left: 40, right: 20 };
  const plotW = chartWidth - pad.left - pad.right;
  const plotH = chartHeight - pad.top - pad.bottom;

  const maxDays = Math.max(daysA.length, daysB.length);
  const getX = (i: number) => pad.left + (i / (maxDays - 1)) * plotW;
  const getY = (temp: number) => pad.top + (1 - (temp - minTemp) / tempRange) * plotH;

  const buildPath = (days: typeof daysA, accessor: (d: typeof daysA[0]) => number) =>
    days.map((d, i) => `${i === 0 ? 'M' : 'L'}${getX(i).toFixed(1)},${getY(convertTemp(accessor(d), tempUnit)).toFixed(1)}`).join(' ');

  const formatDay = (dt: number) => new Date(dt * 1000).toLocaleDateString(locale, { weekday: 'short' });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
      <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">{t('compare.5dayComparison')}</h4>
      <div className="flex items-center gap-4 mb-3 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-blue-500 inline-block rounded" /> {cityA.name}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-orange-500 inline-block rounded" /> {cityB.name}
        </span>
      </div>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {Array.from({ length: 5 }).map((_, i) => {
          const temp = minTemp + (tempRange * i) / 4;
          const y = getY(temp);
          return (
            <g key={`grid-${i}`}>
              <line x1={pad.left} y1={y} x2={chartWidth - pad.right} y2={y} className="stroke-gray-200 dark:stroke-gray-700" strokeWidth={0.5} />
              <text x={pad.left - 5} y={y + 3} textAnchor="end" className="fill-gray-400 dark:fill-gray-500" fontSize={9}>
                {Math.round(temp)}{tempUnitSymbol(tempUnit)}
              </text>
            </g>
          );
        })}

        {(daysA.length >= daysB.length ? daysA : daysB).map((d, i) => (
          <text key={`label-${i}`} x={getX(i)} y={chartHeight - 8} textAnchor="middle" className="fill-gray-400 dark:fill-gray-500" fontSize={10}>
            {formatDay(d.dt)}
          </text>
        ))}

        {daysA.length > 1 && (
          <>
            <path d={buildPath(daysA, d => d.temp.max)} fill="none" className="stroke-blue-500" strokeWidth={2} strokeLinejoin="round" />
            <path d={buildPath(daysA, d => d.temp.min)} fill="none" className="stroke-blue-300" strokeWidth={1.5} strokeDasharray="4 2" strokeLinejoin="round" />
            {daysA.map((d, i) => (
              <circle key={`a-${i}`} cx={getX(i)} cy={getY(convertTemp(d.temp.max, tempUnit))} r={3} className="fill-blue-500" />
            ))}
          </>
        )}

        {daysB.length > 1 && (
          <>
            <path d={buildPath(daysB, d => d.temp.max)} fill="none" className="stroke-orange-500" strokeWidth={2} strokeLinejoin="round" />
            <path d={buildPath(daysB, d => d.temp.min)} fill="none" className="stroke-orange-300" strokeWidth={1.5} strokeDasharray="4 2" strokeLinejoin="round" />
            {daysB.map((d, i) => (
              <circle key={`b-${i}`} cx={getX(i)} cy={getY(convertTemp(d.temp.max, tempUnit))} r={3} className="fill-orange-500" />
            ))}
          </>
        )}
      </svg>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">{t('compare.chartHighLow')}</p>
    </div>
  );
}

interface WeatherComparisonProps {
  currentCity: City;
  availableCities: City[];
}

export default function WeatherComparison({ currentCity, availableCities }: WeatherComparisonProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [compareCity, setCompareCity] = useState<City | null>(null);

  const otherCities = availableCities.filter(c => c.id !== currentCity.id);

  if (otherCities.length === 0) return null;

  return (
    <section className="mt-6">
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition"
      >
        <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        {t('compare.title')}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4 animate-fadeIn">
          <select
            value={compareCity?.id || ''}
            onChange={(e) => {
              const selected = otherCities.find(c => c.id === e.target.value);
              setCompareCity(selected ?? null);
            }}
            className="w-full sm:w-64 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
          >
            <option value="">{t('compare.chooseCity')}</option>
            {otherCities.map(c => (
              <option key={c.id} value={c.id}>{c.name}{c.country ? `, ${c.country}` : ''}</option>
            ))}
          </select>

          {compareCity && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CompareCard city={currentCity} />
                <CompareCard city={compareCity} />
              </div>
              <MiniComparisonChart cityA={currentCity} cityB={compareCity} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
