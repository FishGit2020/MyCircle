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

// Demo deals used when the API is not configured yet
const DEMO_DEALS: Deal[] = [
  {
    id: 'demo-1',
    title: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
    url: '#',
    source: 'slickdeals',
    price: '$248.00',
    originalPrice: '$399.99',
    store: 'Amazon',
    category: 'electronics',
    postedAt: new Date().toISOString(),
    score: 245,
  },
  {
    id: 'demo-2',
    title: 'Costco Membership + $45 Digital Costco Shop Card',
    url: '#',
    source: 'slickdeals',
    price: '$65.00',
    store: 'Costco',
    category: 'other',
    postedAt: new Date(Date.now() - 3600000).toISOString(),
    score: 189,
  },
  {
    id: 'demo-3',
    title: 'Apple AirPods Pro 2nd Gen USB-C',
    url: '#',
    source: 'dealnews',
    price: '$169.99',
    originalPrice: '$249.00',
    store: 'Walmart',
    category: 'electronics',
    postedAt: new Date(Date.now() - 7200000).toISOString(),
    score: 312,
  },
  {
    id: 'demo-4',
    title: 'KitchenAid Artisan 5-Quart Stand Mixer',
    url: '#',
    source: 'reddit',
    price: '$279.99',
    originalPrice: '$449.99',
    store: 'Amazon',
    category: 'home',
    postedAt: new Date(Date.now() - 10800000).toISOString(),
    score: 156,
  },
  {
    id: 'demo-5',
    title: 'Nintendo Switch OLED Bundle w/ Mario Kart 8',
    url: '#',
    source: 'reddit',
    price: '$299.99',
    originalPrice: '$349.99',
    store: 'Target',
    category: 'electronics',
    postedAt: new Date(Date.now() - 14400000).toISOString(),
    score: 198,
  },
  {
    id: 'demo-6',
    title: 'Dyson V15 Detect Cordless Vacuum',
    url: '#',
    source: 'dealnews',
    price: '$449.99',
    originalPrice: '$749.99',
    store: 'Best Buy',
    category: 'home',
    postedAt: new Date(Date.now() - 18000000).toISOString(),
    score: 267,
  },
  {
    id: 'demo-7',
    title: 'Levi\'s 501 Original Fit Jeans',
    url: '#',
    source: 'slickdeals',
    price: '$29.99',
    originalPrice: '$69.50',
    store: 'Amazon',
    category: 'fashion',
    postedAt: new Date(Date.now() - 21600000).toISOString(),
    score: 134,
  },
  {
    id: 'demo-8',
    title: 'Tide Pods 112-Count Laundry Detergent',
    url: '#',
    source: 'dealnews',
    price: '$19.94',
    originalPrice: '$31.99',
    store: 'Walmart',
    category: 'grocery',
    postedAt: new Date(Date.now() - 25200000).toISOString(),
    score: 89,
  },
];

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
  const [deals, setDeals] = useState<Deal[]>(() => loadCache() || DEMO_DEALS);
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
      // If GraphQL fails, fall back to cache or demo deals
      const cached = loadCache();
      if (cached) {
        setDeals(cached);
      } else {
        setDeals(DEMO_DEALS);
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
