import { useTranslation } from '@mycircle/shared';
import type { ArrivalDeparture } from '../types';

interface ArrivalsListProps {
  arrivals: ArrivalDeparture[];
  lastUpdated: number | null;
  loading?: boolean;
  onRefresh?: () => void;
}

function formatMinutes(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  if (minutes <= 0) return 'Now';
  if (minutes === 1) return '1 min';
  return `${minutes} min`;
}

function getStatusColor(predicted: boolean, minutesAway: number): string {
  if (!predicted) return 'text-gray-500 dark:text-gray-400';
  if (minutesAway <= 5) return 'text-green-600 dark:text-green-400';
  if (minutesAway <= 15) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-teal-600 dark:text-teal-400';
}

export default function ArrivalsList({ arrivals, lastUpdated, loading, onRefresh }: ArrivalsListProps) {
  const { t } = useTranslation();
  const now = Date.now();

  if (arrivals.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500 dark:text-gray-400">
        {t('transit.noArrivals')}
      </div>
    );
  }

  return (
    <div>
      {lastUpdated && (
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {t('transit.lastUpdated')}: {new Date(lastUpdated).toLocaleTimeString()}
          </p>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-teal-600 transition-colors hover:bg-teal-50 disabled:opacity-50 dark:text-teal-400 dark:hover:bg-teal-900/30"
            >
              <svg
                className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {t('transit.refresh')}
            </button>
          )}
        </div>
      )}
      <ul className="space-y-2" role="list" aria-label={t('transit.arrivalsList')}>
        {arrivals.map((arrival, idx) => {
          const arrivalTime = arrival.predicted
            ? arrival.predictedArrivalTime
            : arrival.scheduledArrivalTime;
          const msAway = arrivalTime - now;
          const minutesAway = Math.round(msAway / 60_000);
          const timeStr = new Date(arrivalTime).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <li
              key={`${arrival.routeId}-${arrival.vehicleId}-${idx}`}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-colors dark:border-gray-700 dark:bg-gray-800"
            >
              {/* Route badge */}
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-teal-100 text-sm font-bold text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                {arrival.routeShortName || '?'}
              </div>

              {/* Destination */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {arrival.tripHeadsign || arrival.routeLongName || t('transit.unknownRoute')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {arrival.predicted ? t('transit.realTime') : t('transit.scheduled')} &middot; {timeStr}
                </p>
              </div>

              {/* ETA */}
              <div className={`flex-shrink-0 text-right ${getStatusColor(arrival.predicted, minutesAway)}`}>
                <p className="text-lg font-bold leading-tight">
                  {formatMinutes(msAway)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
