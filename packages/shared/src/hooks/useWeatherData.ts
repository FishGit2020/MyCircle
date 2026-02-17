import { useQuery, useSubscription } from '@apollo/client/react';
import { GET_WEATHER, WEATHER_UPDATES } from '../apollo/queries';
import type { CurrentWeather, ForecastDay, HourlyForecast } from '../types';

// Check if we're in production (Firebase doesn't support WebSocket subscriptions)
const isProduction = typeof window !== 'undefined' &&
  !window.location.hostname.includes('localhost') &&
  window.location.hostname !== '127.0.0.1' &&
  window.location.hostname !== '[::1]';

interface WeatherResponse {
  weather: {
    current: CurrentWeather;
    forecast: ForecastDay[];
    hourly: HourlyForecast[];
  };
}

interface WeatherUpdateResponse {
  weatherUpdates: {
    lat: number;
    lon: number;
    timestamp: string;
    current: CurrentWeather;
  };
}

export function useWeatherData(
  lat: number | null,
  lon: number | null,
  enableRealtime: boolean = false,
  pollInterval: number = 60_000
) {
  const hasCoords = lat !== null && lon !== null;
  const effectivePollInterval = enableRealtime && hasCoords ? pollInterval : 0;

  const {
    data: queryData,
    loading: queryLoading,
    error: queryError,
    refetch,
  } = useQuery<WeatherResponse>(GET_WEATHER, {
    variables: { lat, lon },
    skip: !hasCoords,
    fetchPolicy: 'cache-and-network',
    pollInterval: effectivePollInterval,
  });

  // Disable subscriptions in production (Firebase Cloud Functions don't support WebSockets)
  const shouldSubscribe = enableRealtime && !isProduction;

  const {
    data: subscriptionData,
    error: subscriptionError
  } = useSubscription<WeatherUpdateResponse>(WEATHER_UPDATES, {
    variables: { lat, lon },
    skip: !shouldSubscribe || lat === null || lon === null,
    onData: ({ data }) => {
      if (data.data) {
        console.log('Received weather update:', data.data.weatherUpdates.timestamp);
      }
    }
  });

  const current = subscriptionData?.weatherUpdates?.current || queryData?.weather?.current || null;
  const forecast = queryData?.weather?.forecast || null;
  const hourly = queryData?.weather?.hourly || null;

  const isLive = enableRealtime && (effectivePollInterval > 0 || !!subscriptionData?.weatherUpdates);
  const lastUpdate = subscriptionData?.weatherUpdates?.timestamp
    || (queryData?.weather?.current?.dt ? new Date(queryData.weather.current.dt * 1000).toISOString() : null);

  return {
    current,
    forecast,
    hourly,
    loading: queryLoading,
    error: queryError?.message || subscriptionError?.message || null,
    isLive,
    lastUpdate,
    refetch: () => { refetch(); },
  };
}
