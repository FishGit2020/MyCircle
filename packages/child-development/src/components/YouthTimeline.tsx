import { useMemo } from 'react';
import { useTranslation } from '@mycircle/shared';
import { AGE_RANGES, MILESTONES, DOMAINS } from '../data/youthMilestones';
import type { AgeRange, Domain } from '../data/youthMilestones';

const DOMAIN_COLORS: Record<Domain, { bg: string; text: string; darkBg: string; darkText: string }> = {
  physical:  { bg: 'bg-green-50',  text: 'text-green-700',  darkBg: 'dark:bg-green-900/20',  darkText: 'dark:text-green-300' },
  academic:  { bg: 'bg-blue-50',   text: 'text-blue-700',   darkBg: 'dark:bg-blue-900/20',   darkText: 'dark:text-blue-300' },
  social:    { bg: 'bg-purple-50', text: 'text-purple-700', darkBg: 'dark:bg-purple-900/20', darkText: 'dark:text-purple-300' },
  lifeSkills: { bg: 'bg-amber-50',  text: 'text-amber-700',  darkBg: 'dark:bg-amber-900/20',  darkText: 'dark:text-amber-300' },
};

interface YouthTimelineProps {
  ageInMonths: number | null;
  currentAgeRange: AgeRange | null;
  /** When provided, only show ranges within this group */
  ageRangeIds?: Set<string>;
}

export default function YouthTimeline({ ageInMonths, currentAgeRange, ageRangeIds }: YouthTimelineProps) {
  const { t } = useTranslation();

  const stageStatus = useMemo(() => {
    if (!ageInMonths) return {};
    const result: Record<string, 'past' | 'current' | 'upcoming'> = {};
    for (const range of AGE_RANGES) {
      if (ageInMonths >= range.maxMonths) result[range.id] = 'past';
      else if (currentAgeRange?.id === range.id) result[range.id] = 'current';
      else result[range.id] = 'upcoming';
    }
    return result;
  }, [ageInMonths, currentAgeRange]);

  return (
    <div className="space-y-6">
      {/* Domain Legend */}
      <div className="flex flex-wrap gap-2">
        {DOMAINS.map(d => (
          <span
            key={d.id}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${DOMAIN_COLORS[d.id].bg} ${DOMAIN_COLORS[d.id].text} ${DOMAIN_COLORS[d.id].darkBg} ${DOMAIN_COLORS[d.id].darkText}`}
          >
            {t(d.labelKey as any)}
          </span>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

        {AGE_RANGES.filter(r => !ageRangeIds || ageRangeIds.has(r.id)).map((range) => {
          const status = stageStatus[range.id] || 'upcoming';
          const milestones = MILESTONES.filter(m => m.ageRangeId === range.id);
          const isPast = status === 'past';
          const isCurrent = status === 'current';

          return (
            <div key={range.id} className="relative flex items-start gap-3 pb-6 last:pb-0">
              {/* Timeline dot */}
              <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full shrink-0 text-sm ${
                isPast
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  : isCurrent
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-400 dark:ring-indigo-500'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
              }`}>
                {isPast ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-xs font-bold">{range.id.split('-')[0]}+</span>
                )}
              </div>

              {/* Content */}
              <div className={`flex-1 min-w-0 ${status === 'upcoming' ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className={`text-sm font-semibold ${
                    isCurrent ? 'text-indigo-700 dark:text-indigo-300' :
                    isPast ? 'text-green-700 dark:text-green-300' :
                    'text-gray-500 dark:text-gray-400'
                  }`}>
                    {t(`youth.range_${range.id.replace('-', '_')}` as any) || range.label}
                  </span>
                  {isCurrent && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                      {t('childDev.currentStage' as any)}
                    </span>
                  )}
                  {isPast && (
                    <span className="text-xs text-green-500 dark:text-green-400">
                      {t('childDev.pastStage' as any)}
                    </span>
                  )}
                </div>

                {/* Milestones grouped by domain */}
                {(isCurrent || isPast) && (
                  <div className="space-y-2">
                    {DOMAINS.map(domain => {
                      const domainMilestones = milestones.filter(m => m.domain === domain.id);
                      if (domainMilestones.length === 0) return null;
                      const colors = DOMAIN_COLORS[domain.id];
                      return (
                        <div key={domain.id} className={`rounded-lg p-2.5 ${colors.bg} ${colors.darkBg}`}>
                          <p className={`text-xs font-semibold mb-1 ${colors.text} ${colors.darkText}`}>
                            {t(domain.labelKey as any)}
                          </p>
                          <ul className="space-y-0.5">
                            {domainMilestones.map(ms => (
                              <li key={ms.id} className={`text-xs ${colors.text} ${colors.darkText} opacity-80`}>
                                {t(ms.titleKey as any)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
