import React, { Suspense, lazy } from 'react';
import { Loading, ErrorBoundary } from '../common';

const CitySearchMF = lazy(() => import('citySearch/CitySearch'));

const CitySearchFallback = () => (
  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
    <p className="text-yellow-700 dark:text-yellow-300">City Search module is loading...</p>
  </div>
);

export default function CitySearchWrapper() {
  return (
    <ErrorBoundary fallback={<CitySearchFallback />}>
      <Suspense fallback={<Loading />}>
        <CitySearchMF />
      </Suspense>
    </ErrorBoundary>
  );
}
