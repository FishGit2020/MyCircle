import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  PageContent, useTranslation,
  yearsElapsed, daysUntilNextFixed, daysUntilNextFloating, resolveFloatingDate,
} from '@mycircle/shared';
import type { FloatingRule } from '@mycircle/shared';
import { useAnniversaries } from '../hooks/useAnniversaries';
import AnniversaryDetail from './AnniversaryDetail';
import AnniversaryForm from './AnniversaryForm';
import AnniversaryMap from './AnniversaryMap';

export default function Anniversary() {
  const { id } = useParams<{ id?: string }>();
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);

  if (id) {
    return <AnniversaryDetail id={id} />;
  }

  return <AnniversaryList />;

  function AnniversaryList() {
    const { anniversaries, loading, error } = useAnniversaries();
    const currentUid = window.__currentUid;
    const thisYear = new Date().getFullYear();

    // Compute daysNext and nextDate for each anniversary, then sort by soonest
    const sorted = useMemo(() => {
      return anniversaries
        .map((ann) => {
          const rule = ann.floatingRule as FloatingRule | null;
          const daysNext = rule
            ? daysUntilNextFloating(rule)
            : daysUntilNextFixed(ann.originalDate);
          // Compute the next upcoming date
          let nextDate: Date;
          if (rule) {
            nextDate = resolveFloatingDate(rule, thisYear);
            const today = new Date(); today.setHours(0, 0, 0, 0);
            if (nextDate <= today) nextDate = resolveFloatingDate(rule, thisYear + 1);
          } else {
            const orig = new Date(ann.originalDate);
            nextDate = new Date(thisYear, orig.getMonth(), orig.getDate());
            const today = new Date(); today.setHours(0, 0, 0, 0);
            if (nextDate < today) nextDate = new Date(thisYear + 1, orig.getMonth(), orig.getDate());
          }
          return { ann, daysNext, nextDate, rule };
        })
        .sort((a, b) => a.daysNext - b.daysNext);
    }, [anniversaries, thisYear]);

    // Collect map locations from all anniversaries that have lat/lon
    const mapLocations = useMemo(() => {
      return sorted
        .filter((s) => s.ann.location && s.ann.location.lat !== 0 && s.ann.location.lon !== 0)
        .map((s) => ({
          lat: s.ann.location!.lat,
          lon: s.ann.location!.lon,
          label: s.ann.title,
          anniversaryId: s.ann.id,
        }));
    }, [sorted]);

    if (loading) {
      return (
        <PageContent>
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        </PageContent>
      );
    }

    if (error) {
      return (
        <PageContent>
          <div className="py-8 text-center text-red-600 dark:text-red-400" role="alert">
            {error.message}
          </div>
        </PageContent>
      );
    }

    return (
      <PageContent>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {t('anniversary.title')}
            </h1>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex min-h-[44px] items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              aria-label={t('anniversary.createNew')}
            >
              {t('anniversary.createNew')}
            </button>
          </div>

          {/* Empty state */}
          {anniversaries.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-600">
              <p className="text-gray-500 dark:text-gray-400">
                {t('anniversary.noAnniversaries')}
              </p>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-4 inline-flex min-h-[44px] items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                aria-label={t('anniversary.createNew')}
              >
                {t('anniversary.createNew')}
              </button>
            </div>
          )}

          {/* Map + list layout */}
          {sorted.length > 0 && (
            <div className="flex flex-col gap-6 lg:flex-row">
              {/* Map */}
              <div className="w-full lg:w-1/2">
                <AnniversaryMap
                  locations={mapLocations}
                  onMarkerClick={(id) => navigate(`/anniversary/${id}`)}
                />
              </div>

              {/* Anniversary tiles — sorted by soonest */}
              <div className="w-full space-y-3 lg:w-1/2 lg:max-h-[400px] lg:overflow-y-auto">
                {sorted.map(({ ann, daysNext, nextDate, rule }) => {
                  const years = yearsElapsed(ann.originalDate);
                  const nextDateStr = nextDate.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
                  const isContributor = currentUid && ann.contributorUids.includes(currentUid);
                  const isOwner = currentUid === ann.ownerUid;

                  return (
                    <button
                      key={ann.id}
                      type="button"
                      onClick={() => navigate(`/anniversary/${ann.id}`)}
                      className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
                      aria-label={`${ann.title} - ${years} ${t('anniversary.yearsSince')}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {ann.title}
                          </h2>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {t('anniversary.nextOccurrence', { date: nextDateStr })}
                          </p>
                        </div>
                        <div className="flex flex-shrink-0 flex-col items-end gap-1">
                          <span className={`text-lg font-bold ${daysNext === 0 ? 'text-rose-500' : daysNext <= 30 ? 'text-amber-500' : 'text-blue-600 dark:text-blue-400'}`}>
                            {daysNext === 0 ? t('anniversary.today') : t('anniversary.daysUntil', { days: String(daysNext) })}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {years} {t('anniversary.yearsSince')}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {rule && (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                            {t('anniversary.floatingHoliday')}
                          </span>
                        )}
                        {isContributor && !isOwner && (
                          <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                            {t('anniversary.shared')}
                          </span>
                        )}
                        {ann.location?.name && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                            {ann.location.name}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Create form modal */}
        <AnniversaryForm
          open={showForm}
          onClose={() => setShowForm(false)}
          onCreated={(newId) => navigate(`/anniversary/${newId}`)}
        />
      </PageContent>
    );
  }
}
