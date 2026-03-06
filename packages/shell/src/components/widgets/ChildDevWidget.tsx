import React, { useEffect } from 'react';
import { useTranslation, StorageKeys, WindowEvents, getAgeInMonths, getAgeRemainingDays } from '@mycircle/shared';
import type { Child } from '@mycircle/shared';

/* Age range labels for inline lookup (avoids cross-MFE import) */
const CHILD_AGE_RANGES = [
  { min: 0, max: 3, label: '0\u20133 Months' },
  { min: 3, max: 6, label: '3\u20136 Months' },
  { min: 6, max: 9, label: '6\u20139 Months' },
  { min: 9, max: 12, label: '9\u201312 Months' },
  { min: 12, max: 18, label: '12\u201318 Months' },
  { min: 18, max: 24, label: '18\u201324 Months' },
  { min: 24, max: 36, label: '2\u20133 Years' },
  { min: 36, max: 48, label: '3\u20134 Years' },
  { min: 48, max: 60, label: '4\u20135 Years' },
];

function getStageLabel(months: number): string {
  for (const r of CHILD_AGE_RANGES) {
    if (months >= r.min && months < r.max) return r.label;
  }
  return months >= 60 ? '5+ Years' : '';
}

const ChildDevWidget = React.memo(function ChildDevWidget() {
  const { t } = useTranslation();
  const [children, setChildren] = React.useState<Child[]>([]);

  useEffect(() => {
    function load() {
      try {
        const raw = localStorage.getItem(StorageKeys.CHILDREN_CACHE);
        if (raw) {
          const parsed: Child[] = JSON.parse(raw);
          // Filter to 0-60 months (child-dev range)
          setChildren(parsed.filter(c => {
            const m = getAgeInMonths(c.birthDate);
            return m >= 0 && m <= 60;
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

  function formatAge(child: Child): string {
    const ageMonths = getAgeInMonths(child.birthDate);
    const ageDays = getAgeRemainingDays(child.birthDate);
    if (ageMonths >= 24) {
      return t('childDev.yearsMonthsOld' as any).replace('{years}', String(Math.floor(ageMonths / 12))).replace('{months}', String(ageMonths % 12)) + (ageDays > 0 ? ', ' + t('childDev.daysCount' as any).replace('{days}', String(ageDays)) : '');
    }
    return t('childDev.monthsOld' as any).replace('{months}', String(ageMonths)) + (ageDays > 0 ? ', ' + t('childDev.daysCount' as any).replace('{days}', String(ageDays)) : '');
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.childDev')}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.childDevDesc')}</p>
        </div>
      </div>
      {children.length > 0 ? (
        <div className="space-y-1.5">
          {children.map(child => {
            const ageMonths = getAgeInMonths(child.birthDate);
            const stageLabel = getStageLabel(ageMonths);
            return (
              <div key={child.id} className="bg-teal-50/50 dark:bg-teal-900/10 rounded-lg p-2.5">
                <p className="text-sm font-medium text-teal-700 dark:text-teal-300">
                  {child.name} — {formatAge(child)}
                </p>
                {stageLabel && (
                  <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">
                    {stageLabel}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.noChildData')}</p>
      )}
    </div>
  );
});

export default ChildDevWidget;
