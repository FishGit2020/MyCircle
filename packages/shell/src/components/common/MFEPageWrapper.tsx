import React, { Suspense } from 'react';
import { Loading } from './Loading';
import ErrorBoundary from './ErrorBoundary';

interface MFEPageWrapperProps {
  component: React.LazyExoticComponent<React.ComponentType<unknown>>;
  name: string;
}

const MFEFallback = ({ name }: { name: string }) => (
  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
    <p className="text-yellow-700 dark:text-yellow-300">{name} module is loading...</p>
  </div>
);

export default function MFEPageWrapper({ component: Component, name }: MFEPageWrapperProps) {
  return (
    <ErrorBoundary fallback={<MFEFallback name={name} />}>
      <Suspense fallback={<Loading />}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  );
}
