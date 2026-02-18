import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from '@mycircle/shared';
import {
  DOMAINS, AGE_RANGES,
  getMilestonesByDomainAndAge,
} from '../data/milestones';
import type { DomainId, AgeRangeMeta, AgeRangeId } from '../data/milestones';

/* ─── Domain Icon (local copy shared with ChildDevelopment.tsx) ────────────── */

function DomainIcon({ icon, className = 'w-5 h-5' }: { icon: string; className?: string }) {
  switch (icon) {
    case 'runner':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
    case 'speech-bubble':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
    case 'brain':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
    case 'handshake':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
    case 'muscle':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
    case 'baby':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    default:
      return null;
  }
}

/* ─── Color palette per domain ─────────────────────────────────────────────── */

const DOMAIN_COLORS: Record<string, { bg: string; fill: string; text: string }> = {
  'bg-blue-500':   { bg: 'bg-blue-100 dark:bg-blue-900/20',   fill: 'bg-blue-500',   text: 'text-blue-700 dark:text-blue-300' },
  'bg-purple-500': { bg: 'bg-purple-100 dark:bg-purple-900/20', fill: 'bg-purple-500', text: 'text-purple-700 dark:text-purple-300' },
  'bg-amber-500':  { bg: 'bg-amber-100 dark:bg-amber-900/20',  fill: 'bg-amber-500',  text: 'text-amber-700 dark:text-amber-300' },
  'bg-green-500':  { bg: 'bg-green-100 dark:bg-green-900/20',  fill: 'bg-green-500',  text: 'text-green-700 dark:text-green-300' },
  'bg-red-500':    { bg: 'bg-red-100 dark:bg-red-900/20',      fill: 'bg-red-500',    text: 'text-red-700 dark:text-red-300' },
  'bg-teal-500':   { bg: 'bg-teal-100 dark:bg-teal-900/20',    fill: 'bg-teal-500',   text: 'text-teal-700 dark:text-teal-300' },
};

/* ─── CDC / AAP Resource Links per age range ──────────────────────────────── */

const CDC_LINKS: Record<AgeRangeId, string> = {
  '0-3m':  'https://www.cdc.gov/act-early/milestones/2-months.html',
  '3-6m':  'https://www.cdc.gov/act-early/milestones/4-months.html',
  '6-9m':  'https://www.cdc.gov/act-early/milestones/6-months.html',
  '9-12m': 'https://www.cdc.gov/act-early/milestones/9-months.html',
  '12-18m':'https://www.cdc.gov/act-early/milestones/1-year.html',
  '18-24m':'https://www.cdc.gov/act-early/milestones/18-months.html',
  '2-3y':  'https://www.cdc.gov/act-early/milestones/2-years.html',
  '3-4y':  'https://www.cdc.gov/act-early/milestones/3-years.html',
  '4-5y':  'https://www.cdc.gov/act-early/milestones/4-years.html',
};

const AAP_LINKS: Record<AgeRangeId, string> = {
  '0-3m':  'https://www.healthychildren.org/English/ages-stages/baby/Pages/Developmental-Milestones-1-Month.aspx',
  '3-6m':  'https://www.healthychildren.org/English/ages-stages/baby/Pages/Developmental-Milestones-3-Months.aspx',
  '6-9m':  'https://www.healthychildren.org/English/ages-stages/baby/Pages/Developmental-Milestones-7-Months.aspx',
  '9-12m': 'https://www.healthychildren.org/English/ages-stages/baby/Pages/Developmental-Milestones-12-Months.aspx',
  '12-18m':'https://www.healthychildren.org/English/ages-stages/toddler/Pages/Milestones-During-The-First-2-Years.aspx',
  '18-24m':'https://www.healthychildren.org/English/ages-stages/toddler/Pages/Developmental-Milestones-2-Year-Olds.aspx',
  '2-3y':  'https://www.healthychildren.org/English/ages-stages/toddler/Pages/Developmental-Milestones-2-Year-Olds.aspx',
  '3-4y':  'https://www.healthychildren.org/English/ages-stages/preschool/Pages/Developmental-Milestones-3-to-4-Year-Olds.aspx',
  '4-5y':  'https://www.healthychildren.org/English/ages-stages/preschool/Pages/Developmental-Milestones-4-to-5-Year-Olds.aspx',
};

/* ─── Props ────────────────────────────────────────────────────────────────── */

interface TimelineViewProps {
  ageInMonths: number | null;
  currentAgeRange: AgeRangeMeta | null;
}

/* ─── Component ────────────────────────────────────────────────────────────── */

