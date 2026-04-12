import React from 'react';
import {
  useTranslation, useQuery, GET_ANNIVERSARIES,
  daysUntilNextFixed, daysUntilNextFloating, yearsElapsed,
} from '@mycircle/shared';
import type { GetAnniversariesQuery, FloatingRule } from '@mycircle/shared';
import { Link } from 'react-router';

const AnniversaryWidget = React.memo(function AnniversaryWidget() {
  const { t } = useTranslation();
  const { data, loading } = useQuery<GetAnniversariesQuery>(GET_ANNIVERSARIES);

  const anniversaries = data?.anniversaries ?? [];

  const getDays = (ann: { originalDate: string; floatingRule?: { month: number; weekday: number; ordinal: number } | null }) => {
    const rule = ann.floatingRule as FloatingRule | null;
    return rule ? daysUntilNextFloating(rule) : daysUntilNextFixed(ann.originalDate);
  };

  // Find the anniversary with the nearest upcoming date
  const nearest = anniversaries.length > 0
    ? anniversaries.reduce((best, curr) => {
        return getDays(curr) < getDays(best) ? curr : best;
      })
    : null;

  const daysUntil = nearest ? getDays(nearest) : null;
  const yearsTogether = nearest ? yearsElapsed(nearest.originalDate) : null;
  const isToday = daysUntil === 0;

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-500">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
            {t('widgets.anniversary' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('widgets.anniversaryDesc' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          </p>
        </div>
      </div>

      {loading && (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {t('anniversary.loading' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </p>
      )}

      {!loading && nearest && (
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {nearest.title}
          </p>
          {isToday ? (
            <p className="text-sm text-rose-600 dark:text-rose-400 font-semibold">
              {t('anniversary.happyAnniversary' as any, { years: String(yearsTogether ?? 0) } as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </p>
          ) : (
            <>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t('anniversary.daysUntil' as any, { days: String(daysUntil ?? 0) } as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('anniversary.yearsTogether' as any, { years: String(yearsTogether ?? 0) } as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
              </p>
            </>
          )}
        </div>
      )}

      {!loading && anniversaries.length === 0 && (
        <Link
          to="/anniversary"
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          {t('anniversary.createFirst' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </Link>
      )}
    </div>
  );
});

export default AnniversaryWidget;
