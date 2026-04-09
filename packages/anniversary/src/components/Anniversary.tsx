import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { PageContent, useTranslation } from '@mycircle/shared';
import { useAnniversaries } from '../hooks/useAnniversaries';
import AnniversaryDetail from './AnniversaryDetail';
import AnniversaryForm from './AnniversaryForm';

function yearsElapsed(originalDate: string): number {
  const d = new Date(originalDate);
  const now = new Date();
  let years = now.getFullYear() - d.getFullYear();
  const monthDiff = now.getMonth() - d.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < d.getDate())) {
    years--;
  }
  return Math.max(0, years);
}

function formatDate(dateStr: string, locale: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

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

          {/* Anniversary list */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {anniversaries.map((ann) => {
              const years = yearsElapsed(ann.originalDate);
              const isContributor =
                currentUid && ann.contributorUids.includes(currentUid);
              const isOwner = currentUid === ann.ownerUid;

              return (
                <button
                  key={ann.id}
                  type="button"
                  onClick={() => navigate(`/anniversary/${ann.id}`)}
                  className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
                  aria-label={`${ann.title} - ${years} ${t('anniversary.yearsSince')}`}
                >
                  {/* Title + badges */}
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {ann.title}
                    </h2>
                    <div className="flex flex-shrink-0 gap-1">
                      {isContributor && !isOwner && (
                        <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                          {t('anniversary.shared')}
                        </span>
                      )}
                      {isOwner && (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300">
                          {t('anniversary.owner')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Date */}
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(ann.originalDate, locale)}
                  </p>

                  {/* Years elapsed */}
                  <p className="mt-1 text-lg font-bold text-blue-600 dark:text-blue-400">
                    {years} {t('anniversary.yearsSince')}
                  </p>

                  {/* Location */}
                  {ann.location?.name && (
                    <span className="mt-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      {ann.location.name}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
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
