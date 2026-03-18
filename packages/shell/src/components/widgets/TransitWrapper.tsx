import React, { Suspense, lazy } from 'react';
import { Loading, ErrorBoundary } from '../common';
import { useAuth } from '../../context/AuthContext';

const TransitTrackerMF = lazy(() => import('transitTracker/TransitTracker'));

const TransitFallback = () => (
  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
    <p className="text-yellow-700 dark:text-yellow-300">Transit Tracker module is loading...</p>
  </div>
);

export default function TransitWrapper() {
  const { user, favoriteCities } = useAuth();

  return (
    <ErrorBoundary fallback={<TransitFallback />}>
      <Suspense fallback={<Loading />}>
        <TransitTrackerMF
          favoriteCities={user ? favoriteCities : undefined}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
