import { useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import { getMilestonesByAgeRange, getDomainMeta, DOMAINS } from '../../../child-development/src/data/milestones';
import type { AgeRangeId, DomainId } from '../../../child-development/src/data/milestones';
import { useInfantAchievements } from '../hooks/useInfantAchievements';
import MilestoneAchievementRow from './MilestoneAchievementRow';

const INFANT_AGE_RANGES: AgeRangeId[] = ['0-3m', '3-6m', '6-9m', '9-12m', '12-18m'];

type FilterMode = 'all' | 'achieved' | 'upcoming';

interface InfantMilestonesSectionProps {
  selectedChildId: string | null;
}

export default function InfantMilestonesSection({ selectedChildId }: InfantMilestonesSectionProps) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterMode>('all');
  const { achievementMap, loading, logAchievement, updateAchievement, clearAchievement } =
    useInfantAchievements(selectedChildId);

  if (!selectedChildId) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
        {t('babyJournal.milestones.selectChild')}
      </p>
    );
  }

  // Gather all infant milestones across age bands
  const allMilestones = INFANT_AGE_RANGES.flatMap((range) => getMilestonesByAgeRange(range));

  // Apply filter
  const filtered = allMilestones.filter((ms) => {
    if (filter === 'achieved') return achievementMap.has(ms.id);
    if (filter === 'upcoming') return !achievementMap.has(ms.id);
    return true;
  });

  // Group by domain for display
  const byDomain = new Map<DomainId, typeof filtered>();
  for (const ms of filtered) {
    if (!byDomain.has(ms.domain)) byDomain.set(ms.domain, []);
    byDomain.get(ms.domain)!.push(ms);
  }

  return (
    <div className="space-y-4">
      {/* Filter toggle */}
      <div className="flex gap-1 flex-wrap">
        {(['all', 'achieved', 'upcoming'] as FilterMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setFilter(mode)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[44px] ${
              filter === mode
                ? 'bg-pink-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {t(`babyJournal.milestones.filter${mode.charAt(0).toUpperCase() + mode.slice(1)}` as Parameters<typeof t>[0])}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
          ))}
        </div>
      )}

      {/* Milestones grouped by domain */}
      {DOMAINS.filter((d) => byDomain.has(d.id)).map((domain) => {
        const domainMeta = getDomainMeta(domain.id);
        const milestones = byDomain.get(domain.id) ?? [];
        return (
          <div key={domain.id} className="space-y-1">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
              <span className={`inline-block w-2 h-2 rounded-full ${domain.color}`} />
              {domainMeta ? t(domainMeta.nameKey as Parameters<typeof t>[0]) : domain.id}
            </h4>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {milestones.map((ms) => (
                <MilestoneAchievementRow
                  key={ms.id}
                  milestone={ms}
                  achievement={achievementMap.get(ms.id)}
                  onLog={logAchievement}
                  onUpdate={updateAchievement}
                  onClear={clearAchievement}
                />
              ))}
            </div>
          </div>
        );
      })}

      {!loading && filtered.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-1">
          —
        </p>
      )}
    </div>
  );
}
