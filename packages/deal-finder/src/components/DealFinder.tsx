import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation, PageContent } from '@mycircle/shared';
import { useDeals } from '../hooks/useDeals';
import type { DealSource, DealCategory, Deal } from '../types';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function getSourceColor(source: Deal['source']): string {
  switch (source) {
    case 'slickdeals': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
    case 'dealnews': return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
    case 'reddit': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300';
  }
}

function getSourceLabel(source: Deal['source']): string {
  switch (source) {
    case 'slickdeals': return 'SlickDeals';
    case 'dealnews': return 'DealNews';
    case 'reddit': return 'Reddit';
  }
}

const SOURCE_OPTIONS: { key: DealSource; labelKey: string }[] = [
  { key: 'all', labelKey: 'deals.sourceAll' },
  { key: 'slickdeals', labelKey: 'deals.sourceSlickDeals' },
  { key: 'dealnews', labelKey: 'deals.sourceDealNews' },
  { key: 'reddit', labelKey: 'deals.sourceReddit' },
];

const CATEGORY_OPTIONS: { key: DealCategory; labelKey: string }[] = [
  { key: 'all', labelKey: 'deals.categoryAll' },
  { key: 'electronics', labelKey: 'deals.categoryElectronics' },
  { key: 'home', labelKey: 'deals.categoryHome' },
  { key: 'fashion', labelKey: 'deals.categoryFashion' },
  { key: 'grocery', labelKey: 'deals.categoryGrocery' },
  { key: 'other', labelKey: 'deals.categoryOther' },
];

function DealCard({ deal }: { deal: Deal }) {
  const discount = deal.originalPrice && deal.price
    ? Math.round((1 - parseFloat(deal.price.replace(/[^0-9.]/g, '')) / parseFloat(deal.originalPrice.replace(/[^0-9.]/g, ''))) * 100)
    : null;

  return (
    <a
      href={deal.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 transition-shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getSourceColor(deal.source)}`}>
          {getSourceLabel(deal.source)}
        </span>
        {discount != null && discount > 0 && (
          <span className="inline-block rounded-full bg-red-100 dark:bg-red-900/40 px-2 py-0.5 text-xs font-bold text-red-700 dark:text-red-300">
            -{discount}%
          </span>
        )}
      </div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 leading-snug">
        {deal.title}
      </h3>
      <div className="flex items-baseline gap-2 mb-2">
        {deal.price && (
          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{deal.price}</span>
        )}
        {deal.originalPrice && (
          <span className="text-sm text-gray-400 dark:text-gray-500 line-through">{deal.originalPrice}</span>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          {deal.store && (
            <span className="rounded bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 font-medium text-gray-600 dark:text-gray-300">
              {deal.store}
            </span>
          )}
          <span>{timeAgo(deal.postedAt)}</span>
        </div>
        {deal.score != null && (
          <span className="flex items-center gap-0.5">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
            </svg>
            {deal.score}
          </span>
        )}
      </div>
    </a>
  );
}

export default function DealFinder() {
  const { t } = useTranslation();
  const { deals, loading, refresh } = useDeals();
  const [source, setSource] = useState<DealSource>('all');
  const [category, setCategory] = useState<DealCategory>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let result = deals;
    if (source !== 'all') result = result.filter(d => d.source === source);
    if (category !== 'all') result = result.filter(d => d.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.store?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [deals, source, category, search]);

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  return (
    <PageContent maxWidth="6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('deals.title' as any)}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('deals.subtitle' as any)}</p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors min-h-[44px]"
          aria-label={t('deals.refresh' as any)}
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {t('deals.refresh' as any)}
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="search"
          placeholder={t('deals.searchPlaceholder' as any)}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors min-h-[44px]"
        />
      </div>

      {/* Source tabs */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        {SOURCE_OPTIONS.map(opt => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setSource(opt.key)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors min-h-[36px] ${
              source === opt.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {t(opt.labelKey as any)}
          </button>
        ))}
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {CATEGORY_OPTIONS.map(opt => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setCategory(opt.key)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors min-h-[36px] ${
              category === opt.key
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {t(opt.labelKey as any)}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading && deals.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{t('deals.loading' as any)}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{t('deals.noDeals' as any)}</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {filtered.length} {t('deals.dealsFound' as any)}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(deal => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        </>
      )}
    </PageContent>
  );
}
