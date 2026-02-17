import { useEffect } from 'react';
import { WindowEvents, StorageKeys } from '@mycircle/shared';
import { useAuth } from '../../context/AuthContext';

/**
 * Invisible component that bridges MFE localStorage events to Firestore.
 * When stock-tracker or podcast-player update localStorage, they dispatch
 * custom window events. DataSync listens and persists to the user's profile.
 */
export default function DataSync() {
  const { user, syncStockWatchlist, syncPodcastSubscriptions, syncChineseLearningProgress, syncEnglishLearningProgress } = useAuth();

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

    const handleChineseProgressChanged = () => {
      try {
        const raw = localStorage.getItem(StorageKeys.CHINESE_LEARNING_PROGRESS);
        const progress = raw ? JSON.parse(raw) : null;
        if (progress) syncChineseLearningProgress(progress);
      } catch { /* ignore parse errors */ }
    };

    const handleEnglishProgressChanged = () => {
      try {
        const raw = localStorage.getItem(StorageKeys.ENGLISH_LEARNING_PROGRESS);
        const progress = raw ? JSON.parse(raw) : null;
        if (progress) syncEnglishLearningProgress(progress);
      } catch { /* ignore parse errors */ }
    };

    window.addEventListener(WindowEvents.WATCHLIST_CHANGED, handleWatchlistChanged);
    window.addEventListener(WindowEvents.SUBSCRIPTIONS_CHANGED, handleSubscriptionsChanged);
    window.addEventListener(WindowEvents.CHINESE_PROGRESS_CHANGED, handleChineseProgressChanged);
    window.addEventListener(WindowEvents.ENGLISH_PROGRESS_CHANGED, handleEnglishProgressChanged);

    return () => {
      window.removeEventListener(WindowEvents.WATCHLIST_CHANGED, handleWatchlistChanged);
      window.removeEventListener(WindowEvents.SUBSCRIPTIONS_CHANGED, handleSubscriptionsChanged);
      window.removeEventListener(WindowEvents.CHINESE_PROGRESS_CHANGED, handleChineseProgressChanged);
      window.removeEventListener(WindowEvents.ENGLISH_PROGRESS_CHANGED, handleEnglishProgressChanged);
    };
  }, [user, syncStockWatchlist, syncPodcastSubscriptions, syncChineseLearningProgress, syncEnglishLearningProgress]);

  return null;
}
