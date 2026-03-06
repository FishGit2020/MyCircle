import React, { useEffect } from 'react';
import { useTranslation, StorageKeys, WindowEvents, getAgeInMonths } from '@mycircle/shared';
import type { Child } from '@mycircle/shared';

const YouthTrackerWidget = React.memo(function YouthTrackerWidget() {
  const { t } = useTranslation();
  const [children, setChildren] = React.useState<Child[]>([]);

  useEffect(() => {
    function load() {
      try {
        const raw = localStorage.getItem(StorageKeys.CHILDREN_CACHE);
        if (raw) {
          const parsed: Child[] = JSON.parse(raw);
          setChildren(parsed.filter(c => {
            const m = getAgeInMonths(c.birthDate);
            return m >= 60 && m <= 216;
          }));
        } else {
          setChildren([]);
        }
      } catch { setChildren([]); }
    }
    load();
    window.addEventListener(WindowEvents.CHILDREN_CHANGED, load);
    return () => window.removeEventListener(WindowEvents.CHILDREN_CHANGED, load);
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.youthTracker' as any)}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.youthTrackerDesc' as any)}</p>
        </div>
      </div>
      {children.length > 0 ? (
        <div className="space-y-1">
          {children.map(child => {
            const months = getAgeInMonths(child.birthDate);
            const years = Math.floor(months / 12);
            return (
              <p key={child.id} className="text-sm text-indigo-700 dark:text-indigo-300">
                {child.name} — {years} {t('childDev.yearsMonthsOld' as any).replace('{years}', String(years)).replace('{months}', String(months % 12)).split(',')[0]}
              </p>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('children.noChildren' as any)}</p>
      )}
    </div>
  );
});

export default YouthTrackerWidget;
