import { useNavigate, Link } from 'react-router';
import { useQuery, GET_CURRENT_WEATHER, GET_AIR_QUALITY, GET_FORECAST, GET_HISTORICAL_WEATHER, getWeatherIconUrl, useUnits, formatTemperature, useTranslation } from '@mycircle/shared';
import type { GetCurrentWeatherQuery, GetAirQualityQuery, GetForecastQuery, GetHistoricalWeatherQuery } from '@mycircle/shared';
import { useAuth } from '../../context/AuthContext';
import { FavoriteCity } from '../../lib/firebase';

const AQI_CONFIG: Record<number, { key: string; classes: string }> = {
  1: { key: 'weather.aqiGood', classes: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  2: { key: 'weather.aqiFair', classes: 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400' },
  3: { key: 'weather.aqiModerate', classes: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  4: { key: 'weather.aqiPoor', classes: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  5: { key: 'weather.aqiVeryPoor', classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

function FavoriteCityCard({ city }: { city: FavoriteCity }) {
  const navigate = useNavigate();
  const { tempUnit } = useUnits();
  const { t } = useTranslation();

  const { data, loading } = useQuery<GetCurrentWeatherQuery>(GET_CURRENT_WEATHER, {
    variables: { lat: city.lat, lon: city.lon },
    fetchPolicy: 'cache-first',
  });

  const { data: aqiData, loading: aqiLoading } = useQuery<GetAirQualityQuery>(GET_AIR_QUALITY, {
    variables: { lat: city.lat, lon: city.lon },
    fetchPolicy: 'cache-first',
  });

  const { data: forecastData, loading: forecastLoading } = useQuery<GetForecastQuery>(GET_FORECAST, {
    variables: { lat: city.lat, lon: city.lon },
    fetchPolicy: 'cache-first',
  });

  const historicalDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const { data: historicalData } = useQuery<GetHistoricalWeatherQuery>(GET_HISTORICAL_WEATHER, {
    variables: { lat: city.lat, lon: city.lon, date: historicalDate },
    fetchPolicy: 'cache-first',
  });

  const aqi = aqiData?.airQuality?.aqi;
  const aqiConfig = aqi ? AQI_CONFIG[aqi] : null;

  const forecastHigh = forecastData?.forecast?.[0]?.temp?.max ?? null;
  const forecastLow = forecastData?.forecast?.[0]?.temp?.min ?? null;

  const currentTemp = data?.currentWeather?.temp;
  const historicalMax = historicalData?.historical?.temp_max ?? null;
  const tempDiff = currentTemp != null && historicalMax != null ? currentTemp - historicalMax : null;
  const showHistorical = tempDiff != null && Math.abs(tempDiff) >= 3;

  return (
    <button
      onClick={() => navigate(`/weather/${city.lat},${city.lon}?name=${encodeURIComponent(city.name)}`)}
      className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow hover:shadow-md transition text-left border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-800 dark:text-white text-sm truncate">{city.name}</p>
          {city.country && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {city.state && `${city.state}, `}{city.country}
            </p>
          )}
        </div>
        {loading && (
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 animate-pulse flex-shrink-0" />
        )}
        {data?.currentWeather?.weather[0] && (
          <img
            src={getWeatherIconUrl(data.currentWeather.weather[0].icon)}
            alt={data.currentWeather.weather[0].main}
            className="w-10 h-10 -my-1 flex-shrink-0"
          />
        )}
      </div>
      {data?.currentWeather && (
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-800 dark:text-white">
            {formatTemperature(data.currentWeather.temp, tempUnit)}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 capitalize truncate">
            {data.currentWeather.weather[0]?.description}
          </span>
        </div>
      )}
      {loading && !data && (
        <div className="mt-2 animate-pulse">
          <div className="h-7 bg-gray-200 dark:bg-gray-600 rounded w-14" />
        </div>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {aqiLoading && (
          <div className="h-5 w-14 rounded-full bg-gray-200 dark:bg-gray-600 animate-pulse" />
        )}
        {!aqiLoading && aqiConfig && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full min-h-[1.25rem] ${aqiConfig.classes}`}>
            {t(aqiConfig.key)}
          </span>
        )}
        {forecastLoading && (
          <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-600 animate-pulse" />
        )}
        {!forecastLoading && forecastHigh != null && forecastLow != null && (
          <span
            className="text-xs text-gray-500 dark:text-gray-400"
            aria-label={t('weather.forecastHighLow')}
          >
            H: {formatTemperature(forecastHigh, tempUnit)} L: {formatTemperature(forecastLow, tempUnit)}
          </span>
        )}
      </div>
      {showHistorical && tempDiff != null && (
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          {tempDiff > 0 ? '↑' : '↓'}{Math.abs(Math.round(tempDiff))}° {tempDiff > 0 ? t('weather.warmer') : t('weather.cooler')} vs last year
        </p>
      )}
    </button>
  );
}

export default function FavoriteCities() {
  const { user, favoriteCities } = useAuth();

  const { t } = useTranslation();

  if (!user || favoriteCities.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          {t('favorites.title')}
        </h3>
        {favoriteCities.length >= 2 && (
          <Link
            to={`/weather/compare?a=${encodeURIComponent(favoriteCities[0].name)}&b=${encodeURIComponent(favoriteCities[1].name)}`}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition flex items-center gap-1"
          >
            {t('compare.compareLink')}
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {favoriteCities.map((city) => (
          <FavoriteCityCard key={city.id} city={city} />
        ))}
      </div>
    </section>
  );
}
