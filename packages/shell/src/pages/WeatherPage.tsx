import React, { useRef } from 'react';
import { Link, useParams } from 'react-router';
import { useTranslation } from '@mycircle/shared';
import { useAuth } from '../context/AuthContext';
import FavoriteButton from '../components/weather/FavoriteButton';
import ShareButton from '../components/weather/ShareButton';
import WeatherWrapper from '../components/widgets/WeatherWrapper';

function CitySwitcher() {
  const { t } = useTranslation();
  const { coords } = useParams<{ coords: string }>();
  const { favoriteCities } = useAuth();

  const currentCityId = coords ?? '';
  const otherCities = favoriteCities.filter(c => c.id !== currentCityId);

  if (otherCities.length === 0) return null;

  return (
    <nav aria-label={t('weather.citySwitch')} className="overflow-x-auto -mx-4 px-4 mb-4">
      <div className="flex gap-2 py-2 min-w-max">
        {otherCities.map(city => (
          <Link
            key={city.id}
            to={`/weather/${city.lat},${city.lon}?name=${encodeURIComponent(city.name)}`}
            className="rounded-full px-3 py-1 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 whitespace-nowrap min-h-[44px] flex items-center"
          >
            {city.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default function WeatherPage() {
  const weatherRef = useRef<HTMLDivElement>(null);
  return (
    <div>
      <div className="flex justify-end gap-2 mb-4">
        <ShareButton weatherRef={weatherRef} />
        <FavoriteButton />
      </div>
      <CitySwitcher />
      <div ref={weatherRef}>
        <WeatherWrapper />
      </div>
    </div>
  );
}
