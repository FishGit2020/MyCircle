import React from 'react';
import { useTranslation } from '@mycircle/shared';

const TripPlannerWidget = React.memo(function TripPlannerWidget() {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.tripPlanner' as any)}</h4> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.tripPlannerDesc' as any)}</p> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.noUpcomingTrips' as any)}</p> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
    </div>
  );
});

export default TripPlannerWidget;
