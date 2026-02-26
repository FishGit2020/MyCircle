import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { useWeatherData, useHistoricalWeather, useAirQuality, subscribeToMFEvent, MFEvents, CitySelectedEvent, useTranslation, StorageKeys, REVERSE_GEOCODE, useLazyQuery } from '@mycircle/shared';
import CurrentWeather from './CurrentWeatherV1';
import Forecast from './Forecast';
import HourlyForecast from './HourlyForecast';
import WeatherAlerts from './WeatherAlerts';
import HourlyChart from './HourlyChart';
import WhatToWear from './WhatToWear';
import SunriseSunset from './SunriseSunset';
import WeatherMap from './WeatherMap';
import DashboardSettings, { loadWidgetVisibility, WidgetVisibility } from './DashboardSettings';
import WeatherComparison from './WeatherComparison';
import HistoricalWeather from './HistoricalWeather';
import AirQuality from './AirQuality';
import ActivitySuggestions from './ActivitySuggestions';
import './WeatherDisplay.css';

function getRecentCitiesFromStorage(): Array<{ id: string; name: string; country?: string; lat: number; lon: number }> {
  try {
    const stored = sessionStorage.getItem('selectedCity');
    if (stored) {
      const city = JSON.parse(stored);
      return [{ id: `${city.lat},${city.lon}`, name: city.name, country: city.country, lat: city.lat, lon: city.lon }];
    }
  } catch { /* ignore */ }
  return [];
}

export default function WeatherDisplay() {
  const { coords } = useParams<{ coords: string }>();
  const [searchParams] = useSearchParams();
  const nameParam = searchParams.get('name');
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const cityName = nameParam || resolvedName || 'Unknown Location';

  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [fetchGeocode] = useLazyQuery(REVERSE_GEOCODE, {
    onCompleted: (data: any) => {
      if (data?.reverseGeocode?.name) {
        setResolvedName(data.reverseGeocode.name);
      }
    },
  });

  // Parse coordinates from URL
  useEffect(() => {
    if (coords) {
      const [lat, lon] = coords.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lon)) {
        setLocation({ lat, lon });
        // If no name in URL, resolve via reverse geocode
        if (!nameParam) {
          fetchGeocode({ variables: { lat, lon } });
        }
      }
    }
  }, [coords, nameParam, fetchGeocode]);

  // Listen for city selection events from other micro frontends
  useEffect(() => {
    const unsubscribe = subscribeToMFEvent<CitySelectedEvent>(
      MFEvents.CITY_SELECTED,
      (data) => {
        setLocation({ lat: data.city.lat, lon: data.city.lon });
      }
    );
    return unsubscribe;
  }, []);

  const { t } = useTranslation();
  const [widgets, setWidgets] = useState<WidgetVisibility>(loadWidgetVisibility);

  const [liveEnabled, setLiveEnabled] = useState(() => {
    try { return localStorage.getItem(StorageKeys.WEATHER_LIVE) === 'true'; } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem(StorageKeys.WEATHER_LIVE, String(liveEnabled)); } catch { /* ignore */ }
  }, [liveEnabled]);

  const { current, forecast, hourly, loading, error, isLive, lastUpdate, refetch } = useWeatherData(
    location?.lat ?? null,
    location?.lon ?? null,
    liveEnabled
  );

  const { historical } = useHistoricalWeather(
    location?.lat ?? null,
    location?.lon ?? null
  );

  const { airQuality } = useAirQuality(
    location?.lat ?? null,
    location?.lon ?? null
  );

  if (!location) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">{t('weather.noLocation')}</p>
      </div>
    );
  }

  if (loading && !current) {
    return (
      <div className="weather-display-container space-y-6 animate-pulse" aria-busy="true" aria-label="Loading weather data">
        {/* City name + badge skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16" />
        </div>

        {/* Current weather skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="space-y-3 flex-1">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-12" />
              </div>
            ))}
          </div>
        </div>

        {/* Hourly forecast skeleton */}
        <div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-4" />
          <div className="flex gap-3 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-20 bg-white dark:bg-gray-800 rounded-lg p-3 shadow space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-10 mx-auto" />
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8 mx-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* 7-day forecast skeleton */}
        <div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-36 mb-4" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-lg p-3 shadow">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 flex-1" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && !current) {
    return (
      <div role="alert" className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="weather-display-container space-y-6 animate-fadeIn" aria-live="polite">
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{cityName}</h2>
          <a
            href="#weather-compare"
            onClick={(e) => { e.preventDefault(); document.getElementById('weather-compare')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
            aria-label={t('compare.compareButton' as any)}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            {t('compare.compareButton' as any)}
          </a>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLiveEnabled(prev => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors font-medium ${
              isLive
                ? 'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
            }`}
            aria-label={isLive ? t('weather.live') : t('weather.paused')}
          >
            {isLive ? (
              <>
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                {t('weather.live')}
              </>
            ) : (
              t('weather.paused')
            )}
          </button>
          <DashboardSettings visibility={widgets} onChange={setWidgets} />
        </div>
      </div>

      {lastUpdate && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('weather.lastUpdated')} {new Date(lastUpdate).toLocaleTimeString()}
        </p>
      )}

      {widgets.weatherAlerts && current && forecast && <WeatherAlerts current={current} forecast={forecast} />}

      {widgets.currentWeather && current && <CurrentWeather data={current} />}

      {widgets.sunriseSunset && current && <SunriseSunset data={current} />}

      {widgets.whatToWear && current && <WhatToWear data={current} />}

      {widgets.activitySuggestions && current && <ActivitySuggestions data={current} />}

      {hourly && hourly.length > 0 && (widgets.hourlyForecast || widgets.hourlyChart) && (
        <section>
          {widgets.hourlyForecast && (
            <>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">{t('weather.hourlyForecast')}</h3>
              <HourlyForecast data={hourly} />
            </>
          )}
          {widgets.hourlyChart && (
            <div className={widgets.hourlyForecast ? 'mt-4' : ''}>
              <HourlyChart data={hourly} />
            </div>
          )}
        </section>
      )}

      {widgets.forecast && forecast && forecast.length > 0 && (
        <section>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">{t('weather.7dayForecast')}</h3>
          <Forecast data={forecast} />
        </section>
      )}

      {widgets.historicalWeather && current && historical && (
        <HistoricalWeather current={current} historical={historical} />
      )}

      {widgets.airQuality && airQuality && <AirQuality data={airQuality} />}

      {widgets.weatherMap && location && <WeatherMap lat={location.lat} lon={location.lon} />}

      {/* Inline Weather Comparison */}
      {location && (
        <WeatherComparison
          currentCity={{
            id: `${location.lat},${location.lon}`,
            name: cityName,
            lat: location.lat,
            lon: location.lon,
          }}
          availableCities={getRecentCitiesFromStorage()}
        />
      )}

      <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
          {t('mfe.weatherDisplay')}
        </span>
      </div>
    </div>
  );
}
