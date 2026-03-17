import { useState, useMemo, useEffect } from 'react';
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
  ageRangeIds?: Set<string>;
  checkedMilestones?: Set<string>;
  onToggleMilestone?: (milestoneId: string) => void;
}

export default function YouthTimeline({ ageInMonths, currentAgeRange, ageRangeIds, checkedMilestones, onToggleMilestone }: YouthTimelineProps) {
  const { t } = useTranslation();

  const [expandedStages, setExpandedStages] = useState<Set<string>>(
    () => new Set(currentAgeRange ? [currentAgeRange.id] : []),
  );

  // Auto-expand current stage when it changes
  useEffect(() => {
    if (currentAgeRange) {
      setExpandedStages(prev => {
        if (prev.has(currentAgeRange.id)) return prev;
        const next = new Set(prev);
        next.add(currentAgeRange.id);
        return next;
      });
    }
  }, [currentAgeRange]);

  const toggleStage = (id: string) => {
    setExpandedStages(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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

  const filteredRanges = ageRangeIds
    ? AGE_RANGES.filter(r => ageRangeIds.has(r.id))
    : AGE_RANGES;

  return (
    <div className="space-y-6">
      {/* Domain Legend */}
      <div className="flex flex-wrap gap-2">
        {DOMAINS.map(d => (
          <span
            key={d.id}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${DOMAIN_COLORS[d.id].bg} ${DOMAIN_COLORS[d.id].text} ${DOMAIN_COLORS[d.id].darkBg} ${DOMAIN_COLORS[d.id].darkText}`}
          >
            {t(d.labelKey as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          </span>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

        {filteredRanges.map((range) => {
          const status = stageStatus[range.id] || 'upcoming';
          const milestones = MILESTONES.filter(m => m.ageRangeId === range.id);
          const isPast = status === 'past';
          const isCurrent = status === 'current';
          const expanded = expandedStages.has(range.id);

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
                  <span className="text-xs font-bold">{range.id.split('-')[0]}</span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Clickable header */}
                <button
                  type="button"
                  onClick={() => toggleStage(range.id)}
                  className="w-full text-left flex items-center gap-2 flex-wrap mb-2"
                  aria-expanded={expanded}
                >
                  <span className={`text-sm font-semibold ${
                    isCurrent ? 'text-indigo-700 dark:text-indigo-300' :
                    isPast ? 'text-green-700 dark:text-green-300' :
                    'text-gray-600 dark:text-gray-300'
                  }`}>
                    {range.label}
                  </span>
                  {isCurrent && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                      {t('childDev.currentStage' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                    </span>
                  )}
                  {isPast && (
                    <span className="text-xs text-green-500 dark:text-green-400">
                      {t('childDev.pastStage' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                    </span>
                  )}
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
                    {milestones.length} {t('childDev.milestones' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                  </span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expandable content */}
                {expanded && (
                  <div className="space-y-2">
                    {DOMAINS.map(domain => {
                      const domainMilestones = milestones.filter(m => m.domain === domain.id);
                      if (domainMilestones.length === 0) return null;
                      const colors = DOMAIN_COLORS[domain.id];
                      return (
                        <div key={domain.id} className={`rounded-lg p-2.5 ${colors.bg} ${colors.darkBg}`}>
                          <p className={`text-xs font-semibold mb-1 ${colors.text} ${colors.darkText}`}>
                            {t(domain.labelKey as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                          </p>
                          <div className="space-y-0.5">
                            {domainMilestones.map(ms => {
                              const checked = checkedMilestones?.has(ms.id) ?? false;
                              return (
                                <label key={ms.id} className="flex items-start gap-2 py-0.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => onToggleMilestone?.(ms.id)}
                                    className="mt-0.5 w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-blue-500 focus:ring-blue-500 dark:bg-gray-700 flex-shrink-0"
                                  />
                                  <span className={`text-xs transition-colors ${checked ? 'line-through opacity-50' : `${colors.text} ${colors.darkText} opacity-80`}`}>
                                    {t(ms.titleKey as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {/* CDC guide link */}
                    {range.cdcLink && (
                      <a
                        href={range.cdcLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
                      >
                        {t('childDev.cdcGuide' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
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
