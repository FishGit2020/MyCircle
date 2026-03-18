import React, { Suspense, lazy } from 'react';
import { useParams } from 'react-router';
import { Loading, ErrorBoundary } from '../common';
import { useAuth } from '../../context/AuthContext';

const WeatherDisplayMF = lazy(() => import('weatherDisplay/WeatherDisplay'));

const WeatherFallback = () => (
  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
    <p className="text-yellow-700 dark:text-yellow-300">Weather Display module is loading...</p>
  </div>
);

export default function WeatherWrapper() {
  const { user, favoriteCities } = useAuth();
  const { coords } = useParams<{ coords: string }>();
  const currentCityId = coords ?? '';

  return (
    <ErrorBoundary fallback={<WeatherFallback />}>
      <Suspense fallback={<Loading />}>
        <WeatherDisplayMF
          favoriteCities={user ? favoriteCities.filter(c => c.id !== currentCityId) : undefined}
          currentCityId={currentCityId}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
