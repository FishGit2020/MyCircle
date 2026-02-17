import { useState, useMemo } from 'react';
import { useTranslation } from '@mycircle/shared';
import {
  DOMAINS, AGE_RANGES,
  getMilestonesByDomainAndAge,
} from '../data/milestones';
import type { DomainId, AgeRangeId, AgeRangeMeta } from '../data/milestones';

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

/* ─── Props ────────────────────────────────────────────────────────────────── */

interface TimelineViewProps {
  ageInMonths: number | null;
  currentAgeRange: AgeRangeMeta | null;
  checkedMilestones: string[];
  mode: 'tracking' | 'reference';
  onToggleMilestone: (id: string) => void;
}

/* ─── Component ────────────────────────────────────────────────────────────── */

export default function TimelineView({
  ageInMonths,
  currentAgeRange,
  checkedMilestones,
  mode,
  onToggleMilestone,
}: TimelineViewProps) {
  const { t } = useTranslation();

  const [visibleDomains, setVisibleDomains] = useState<Set<DomainId>>(
    () => new Set(DOMAINS.map(d => d.id)),
  );
  const [expandedCell, setExpandedCell] = useState<{
    domain: DomainId;
    ageRange: AgeRangeId;
  } | null>(null);

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

  /* Completion map: "domain-ageRange" → { checked, total } */
  const progressMap = useMemo(() => {
    const map: Record<string, { checked: number; total: number }> = {};
    for (const domain of DOMAINS) {
      for (const ar of AGE_RANGES) {
        const milestones = getMilestonesByDomainAndAge(domain.id, ar.id);
        const checked = milestones.filter(m => checkedMilestones.includes(m.id)).length;
        map[`${domain.id}-${ar.id}`] = { checked, total: milestones.length };
      }
    }
    return map;
  }, [checkedMilestones]);

  /* Current-age marker as a percentage across the 9 equal-width columns */
  const ageMarkerPercent = useMemo(() => {
    if (ageInMonths === null) return null;
    for (let i = 0; i < AGE_RANGES.length; i++) {
      const ar = AGE_RANGES[i];
      if (ageInMonths >= ar.minMonths && ageInMonths < ar.maxMonths) {
        const segStart = (i / AGE_RANGES.length) * 100;
        const segWidth = (1 / AGE_RANGES.length) * 100;
        const within = (ageInMonths - ar.minMonths) / (ar.maxMonths - ar.minMonths);
        return segStart + within * segWidth;
      }
    }
    return ageInMonths >= 60 ? 100 : null;
  }, [ageInMonths]);

  const activeDomains = DOMAINS.filter(d => visibleDomains.has(d.id));

  /* ─── Expanded milestone panel (shared between desktop & mobile) ──────── */

  const renderExpandedMilestones = (domainId: DomainId, ageRangeId: AgeRangeId) => {
    const arMeta = AGE_RANGES.find(a => a.id === ageRangeId)!;
    const domainMeta = DOMAINS.find(d => d.id === domainId)!;
    const colors = DOMAIN_COLORS[domainMeta.color];
    const milestones = getMilestonesByDomainAndAge(domainId, ageRangeId);

    return (
      <div
        data-testid={`expanded-${domainId}-${ageRangeId}`}
        className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700"
      >
        <h4 className={`text-sm font-semibold mb-2 ${colors.text}`}>
          {t(domainMeta.nameKey as any)} — {t(arMeta.labelKey as any)}
        </h4>
        <div className="space-y-1">
          {milestones.map(m => {
            const isChecked = checkedMilestones.includes(m.id);
            if (mode === 'tracking') {
              return (
                <label key={m.id} className="flex items-center gap-2 py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggleMilestone(m.id)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span
                    className={`text-sm ${
                      isChecked
                        ? 'line-through text-gray-400 dark:text-gray-500'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {t(m.nameKey as any)}
                  </span>
                  {m.isRedFlag && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium">
                      !
                    </span>
                  )}
                </label>
              );
            }
            return (
              <div key={m.id} className="flex items-center gap-2 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {t(m.nameKey as any)}
                </span>
                {m.isRedFlag && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium">
                    {t('childDev.redFlag' as any)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ─── Render ─────────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-4">
      {/* Domain filter chips */}
      <div className="flex flex-wrap gap-2" role="group" aria-label={t('childDev.timeline' as any)}>
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

      {/* ─── Desktop: Horizontal swim-lane timeline ────────────────────────── */}
      <div className="hidden sm:block">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden relative">
          {/* Header row */}
          <div className="flex">
            <div className="w-[140px] shrink-0 p-2 border-b border-gray-200 dark:border-gray-700" />
            <div className="flex-1 grid grid-cols-9">
              {AGE_RANGES.map(ar => {
                const isCurrent = currentAgeRange?.id === ar.id;
                return (
                  <div
                    key={ar.id}
                    className={`p-2 text-[10px] font-medium text-center border-b border-l border-gray-200 dark:border-gray-700 ${
                      isCurrent
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {t(ar.labelKey as any)}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Domain swim-lane rows */}
          {activeDomains.map(domain => {
            const colors = DOMAIN_COLORS[domain.color];
            return (
              <div key={domain.id}>
                <div className="flex">
                  {/* Domain label */}
                  <div className="w-[140px] shrink-0 p-2 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded ${domain.color} text-white flex-shrink-0`}
                    >
                      <DomainIcon icon={domain.icon} className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                      {t(domain.nameKey as any)}
                    </span>
                  </div>

                  {/* Progress cells */}
                  <div className="flex-1 grid grid-cols-9">
                    {AGE_RANGES.map(ar => {
                      const pKey = `${domain.id}-${ar.id}`;
                      const { checked, total } = progressMap[pKey];
                      const percent = total > 0 ? (checked / total) * 100 : 0;
                      const isCurrent = currentAgeRange?.id === ar.id;
                      const isExpanded =
                        expandedCell?.domain === domain.id &&
                        expandedCell?.ageRange === ar.id;

                      return (
                        <button
                          key={ar.id}
                          type="button"
                          onClick={() =>
                            setExpandedCell(
                              isExpanded ? null : { domain: domain.id, ageRange: ar.id },
                            )
                          }
                          className={`p-1.5 border-l border-b border-gray-100 dark:border-gray-700 transition-colors ${
                            isCurrent ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                          } ${
                            isExpanded
                              ? 'ring-2 ring-inset ring-blue-400 dark:ring-blue-500'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          }`}
                          aria-label={`${t(domain.nameKey as any)} ${t(ar.labelKey as any)}: ${checked}/${total}`}
                        >
                          <div className={`h-2.5 rounded-full overflow-hidden ${colors.bg}`}>
                            <div
                              className={`h-full rounded-full ${colors.fill} transition-all duration-300`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 block text-center">
                            {checked}/{total}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Expanded milestone panel below the row */}
                {expandedCell?.domain === domain.id &&
                  renderExpandedMilestones(domain.id, expandedCell.ageRange)}
              </div>
            );
          })}

          {/* Current-age marker (vertical line) */}
          {ageMarkerPercent !== null && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-blue-500/70 dark:bg-blue-400/70 pointer-events-none z-10"
              style={{
                left: `calc(140px + (100% - 140px) * ${ageMarkerPercent / 100})`,
              }}
              data-testid="age-marker"
            >
              <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-blue-500 dark:bg-blue-400 border-2 border-white dark:border-gray-800" />
            </div>
          )}
        </div>
      </div>

      {/* ─── Mobile: Vertical timeline ─────────────────────────────────────── */}
      <div className="sm:hidden space-y-3">
        {AGE_RANGES.map(ar => {
          const isCurrent = currentAgeRange?.id === ar.id;
          return (
            <div
              key={ar.id}
              className={`bg-white dark:bg-gray-800 rounded-xl border-2 p-3 transition-colors ${
                isCurrent
                  ? 'border-blue-400 dark:border-blue-500 shadow-md'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-white">
                  {t(ar.labelKey as any)}
                </h4>
                {isCurrent && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">
                    {t('childDev.currentAge' as any)}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {activeDomains.map(domain => {
                  const pKey = `${domain.id}-${ar.id}`;
                  const { checked, total } = progressMap[pKey];
                  const percent = total > 0 ? (checked / total) * 100 : 0;
                  const colors = DOMAIN_COLORS[domain.color];
                  const isExpanded =
                    expandedCell?.domain === domain.id &&
                    expandedCell?.ageRange === ar.id;

                  return (
                    <div key={domain.id}>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedCell(
                            isExpanded ? null : { domain: domain.id, ageRange: ar.id },
                          )
                        }
                        className="w-full flex items-center gap-2 py-1"
                        aria-label={`${t(domain.nameKey as any)} ${t(ar.labelKey as any)}: ${checked}/${total}`}
                      >
                        <span
                          className={`w-5 h-5 rounded ${domain.color} text-white inline-flex items-center justify-center flex-shrink-0`}
                        >
                          <DomainIcon icon={domain.icon} className="w-3 h-3" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className={`h-2.5 rounded-full overflow-hidden ${colors.bg}`}>
                            <div
                              className={`h-full rounded-full ${colors.fill} transition-all duration-300`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500 w-8 text-right flex-shrink-0">
                          {checked}/{total}
                        </span>
                      </button>

                      {/* Expanded milestones */}
                      {isExpanded && (
                        <div className="pl-7 pt-1 pb-2">
                          {renderExpandedMilestones(domain.id, ar.id)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
