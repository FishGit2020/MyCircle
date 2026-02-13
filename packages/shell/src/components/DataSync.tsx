import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

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
        const raw = localStorage.getItem('stock-tracker-watchlist');
        const watchlist = raw ? JSON.parse(raw) : [];
        syncStockWatchlist(watchlist);
      } catch { /* ignore parse errors */ }
    };

    const handleSubscriptionsChanged = () => {
      try {
        const raw = localStorage.getItem('podcast-subscriptions');
        const subscriptionIds = raw ? JSON.parse(raw) : [];
        syncPodcastSubscriptions(subscriptionIds);
      } catch { /* ignore parse errors */ }
    };

    window.addEventListener('watchlist-changed', handleWatchlistChanged);
    window.addEventListener('subscriptions-changed', handleSubscriptionsChanged);

    return () => {
      window.removeEventListener('watchlist-changed', handleWatchlistChanged);
      window.removeEventListener('subscriptions-changed', handleSubscriptionsChanged);
    };
  }, [user, syncStockWatchlist, syncPodcastSubscriptions]);

  return null;
}
