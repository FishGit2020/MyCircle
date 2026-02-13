import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function SkeletonLine({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-4 ${className}`} />
  );
}

export function SkeletonCircle({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-full w-10 h-10 ${className}`} />
  );
}

export function SkeletonCard({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
      </div>
    </div>
  );
}

export function SkeletonList({ rows = 3, className = '' }: SkeletonProps & { rows?: number }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded" style={{ width: `${60 + Math.random() * 30}%` }} />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded" style={{ width: `${40 + Math.random() * 30}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-white dark:bg-gray-800 rounded-xl p-6 ${className}`}>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4" />
      <div className="h-48 bg-gray-100 dark:bg-gray-700 rounded" />
    </div>
  );
}
