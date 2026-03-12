import { useTranslation } from '@mycircle/shared';
import type { ArrivalDeparture } from '../types';

interface ArrivalsListProps {
  arrivals: ArrivalDeparture[];
  lastUpdated: number | null;
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

export default function ArrivalsList({ arrivals, lastUpdated }: ArrivalsListProps) {
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
        <p className="mb-3 text-xs text-gray-400 dark:text-gray-500">
          {t('transit.lastUpdated')}: {new Date(lastUpdated).toLocaleTimeString()}
        </p>
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
