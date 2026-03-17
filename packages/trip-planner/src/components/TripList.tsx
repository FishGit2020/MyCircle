import { useTranslation } from '@mycircle/shared';
import type { Trip } from '../types';

interface TripListProps {
  trips: Trip[];
  onSelect: (trip: Trip) => void;
  onDelete: (id: string) => void;
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  if (s.getFullYear() !== e.getFullYear()) {
    return `${s.toLocaleDateString(undefined, { ...opts, year: 'numeric' })} – ${e.toLocaleDateString(undefined, { ...opts, year: 'numeric' })}`;
  }
  return `${s.toLocaleDateString(undefined, opts)} – ${e.toLocaleDateString(undefined, { ...opts, year: 'numeric' })}`;
}

function getDaysUntil(startDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  return Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getTripStatus(trip: Trip): 'upcoming' | 'ongoing' | 'past' {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = new Date(trip.startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(trip.endDate);
  end.setHours(0, 0, 0, 0);
  if (now < start) return 'upcoming';
  if (now > end) return 'past';
  return 'ongoing';
}

export default function TripList({ trips, onSelect, onDelete: _onDelete }: TripListProps) {
  const { t } = useTranslation();

  if (trips.length === 0) {
    return (
      <div className="text-center py-16">
        <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <p className="text-gray-500 dark:text-gray-400">{t('tripPlanner.noTrips')}</p>
      </div>
    );
  }

  const sorted = [...trips].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  return (
    <div className="space-y-3">
      {sorted.map(trip => {
        const status = getTripStatus(trip);
        const daysUntil = getDaysUntil(trip.startDate);
        const statusColors = {
          upcoming: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300',
          ongoing: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
          past: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
        };

        return (
          <button
            key={trip.id}
            type="button"
            onClick={() => onSelect(trip)}
            className="w-full text-left p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md hover:border-cyan-300 dark:hover:border-cyan-600 transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">{trip.destination}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {formatDateRange(trip.startDate, trip.endDate)}
                </p>
                {trip.notes && (
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 line-clamp-1">{trip.notes}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[status]}`}>
                  {status === 'upcoming' && daysUntil > 0
                    ? t('tripPlanner.daysUntil').replace('{days}', String(daysUntil))
                    : t(`tripPlanner.status.${status}`)}
                </span>
                {trip.budget > 0 && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {trip.currency} {trip.budget.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
