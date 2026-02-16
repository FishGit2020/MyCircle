import { useMemo } from 'react';
import { StorageKeys } from '@mycircle/shared';

export interface SearchableItem {
  id: string;
  label: string;
  description: string;
  type: 'stock' | 'city' | 'bookmark';
  /** Route to navigate to */
  route: string;
}

interface WatchlistEntry {
  symbol: string;
  companyName: string;
}

interface BookmarkEntry {
  book: string;
  chapter: number;
  label?: string;
}

function readJSON<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Reads user content from localStorage and builds a flat list of searchable items.
 * This is intentionally read on each palette open (via useMemo with open dependency)
 * so the data stays fresh without needing event listeners.
 */
export function useSearchableContent(isOpen: boolean): SearchableItem[] {
  return useMemo(() => {
    if (!isOpen) return [];

    const items: SearchableItem[] = [];

    // Stock watchlist
    const stocks = readJSON<WatchlistEntry>(StorageKeys.STOCK_WATCHLIST);
    for (const s of stocks) {
      items.push({
        id: `stock-${s.symbol}`,
        label: s.symbol,
        description: s.companyName || s.symbol,
        type: 'stock',
        route: '/stocks',
      });
    }

    // Bible bookmarks
    const bookmarks = readJSON<BookmarkEntry>(StorageKeys.BIBLE_BOOKMARKS);
    for (const b of bookmarks) {
      items.push({
        id: `bookmark-${b.book}-${b.chapter}`,
        label: b.label || `${b.book} ${b.chapter}`,
        description: `${b.book} ${b.chapter}`,
        type: 'bookmark',
        route: '/bible',
      });
    }

    return items;
  }, [isOpen]);
}
