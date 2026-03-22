import { useState, useEffect, useCallback } from 'react';
import { useQuery, GET_DEALS } from '@mycircle/shared';
import type { GetDealsQuery } from '@mycircle/shared';
import type { Deal } from '../types';

const CACHE_KEY = 'mycircle_deals_cache';
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

interface CacheEntry {
  deals: Deal[];
  timestamp: number;
}

function loadCache(): Deal[] | null {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (!stored) return null;
    const entry: CacheEntry = JSON.parse(stored);
    if (Date.now() - entry.timestamp > CACHE_TTL) return null;
    return entry.deals;
  } catch {
    return null;
  }
}

function saveCache(deals: Deal[]) {
  try {
    const entry: CacheEntry = { deals, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch { /* ignore */ }
}

function mapGqlDeals(data: GetDealsQuery): Deal[] {
  return data.deals.map(d => ({
    id: d.id,
    title: d.title,
    url: d.url,
    source: d.source as Deal['source'],
    price: d.price ?? undefined,
    originalPrice: d.originalPrice ?? undefined,
    store: d.store ?? undefined,
    category: d.category ?? undefined,
    thumbnail: d.thumbnail ?? undefined,
    postedAt: d.postedAt,
    score: d.score ?? undefined,
  }));
}

export function useDeals() {
  const [deals, setDeals] = useState<Deal[]>(() => loadCache() || []);
  const [error, setError] = useState<string | null>(null);

  const { loading, refetch } = useQuery<GetDealsQuery>(GET_DEALS, {
    fetchPolicy: 'cache-and-network',
    onCompleted: (data) => {
      const mapped = mapGqlDeals(data);
      setDeals(mapped);
      saveCache(mapped);
      setError(null);
    },
    onError: (err) => {
      // If GraphQL fails, fall back to cache
      const cached = loadCache();
      if (cached) {
        setDeals(cached);
      }
      setError(err.message);
    },
  });

  const refresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Keep deals up to date on mount (cache-and-network handles this, but for explicit refresh)
  useEffect(() => {
    // Initial load handled by useQuery
  }, []);

  return { deals, loading, error, refresh };
}
