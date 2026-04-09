import { useState } from 'react';
import { useNavigate } from 'react-router';
import { PageContent, useTranslation } from '@mycircle/shared';
import { useAnniversaryDetail } from '../hooks/useAnniversaryDetail';
import { useDeleteAnniversary } from '../hooks/useAnniversaryMutations';
import YearlyTile from './YearlyTile';
import YearlyEditor from './YearlyEditor';
import ContributorManager from './ContributorManager';

interface AnniversaryDetailProps {
  id: string;
}

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

function daysUntilNext(originalDate: string): number {
  const d = new Date(originalDate);
  const now = new Date();
  const thisYear = now.getFullYear();
  let next = new Date(thisYear, d.getMonth(), d.getDate());
  if (next <= now) {
    next = new Date(thisYear + 1, d.getMonth(), d.getDate());
  }
  const diff = next.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function AnniversaryDetail({ id }: AnniversaryDetailProps) {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const { anniversary, loading, error } = useAnniversaryDetail(id);
  const [deleteAnniversary, { loading: deleting }] = useDeleteAnniversary();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingYear, setEditingYear] = useState<number | null>(null);

  const currentUid = window.__currentUid;
  const isOwner = anniversary ? currentUid === anniversary.ownerUid : false;

  const handleDelete = async () => {
    try {
      await deleteAnniversary({ variables: { id } });
      navigate('/anniversary');
    } catch {
      // Error handled by Apollo
    }
  };

  if (loading) {
    return (
      <PageContent>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      </PageContent>
    );
  }

  if (error || !anniversary) {
    return (
      <PageContent>
        <div className="py-8 text-center">
          <p className="text-red-600 dark:text-red-400" role="alert">
            {error?.message ?? 'Anniversary not found'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/anniversary')}
            className="mt-4 min-h-[44px] text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            aria-label={t('anniversary.back')}
          >
            {t('anniversary.back')}
          </button>
        </div>
      </PageContent>
    );
  }

  const years = yearsElapsed(anniversary.originalDate);
  const daysNext = daysUntilNext(anniversary.originalDate);
  const isToday = daysNext === 365 || daysNext === 366 || daysNext === 0;

  // Find the year data being edited
  const editingYearData = editingYear !== null
    ? anniversary.years.find((y) => y.yearNumber === editingYear) ?? null
    : null;

  return (
    <PageContent>
      <div className="space-y-6">
        {/* Back button */}
        <button
          type="button"
          onClick={() => navigate('/anniversary')}
          className="inline-flex min-h-[44px] items-center text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          aria-label={t('anniversary.back')}
        >
          <svg
            className="mr-1 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('anniversary.back')}
        </button>

        {/* Header section */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {anniversary.title}
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t('anniversary.originalEvent')}: {formatDate(anniversary.originalDate, locale)}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {years} {t('anniversary.yearsSince')}
                </span>
                {isToday ? (
                  <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">
                    {t('anniversary.happyAnniversary')}
                  </span>
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {daysNext} {t('anniversary.daysUntil')}
                  </span>
                )}
              </div>
              {anniversary.location?.name && (
                <span className="mt-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  {anniversary.location.name}
                </span>
              )}
            </div>

            {/* Owner actions */}
            {isOwner && (
              <div className="flex-shrink-0">
                {confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-red-600 dark:text-red-400">
                      {t('anniversary.confirmDelete')}
                    </span>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="min-h-[44px] rounded-md bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-600"
                      aria-label={t('anniversary.delete')}
                    >
                      {deleting ? '...' : t('anniversary.delete')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="min-h-[44px] rounded-md px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                      aria-label={t('anniversary.cancel')}
                    >
                      {t('anniversary.cancel')}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="min-h-[44px] rounded-md px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    aria-label={t('anniversary.delete')}
                  >
                    {t('anniversary.delete')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Yearly tiles grid */}
        <section aria-label={t('anniversary.year')}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {anniversary.years.map((yearData) => (
              <YearlyTile
                key={yearData.yearNumber}
                yearData={yearData}
                onClick={() => setEditingYear(yearData.yearNumber)}
              />
            ))}
          </div>
        </section>

        {/* Contributor Manager (owner only) */}
        {isOwner && (
          <section
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            aria-label={t('anniversary.contributors')}
          >
            <ContributorManager
              anniversaryId={anniversary.id}
              ownerUid={anniversary.ownerUid}
              contributors={anniversary.contributors}
              contributorUids={anniversary.contributorUids}
            />
          </section>
        )}
      </div>

      {/* Yearly Editor modal */}
      {editingYear !== null && (
        <YearlyEditor
          anniversaryId={anniversary.id}
          yearNumber={editingYear}
          yearData={editingYearData}
          onClose={() => setEditingYear(null)}
        />
      )}
    </PageContent>
  );
}
