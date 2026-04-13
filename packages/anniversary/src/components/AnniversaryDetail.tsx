import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  PageContent, useTranslation,
  yearsElapsed, formatDateLocale, daysUntilNextFixed, daysUntilNextFloating, resolveFloatingDate,
} from '@mycircle/shared';
import type { FloatingRule } from '@mycircle/shared';
import { useAnniversaryDetail } from '../hooks/useAnniversaryDetail';
import { useDeleteAnniversary, useUpdateAnniversary } from '../hooks/useAnniversaryMutations';
import YearlyTile from './YearlyTile';
import YearlyEditor from './YearlyEditor';
import ContributorManager from './ContributorManager';
import AnniversaryMap from './AnniversaryMap';

interface AnniversaryDetailProps {
  id: string;
}

const WEEKDAY_KEYS: Record<number, string> = {
  0: 'anniversary.sunday', 1: 'anniversary.monday', 2: 'anniversary.tuesday',
  3: 'anniversary.wednesday', 4: 'anniversary.thursday', 5: 'anniversary.friday',
  6: 'anniversary.saturday',
};

const ORDINAL_KEYS: Record<number, string> = {
  1: 'anniversary.ordinal1', 2: 'anniversary.ordinal2', 3: 'anniversary.ordinal3',
  4: 'anniversary.ordinal4', 5: 'anniversary.ordinal5', '-1': 'anniversary.ordinalLast',
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function AnniversaryDetail({ id }: AnniversaryDetailProps) {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const { anniversary, loading, error } = useAnniversaryDetail(id);
  const [deleteAnniversary, { loading: deleting }] = useDeleteAnniversary();
  const [updateAnniversary] = useUpdateAnniversary(id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingYear, setEditingYear] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [editingDate, setEditingDate] = useState(false);
  const [dateDraft, setDateDraft] = useState('');

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

  const rule = anniversary.floatingRule as FloatingRule | null;
  const years = yearsElapsed(anniversary.originalDate);
  const daysNext = rule
    ? daysUntilNextFloating(rule)
    : daysUntilNextFixed(anniversary.originalDate);
  const isToday = daysNext === 0;

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
              {editingTitle && isOwner ? (
                <form
                  className="flex items-center gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const trimmed = titleDraft.trim();
                    if (!trimmed || trimmed === anniversary.title) {
                      setEditingTitle(false);
                      return;
                    }
                    await updateAnniversary({ variables: { id, input: { title: trimmed } } });
                    setEditingTitle(false);
                  }}
                >
                  <input
                    type="text"
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    maxLength={100}
                    autoFocus
                    className="text-2xl font-bold text-gray-900 dark:text-gray-100 bg-transparent border-b-2 border-blue-500 outline-none w-full"
                    onKeyDown={(e) => { if (e.key === 'Escape') setEditingTitle(false); }}
                  />
                  <button
                    type="submit"
                    className="min-h-[44px] rounded-md px-2 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                  >
                    {t('anniversary.save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingTitle(false)}
                    className="min-h-[44px] rounded-md px-2 py-1 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                  >
                    {t('anniversary.cancel')}
                  </button>
                </form>
              ) : (
                <h1
                  className={`text-2xl font-bold text-gray-900 dark:text-gray-100 ${isOwner ? 'cursor-pointer hover:text-blue-600 dark:hover:text-blue-400' : ''}`}
                  onClick={isOwner ? () => { setTitleDraft(anniversary.title); setEditingTitle(true); } : undefined}
                  title={isOwner ? t('anniversary.editTitle') : undefined}
                >
                  {anniversary.title}
                  {isOwner && (
                    <svg className="inline-block ml-2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                    </svg>
                  )}
                </h1>
              )}
              {editingDate && isOwner && !rule ? (
                <form
                  className="mt-1 flex items-center gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!dateDraft) { setEditingDate(false); return; }
                    await updateAnniversary({ variables: { id, input: { originalDate: dateDraft } } });
                    setEditingDate(false);
                  }}
                >
                  <input
                    type="date"
                    value={dateDraft}
                    onChange={(e) => setDateDraft(e.target.value)}
                    autoFocus
                    className="rounded-md border-b-2 border-blue-500 bg-transparent px-1 py-0.5 text-sm text-gray-900 outline-none dark:text-gray-100"
                    onKeyDown={(e) => { if (e.key === 'Escape') setEditingDate(false); }}
                  />
                  <button
                    type="submit"
                    className="min-h-[44px] rounded-md px-2 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                  >
                    {t('anniversary.save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingDate(false)}
                    className="min-h-[44px] rounded-md px-2 py-1 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                  >
                    {t('anniversary.cancel')}
                  </button>
                </form>
              ) : (
                <p
                  className={`mt-1 text-sm text-gray-500 dark:text-gray-400 ${isOwner && !rule ? 'cursor-pointer hover:text-blue-600 dark:hover:text-blue-400' : ''}`}
                  onClick={isOwner && !rule ? () => {
                    const d = new Date(anniversary.originalDate);
                    setDateDraft(d.toISOString().split('T')[0]);
                    setEditingDate(true);
                  } : undefined}
                  title={isOwner && !rule ? t('anniversary.editDate') : undefined}
                >
                  {rule ? (
                    <>
                      {t('anniversary.floatingDescription', {
                        ordinal: t(ORDINAL_KEYS[rule.ordinal] as never),
                        weekday: t(WEEKDAY_KEYS[rule.weekday] as never),
                        month: MONTH_NAMES[rule.month],
                      })}
                      {' \u2014 '}
                      {resolveFloatingDate(rule, new Date().getFullYear()).toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </>
                  ) : (
                    <>
                      {t('anniversary.originalEvent')}: {formatDateLocale(anniversary.originalDate, locale)}
                      {isOwner && (
                        <svg className="inline-block ml-2 w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                      )}
                    </>
                  )}
                </p>
              )}
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
                    {t('anniversary.daysUntil', { days: String(daysNext) })}
                  </span>
                )}
              </div>
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

        {/* Map — show all locations from all years + anniversary-level location */}
        {(() => {
          const mapLocations: Array<{ lat: number; lon: number; label: string; anniversaryId: string; year?: number }> = [];
          anniversary.years.forEach((y) => {
            const locs = (y as unknown as { locations?: Array<{ lat: number; lon: number; name?: string | null }> }).locations;
            if (locs) {
              locs.forEach((loc) => {
                if (loc.lat !== 0 || loc.lon !== 0) {
                  mapLocations.push({
                    lat: loc.lat,
                    lon: loc.lon,
                    label: loc.name || `Year ${y.yearNumber}`,
                    anniversaryId: anniversary.id,
                    year: y.year,
                  });
                }
              });
            }
          });
          if (mapLocations.length === 0) return null;
          return (
            <section aria-label={t('anniversary.locations')}>
              <AnniversaryMap locations={mapLocations} />
            </section>
          );
        })()}

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
