import { useEffect } from 'react';
import { WindowEvents, StorageKeys } from '@mycircle/shared';
import { useAuth } from '../../context/AuthContext';
import { updateLastPlayed } from '../../lib/firebase';
import type { LastPlayedData } from '../../lib/firebase';

/**
 * Invisible component that bridges MFE localStorage events to Firestore.
 * When stock-tracker or podcast-player update localStorage, they dispatch
 * custom window events. DataSync listens and persists to the user's profile.
 */
export default function DataSync() {
  const { user, syncStockWatchlist, syncPodcastSubscriptions } = useAuth();

  useEffect(() => {
    if (!user) return;

    const handleWatchlistChanged = () => {
      try {
        const raw = localStorage.getItem(StorageKeys.STOCK_WATCHLIST);
        const watchlist = raw ? JSON.parse(raw) : [];
        syncStockWatchlist(watchlist);
      } catch { /* ignore parse errors */ }
    };

    const handleSubscriptionsChanged = () => {
      try {
        const raw = localStorage.getItem(StorageKeys.PODCAST_SUBSCRIPTIONS);
        const subscriptionIds = raw ? JSON.parse(raw) : [];
        syncPodcastSubscriptions(subscriptionIds);
      } catch { /* ignore parse errors */ }
    };

    const handleLastPlayedChanged = () => {
      try {
        const raw = localStorage.getItem(StorageKeys.PODCAST_LAST_PLAYED);
        const data: LastPlayedData | null = raw ? JSON.parse(raw) : null;
        updateLastPlayed(user.uid, data);
      } catch { /* ignore parse errors */ }
    };

    window.addEventListener(WindowEvents.WATCHLIST_CHANGED, handleWatchlistChanged);
    window.addEventListener(WindowEvents.SUBSCRIPTIONS_CHANGED, handleSubscriptionsChanged);
    window.addEventListener(WindowEvents.LAST_PLAYED_CHANGED, handleLastPlayedChanged);

    return () => {
      window.removeEventListener(WindowEvents.WATCHLIST_CHANGED, handleWatchlistChanged);
      window.removeEventListener(WindowEvents.SUBSCRIPTIONS_CHANGED, handleSubscriptionsChanged);
      window.removeEventListener(WindowEvents.LAST_PLAYED_CHANGED, handleLastPlayedChanged);
    };
  }, [user, syncStockWatchlist, syncPodcastSubscriptions]);

  return null;
}
