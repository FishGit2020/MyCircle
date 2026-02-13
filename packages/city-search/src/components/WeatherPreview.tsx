import React from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_CURRENT_WEATHER, getWeatherIconUrl, useUnits, formatTemperature } from '@mycircle/shared';

interface CurrentWeatherData {
  currentWeather: {
    temp: number;
    weather: Array<{ icon: string; main: string }>;
  };
}

interface Props {
  lat: number;
  lon: number;
}

export default function WeatherPreview({ lat, lon }: Props) {
  const { tempUnit } = useUnits();
  const { data, loading } = useQuery<CurrentWeatherData>(GET_CURRENT_WEATHER, {
    variables: { lat, lon },
    fetchPolicy: 'cache-first',
  });

  if (loading) {
    return (
      <div className="flex items-center gap-1 ml-auto pl-2 opacity-50">
        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 animate-pulse" />
        <div className="w-8 h-4 rounded bg-gray-200 dark:bg-gray-600 animate-pulse" />
      </div>
    );
  }

  if (!data?.currentWeather) return null;

  const { temp, weather } = data.currentWeather;
  const icon = weather[0]?.icon;

  return (
    <div className="flex items-center gap-1 ml-auto pl-2 flex-shrink-0">
      {icon && (
        <img
          src={getWeatherIconUrl(icon)}
          alt={weather[0]?.main}
          className="w-8 h-8 -my-1"
        />
      )}
      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 tabular-nums">
        {formatTemperature(temp, tempUnit)}
      </span>
    </div>
  );
}
