import { WindowEvents, StorageKeys } from '@mycircle/shared';
import {
  UserProfile,
  RecentCity,
  FavoriteCity,
  getDailyLogEntries,
  getUserFiles,
  getWorshipSongs,
  getBenchmarkSummary,
  getUserNotes,
  migrateToMultiChild,
  getChildren,
} from '../lib/firebase';

export interface RestoreResult {
  recentCities: RecentCity[];
  favoriteCities: FavoriteCity[];
}

/**
 * Pure function: restores a user profile's data into localStorage and
 * dispatches the corresponding window events so MFE hooks pick up the changes.
 * Returns city arrays for state initialisation in AuthProvider.
 */
export function restoreUserData(profile: UserProfile, uid: string): RestoreResult {
  const recentCities = profile.recentCities || [];
  const favoriteCities = profile.favoriteCities || [];

  // Restore saved preferences to localStorage so shared hooks pick them up
  if (profile.theme) {
    localStorage.setItem(StorageKeys.THEME, profile.theme);
    window.dispatchEvent(new Event(WindowEvents.THEME_CHANGED));
  }
  if (profile.tempUnit) {
    localStorage.setItem(StorageKeys.TEMP_UNIT, profile.tempUnit);
    window.dispatchEvent(new Event(WindowEvents.UNITS_CHANGED));
  }
  if (profile.speedUnit) {
    localStorage.setItem(StorageKeys.SPEED_UNIT, profile.speedUnit);
    window.dispatchEvent(new Event(WindowEvents.UNITS_CHANGED));
  }
  if (profile.distanceUnit) {
    localStorage.setItem(StorageKeys.DISTANCE_UNIT, profile.distanceUnit);
    window.dispatchEvent(new Event(WindowEvents.UNITS_CHANGED));
  }

  // Restore stock watchlist
  if (profile.stockWatchlist && profile.stockWatchlist.length > 0) {
    localStorage.setItem(StorageKeys.STOCK_WATCHLIST, JSON.stringify(profile.stockWatchlist));
    window.dispatchEvent(new Event(WindowEvents.WATCHLIST_CHANGED));
  }

  // Restore podcast subscriptions
  if (profile.podcastSubscriptions && profile.podcastSubscriptions.length > 0) {
    localStorage.setItem(StorageKeys.PODCAST_SUBSCRIPTIONS, JSON.stringify(profile.podcastSubscriptions));
    window.dispatchEvent(new Event(WindowEvents.SUBSCRIPTIONS_CHANGED));
  }

  // Restore baby due date
  if (profile.babyDueDate) {
    localStorage.setItem(StorageKeys.BABY_DUE_DATE, profile.babyDueDate);
    window.dispatchEvent(new Event(WindowEvents.BABY_DUE_DATE_CHANGED));
  }

  // Restore bottom nav order
  if (profile.bottomNavOrder && profile.bottomNavOrder.length > 0) {
    localStorage.setItem(StorageKeys.BOTTOM_NAV_ORDER, JSON.stringify(profile.bottomNavOrder));
    window.dispatchEvent(new Event(WindowEvents.BOTTOM_NAV_ORDER_CHANGED));
  }

  // Restore Bible bookmarks
  if (profile.bibleBookmarks && profile.bibleBookmarks.length > 0) {
    localStorage.setItem(StorageKeys.BIBLE_BOOKMARKS, JSON.stringify(profile.bibleBookmarks));
    window.dispatchEvent(new Event(WindowEvents.BIBLE_BOOKMARKS_CHANGED));
  }

  // Restore worship favorites
  if (profile.worshipFavorites && profile.worshipFavorites.length > 0) {
    localStorage.setItem(StorageKeys.WORSHIP_FAVORITES, JSON.stringify(profile.worshipFavorites));
    window.dispatchEvent(new Event(WindowEvents.WORSHIP_FAVORITES_CHANGED));
  }

  // Restore last-played podcast for cross-device resume
  if (profile.lastPlayed?.episode) {
    const lp = profile.lastPlayed;
    localStorage.setItem(StorageKeys.PODCAST_LAST_PLAYED, JSON.stringify(lp));
    localStorage.setItem(StorageKeys.PODCAST_NOW_PLAYING, JSON.stringify({
      episode: lp.episode,
      podcast: lp.podcast,
    }));
    // Merge position into progress map (take the further position)
    try {
      const progressRaw = localStorage.getItem(StorageKeys.PODCAST_PROGRESS);
      const progress: Record<string, { position: number; duration: number }> = progressRaw ? JSON.parse(progressRaw) : {};
      const key = String(lp.episode.id);
      const existing = progress[key];
      if (!existing || lp.position > existing.position) {
        progress[key] = { position: lp.position, duration: existing?.duration || 0 };
        localStorage.setItem(StorageKeys.PODCAST_PROGRESS, JSON.stringify(progress));
      }
    } catch { /* ignore */ }
    window.dispatchEvent(new Event(WindowEvents.LAST_PLAYED_CHANGED));
  }

  // Restore podcast played episodes
  if (profile.podcastPlayedEpisodes && profile.podcastPlayedEpisodes.length > 0) {
    // Merge with existing local played episodes
    try {
      const localRaw = localStorage.getItem(StorageKeys.PODCAST_PLAYED_EPISODES);
      const local: string[] = localRaw ? JSON.parse(localRaw) : [];
      const merged = [...new Set([...local, ...profile.podcastPlayedEpisodes])];
      localStorage.setItem(StorageKeys.PODCAST_PLAYED_EPISODES, JSON.stringify(merged));
    } catch {
      localStorage.setItem(StorageKeys.PODCAST_PLAYED_EPISODES, JSON.stringify(profile.podcastPlayedEpisodes));
    }
    window.dispatchEvent(new Event(WindowEvents.PODCAST_PLAYED_CHANGED));
  }

  // Restore Child Development data
  if (profile.childName) {
    localStorage.setItem(StorageKeys.CHILD_NAME, profile.childName);
  }
  if (profile.childBirthDate) {
    // Firestore may have a plain date (new) or btoa-encoded date (legacy).
    // Normalise to plain first, then encode for localStorage.
    let plainDate = profile.childBirthDate;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(plainDate)) {
      try { plainDate = atob(plainDate); } catch { /* use as-is */ }
    }
    // btoa() is safe for date strings (pure ASCII); no fallback needed
    localStorage.setItem(StorageKeys.CHILD_BIRTH_DATE, btoa(plainDate));
  }
  if (profile.childName || profile.childBirthDate) {
    window.dispatchEvent(new Event(WindowEvents.CHILD_DATA_CHANGED));
  }

  // Always restore widget layout from Firestore on sign-in — Firestore is source of truth
  // New format: { pinned: string[], size: string }; old array format is ignored
  const wl = profile.widgetLayout as any;
  if (wl && typeof wl === 'object' && !Array.isArray(wl) && Array.isArray(wl.pinned)) {
    localStorage.setItem(StorageKeys.WIDGET_LAYOUT, JSON.stringify(wl));
    window.dispatchEvent(new Event(WindowEvents.WIDGET_LAYOUT_CHANGED));
  }

  // Restore book bookmarks
  if (profile.bookBookmarks && profile.bookBookmarks.length > 0) {
    localStorage.setItem(StorageKeys.BOOK_BOOKMARKS, JSON.stringify(profile.bookBookmarks));
    window.dispatchEvent(new Event(WindowEvents.BOOK_BOOKMARKS_CHANGED));
  }

  // Restore book audio progress
  if (profile.bookAudioProgress) {
    localStorage.setItem(StorageKeys.BOOK_AUDIO_PROGRESS, JSON.stringify(profile.bookAudioProgress));
  }

  // Restore last-played book for cross-device resume
  if (profile.bookLastPlayed?.bookId) {
    localStorage.setItem(StorageKeys.BOOK_LAST_PLAYED, JSON.stringify(profile.bookLastPlayed));
    window.dispatchEvent(new Event(WindowEvents.BOOK_LAST_PLAYED_CHANGED));
  }

  // Restore subcollection data for dashboard widgets (non-blocking)
  getUserNotes(uid).then(notes => {
    localStorage.setItem(StorageKeys.NOTEBOOK_CACHE, JSON.stringify(notes.length));
    window.dispatchEvent(new Event(WindowEvents.NOTEBOOK_CHANGED));
  }).catch(() => {
    window.dispatchEvent(new Event(WindowEvents.NOTEBOOK_CHANGED));
  });
  getDailyLogEntries(uid).then(entries => {
    if (entries.length > 0) {
      localStorage.setItem(StorageKeys.DAILY_LOG_CACHE, JSON.stringify(entries));
    }
    window.dispatchEvent(new Event(WindowEvents.DAILY_LOG_CHANGED));
  }).catch(() => {});
  getUserFiles(uid).then(files => {
    if (files.length > 0) {
      localStorage.setItem(StorageKeys.CLOUD_FILES_CACHE, JSON.stringify(files));
    }
    window.dispatchEvent(new Event(WindowEvents.CLOUD_FILES_CHANGED));
  }).catch(() => {});
  getWorshipSongs().then(songs => {
    if (songs.length > 0) {
      localStorage.setItem(StorageKeys.WORSHIP_SONGS_CACHE, JSON.stringify(songs));
    }
    window.dispatchEvent(new Event(WindowEvents.WORSHIP_SONGS_CHANGED));
  }).catch(() => {});
  getBenchmarkSummary(uid).then(summary => {
    if (summary) {
      localStorage.setItem(StorageKeys.BENCHMARK_CACHE, JSON.stringify(summary));
    }
    window.dispatchEvent(new Event(WindowEvents.BENCHMARK_CHANGED));
  }).catch(() => {});

  // Migrate legacy single-child to multi-child (non-blocking)
  migrateToMultiChild(uid, profile).then(() => {
    // Load children into localStorage cache
    return getChildren(uid);
  }).then(children => {
    if (children.length > 0) {
      localStorage.setItem(StorageKeys.CHILDREN_CACHE, JSON.stringify(children));
    }
    window.dispatchEvent(new Event(WindowEvents.CHILDREN_CHANGED));
  }).catch(() => {});

  return { recentCities, favoriteCities };
}