export default function TimelineView({
  ageInMonths,
  currentAgeRange,
}: TimelineViewProps) {
  const { t } = useTranslation();

  const [visibleDomains, setVisibleDomains] = useState<Set<DomainId>>(
    () => new Set(DOMAINS.map(d => d.id)),
  );
  const [expandedStages, setExpandedStages] = useState<Set<AgeRangeId>>(
    () => new Set(currentAgeRange ? [currentAgeRange.id] : []),
  );

  // Auto-expand current stage when it changes (e.g. birthday edited)
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

  /* Toggle a domain chip on/off (keep at least one visible) */
  const toggleDomain = (domainId: DomainId) => {
    setVisibleDomains(prev => {
      const next = new Set(prev);
      if (next.has(domainId)) {
        if (next.size > 1) next.delete(domainId);
      } else {
        next.add(domainId);
      }
      return next;
    });
  };

  /* Toggle expand/collapse for a stage */
  const toggleStage = (ageRangeId: AgeRangeId) => {
    setExpandedStages(prev => {
      const next = new Set(prev);
      if (next.has(ageRangeId)) next.delete(ageRangeId);
      else next.add(ageRangeId);
      return next;
    });
  };

  /* Determine stage status: past / current / upcoming */
  const getStageStatus = (ar: AgeRangeMeta): 'past' | 'current' | 'upcoming' => {
    if (currentAgeRange?.id === ar.id) return 'current';
    if (ageInMonths !== null && ar.maxMonths <= ageInMonths) return 'past';
    return 'upcoming';
  };

  /* Whether a stage should be expanded (only current auto-expanded, all toggleable) */
  const isExpanded = (ar: AgeRangeMeta): boolean => {
    return expandedStages.has(ar.id);
  };

  /* Count milestones for a stage */
  const getMilestoneCount = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ar of AGE_RANGES) {
      let count = 0;
      for (const domain of DOMAINS) {
        if (visibleDomains.has(domain.id)) {
          count += getMilestonesByDomainAndAge(domain.id, ar.id).length;
        }
      }
      counts[ar.id] = count;
    }
    return counts;
  }, [visibleDomains]);

  const activeDomains = DOMAINS.filter(d => visibleDomains.has(d.id));

  /* ─── Render ─────────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-4">
      {/* CDC attribution */}
      <p className="text-xs text-gray-500 dark:text-gray-400 italic">
        {t('childDev.cdcAttribution' as any)}
      </p>

      {/* Domain filter chips */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Domain filters">
        {DOMAINS.map(domain => {
          const active = visibleDomains.has(domain.id);
          const colors = DOMAIN_COLORS[domain.color];
          return (
            <button
              key={domain.id}
              type="button"
              onClick={() => toggleDomain(domain.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                active
                  ? `${colors.fill} text-white shadow-sm`
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
              }`}
              aria-pressed={active}
            >
              {t(domain.nameKey as any)}
            </button>
          );
        })}
      </div>

      {/* ─── Vertical Timeline ─────────────────────────────────────────────── */}
      <div className="relative pl-8">
        {/* Vertical line */}
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

        <div className="space-y-6">
          {AGE_RANGES.map(ar => {
            const status = getStageStatus(ar);
            const expanded = isExpanded(ar);
            const milestoneCount = getMilestoneCount[ar.id];

            return (
              <div key={ar.id} data-testid={`stage-${ar.id}`}>
                {/* ─── Timeline node ──────────────────────────────────── */}
                <button
                  type="button"
                  onClick={() => toggleStage(ar.id)}
                  className="w-full text-left flex items-start gap-3 group"
                  aria-expanded={expanded}
                >
                  {/* Dot */}
                  <div className="relative -ml-8 flex-shrink-0 mt-0.5">
                    {status === 'past' && (
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center" data-testid={`dot-past-${ar.id}`}>
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    {status === 'current' && (
                      <div className="w-6 h-6 rounded-full border-[3px] border-blue-500 bg-white dark:bg-gray-900 flex items-center justify-center" data-testid={`dot-current-${ar.id}`}>
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      </div>
                    )}
                    {status === 'upcoming' && (
                      <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600" data-testid={`dot-upcoming-${ar.id}`} />
                    )}
                  </div>

                  {/* Label + badge + count */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`text-sm font-semibold ${
                        status === 'upcoming'
                          ? 'text-gray-400 dark:text-gray-500'
                          : 'text-gray-800 dark:text-white'
                      }`}>
                        {t(ar.labelKey as any)}
                      </h4>
                      {status === 'past' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-medium">
                          {t('childDev.pastStage' as any)}
                        </span>
                      )}
                      {status === 'current' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">
                          {t('childDev.currentStage' as any)}
                        </span>
                      )}
                      {status === 'upcoming' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 font-medium">
                          {t('childDev.upcomingStage' as any)}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 ${
                      status === 'upcoming'
                        ? 'text-gray-400 dark:text-gray-500'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {t('childDev.milestoneCount' as any).replace('{count}', String(milestoneCount))}
                    </p>
                  </div>

                  {/* Expand/collapse chevron */}
                  <svg
                    className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform flex-shrink-0 mt-1 ${expanded ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* ─── Expanded milestones ─────────────────────────────── */}
                {expanded && (
                  <div className="mt-3 ml-0 space-y-3">
                    {/* Resource links */}
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={CDC_LINKS[ar.id]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        {t('childDev.cdcGuide' as any)}
                      </a>
                      <a
                        href={AAP_LINKS[ar.id]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        {t('childDev.aapGuide' as any)}
                      </a>
                    </div>

                    {/* Milestones grouped by domain */}
                    {activeDomains.map(domain => {
                      const milestones = getMilestonesByDomainAndAge(domain.id, ar.id);
                      if (milestones.length === 0) return null;
                      const colors = DOMAIN_COLORS[domain.color];

                      return (
                        <div
                          key={domain.id}
                          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded ${domain.color} text-white flex-shrink-0`}>
                              <DomainIcon icon={domain.icon} className="w-3 h-3" />
                            </span>
                            <h5 className={`text-xs font-semibold ${colors.text}`}>
                              {t(domain.nameKey as any)}
                            </h5>
                          </div>
                          <div className="space-y-1">
                            {milestones.map(m => (
                              <div key={m.id} className="flex items-start gap-2 py-0.5">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 flex-shrink-0" />
                                <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                  {t(m.nameKey as any)}
                                </span>
                                {m.isRedFlag && (
                                  <span className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium" title={t('childDev.redFlagInfo' as any)}>
                                    {t('childDev.redFlag' as any)}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
