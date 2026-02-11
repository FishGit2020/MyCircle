import React, { Suspense, lazy, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { eventBus, MFEvents } from '@weather/shared';
import Loading from './Loading';
import ErrorBoundary from './ErrorBoundary';

const CitySearchMF = lazy(() => import('citySearch/CitySearch'));

const CitySearchFallback = () => (
  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
    <p className="text-yellow-700 dark:text-yellow-300">City Search module is loading...</p>
  </div>
);

export default function CitySearchWrapper() {
  const { user, addCity, removeCity, recentCities } = useAuth();

  useEffect(() => {
    if (!user) return;

    const unsubscribe = eventBus.subscribe(MFEvents.CITY_SELECTED, async (data: any) => {
      const { city } = data;
      if (city) {
        try {
          await addCity({
            id: city.id || `${city.lat},${city.lon}`,
            name: city.name,
            country: city.country,
            state: city.state,
            lat: city.lat,
            lon: city.lon,
          });
        } catch (error) {
          console.error('Failed to save recent city:', error);
        }
      }
    });

    return () => unsubscribe();
  }, [user, addCity]);

  return (
    <ErrorBoundary fallback={<CitySearchFallback />}>
      <Suspense fallback={<Loading />}>
        <CitySearchMF recentCities={recentCities} onRemoveCity={user ? removeCity : undefined} />
      </Suspense>
    </ErrorBoundary>
  );
}
