import React, { useState } from 'react';
import { useQuery, useLazyQuery } from '@apollo/client/react';
import { GET_CURRENT_WEATHER, GET_FORECAST, SEARCH_CITIES, getWeatherIconUrl, getWindDirection, useTranslation, useUnits, formatTemperature, formatWindSpeed, convertTemp, tempUnitSymbol } from '@mycircle/shared';

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

/** Side-by-side comparison metric bar */
function CompareBar({ label, valueA, valueB, unit, max }: { label: string; valueA: number; valueB: number; unit: string; max: number }) {
  const pctA = max > 0 ? Math.min((valueA / max) * 100, 100) : 0;
  const pctB = max > 0 ? Math.min((valueB / max) * 100, 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{label}</span>
        <span className="tabular-nums">{Math.round(valueA)}{unit} vs {Math.round(valueB)}{unit}</span>
      </div>
      <div className="flex gap-1 h-2">
        <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width: `${pctA}%` }} />
        </div>
        <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-orange-400 rounded-full transition-all" style={{ width: `${pctB}%` }} />
        </div>
      </div>
    </div>
  );
}

function CompareCard({ city, color }: { city: City; color: 'blue' | 'orange' }) {
  const { t } = useTranslation();
  const { tempUnit, speedUnit } = useUnits();
  const { data, loading } = useQuery<WeatherData>(GET_CURRENT_WEATHER, {
    variables: { lat: city.lat, lon: city.lon },
    fetchPolicy: 'cache-first',
  });

  const w = data?.currentWeather;
  const borderColor = color === 'blue' ? 'border-t-blue-500' : 'border-t-orange-500';

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg border-t-4 ${borderColor}`}>
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

/** Metric comparison bars for humidity, wind, cloudiness, pressure */
function MetricComparison({ cityA, cityB }: { cityA: City; cityB: City }) {
  const { t } = useTranslation();
  const { speedUnit } = useUnits();
  const { data: dataA } = useQuery<WeatherData>(GET_CURRENT_WEATHER, {
    variables: { lat: cityA.lat, lon: cityA.lon },
    fetchPolicy: 'cache-first',
  });
  const { data: dataB } = useQuery<WeatherData>(GET_CURRENT_WEATHER, {
    variables: { lat: cityB.lat, lon: cityB.lon },
    fetchPolicy: 'cache-first',
  });

  const wA = dataA?.currentWeather;
  const wB = dataB?.currentWeather;

  if (!wA || !wB) return null;

  const speedUnitLabel = speedUnit === 'mph' ? 'mph' : speedUnit === 'kmh' ? 'km/h' : 'm/s';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg space-y-3">
      <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">{t('compare.metrics')}</h4>
      <div className="flex items-center gap-3 mb-2 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1"><span className="w-3 h-2 bg-blue-400 inline-block rounded" /> {cityA.name}</span>
        <span className="flex items-center gap-1"><span className="w-3 h-2 bg-orange-400 inline-block rounded" /> {cityB.name}</span>
      </div>
      <CompareBar label={t('weather.humidity')} valueA={wA.humidity} valueB={wB.humidity} unit="%" max={100} />
      <CompareBar label={t('weather.wind')} valueA={wA.wind.speed} valueB={wB.wind.speed} unit={` ${speedUnitLabel}`} max={Math.max(wA.wind.speed, wB.wind.speed, 1) * 1.2} />
      <CompareBar label={t('weather.cloudiness')} valueA={wA.clouds.all} valueB={wB.clouds.all} unit="%" max={100} />
      <CompareBar label={t('weather.pressure')} valueA={wA.pressure} valueB={wB.pressure} unit=" hPa" max={Math.max(wA.pressure, wB.pressure, 1) * 1.02} />
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

/** Inline city search for comparing */
function CitySearchInline({ onSelect }: { onSelect: (city: City) => void }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [searchCities, { data, loading }] = useLazyQuery<{ searchCities: City[] }>(SEARCH_CITIES);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (value.trim().length >= 2) {
      searchCities({ variables: { query: value.trim(), limit: 5 } });
    }
  };

  const results = data?.searchCities ?? [];

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder={t('compare.searchCity' as any)}
        className="w-full sm:w-64 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
        aria-label={t('compare.searchCity' as any)}
      />
      {query.trim().length >= 2 && (
        <div className="absolute z-10 mt-1 w-full sm:w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {loading && (
            <div className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500 animate-pulse">...</div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">No results</div>
          )}
          {results.map((city) => (
            <button
              key={city.id}
              onClick={() => {
                onSelect(city);
                setQuery('');
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300 transition-colors"
            >
              {city.name}{city.state ? `, ${city.state}` : ''}{city.country ? `, ${city.country}` : ''}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface WeatherComparisonProps {
  currentCity: City;
  availableCities: City[];
}

export default function WeatherComparison({ currentCity, availableCities }: WeatherComparisonProps) {
  const { t } = useTranslation();
  const otherCities = availableCities.filter(c => c.id !== currentCity.id);
  const [expanded, setExpanded] = useState(otherCities.length > 0);
  const [compareCity, setCompareCity] = useState<City | null>(null);

  const handleSwap = () => {
    // Cannot truly swap since currentCity is from URL,
    // but we can cycle through available cities
    if (!compareCity) return;
    const currentIndex = otherCities.findIndex(c => c.id === compareCity.id);
    const nextIndex = (currentIndex + 1) % otherCities.length;
    setCompareCity(otherCities[nextIndex]);
  };

  const handleAddCity = (city: City) => {
    setCompareCity(city);
    setExpanded(true);
  };

  return (
    <section id="weather-compare" className="mt-6">
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition"
      >
        <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        {t('compare.title')}
        {otherCities.length > 0 && (
          <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full">
            {otherCities.length}
          </span>
        )}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4 animate-fadeIn">
          <div className="flex flex-wrap items-center gap-2">
            {/* Existing city dropdown (if cities available) */}
            {otherCities.length > 0 && (
              <select
                value={compareCity?.id || ''}
                onChange={(e) => {
                  const selected = otherCities.find(c => c.id === e.target.value);
                  setCompareCity(selected ?? null);
                }}
                className="flex-1 sm:flex-none sm:w-64 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
              >
                <option value="">{t('compare.chooseCity')}</option>
                {otherCities.map(c => (
                  <option key={c.id} value={c.id}>{c.name}{c.country ? `, ${c.country}` : ''}</option>
                ))}
              </select>
            )}

            {/* Swap / cycle button */}
            {compareCity && otherCities.length > 1 && (
              <button
                onClick={handleSwap}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                aria-label={t('compare.swapCities')}
                title={t('compare.swapCities')}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            )}
          </div>

          {/* Inline city search — always available */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">
              {otherCities.length === 0 ? t('compare.searchCity' as any) : t('compare.addCity' as any)}
            </p>
            <CitySearchInline onSelect={handleAddCity} />
          </div>

          {compareCity && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CompareCard city={currentCity} color="blue" />
                <CompareCard city={compareCity} color="orange" />
              </div>
              <MetricComparison cityA={currentCity} cityB={compareCity} />
              <MiniComparisonChart cityA={currentCity} cityB={compareCity} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
