import { useEffect } from 'react';
import { User } from 'firebase/auth';
import { WindowEvents, StorageKeys } from '@mycircle/shared';
import {
  updateUserBabyDueDate,
  updateUserBottomNavOrder,
  updateBibleBookmarks,
  updateWorshipFavorites,
  updateRadioFavorites,
  updateChildData,
  updateWidgetLayout,
  updateBookBookmarks,
  updateBookAudioProgress,
  updateBookPlayedChapters,
  updateBookLastPlayed,
} from '../lib/firebase';

/**
 * Registers 10 window-event listeners that auto-sync localStorage changes
 * back to Firestore. Each effect guards with `if (!user) return`.
 */
export function useFirestoreSync(user: User | null) {
  // Auto-sync baby due date changes from localStorage to Firestore
  useEffect(() => {
    function handleBabyDueDateChanged() {
      const date = localStorage.getItem(StorageKeys.BABY_DUE_DATE);
      if (user) {
        updateUserBabyDueDate(user.uid, date);
      }
    }
    window.addEventListener(WindowEvents.BABY_DUE_DATE_CHANGED, handleBabyDueDateChanged);
    return () => window.removeEventListener(WindowEvents.BABY_DUE_DATE_CHANGED, handleBabyDueDateChanged);
  }, [user]);

  // Auto-sync bottom nav order changes from localStorage to Firestore
  useEffect(() => {
    function handleBottomNavOrderChanged() {
      const stored = localStorage.getItem(StorageKeys.BOTTOM_NAV_ORDER);
      if (user) {
        try {
          const order = stored ? JSON.parse(stored) : null;
          updateUserBottomNavOrder(user.uid, order);
        } catch { /* ignore parse errors */ }
      }
    }
    window.addEventListener(WindowEvents.BOTTOM_NAV_ORDER_CHANGED, handleBottomNavOrderChanged);
    return () => window.removeEventListener(WindowEvents.BOTTOM_NAV_ORDER_CHANGED, handleBottomNavOrderChanged);
  }, [user]);

  // Auto-sync Bible bookmarks from localStorage to Firestore
  useEffect(() => {
    function handleBibleBookmarksChanged() {
      if (user) {
        try {
          const stored = localStorage.getItem(StorageKeys.BIBLE_BOOKMARKS);
          const bookmarks = stored ? JSON.parse(stored) : [];
          updateBibleBookmarks(user.uid, bookmarks);
        } catch { /* ignore parse errors */ }
      }
    }
    window.addEventListener(WindowEvents.BIBLE_BOOKMARKS_CHANGED, handleBibleBookmarksChanged);
    return () => window.removeEventListener(WindowEvents.BIBLE_BOOKMARKS_CHANGED, handleBibleBookmarksChanged);
  }, [user]);

  // Auto-sync worship favorites from localStorage to Firestore
  useEffect(() => {
    function handleWorshipFavoritesChanged() {
      if (user) {
        try {
          const stored = localStorage.getItem(StorageKeys.WORSHIP_FAVORITES);
          const favorites = stored ? JSON.parse(stored) : [];
          updateWorshipFavorites(user.uid, favorites);
        } catch { /* ignore parse errors */ }
      }
    }
    window.addEventListener(WindowEvents.WORSHIP_FAVORITES_CHANGED, handleWorshipFavoritesChanged);
    return () => window.removeEventListener(WindowEvents.WORSHIP_FAVORITES_CHANGED, handleWorshipFavoritesChanged);
  }, [user]);

  // Auto-sync child development data from localStorage to Firestore
  useEffect(() => {
    function handleChildDataChanged() {
      if (user) {
        const childName = localStorage.getItem(StorageKeys.CHILD_NAME);
        const rawBirthDate = localStorage.getItem(StorageKeys.CHILD_BIRTH_DATE);
        // Decode before uploading — localStorage stores btoa-encoded dates,
        // but Firestore should have plain dates so the restore path can encode once.
        let childBirthDate: string | null = null;
        if (rawBirthDate) {
          try { childBirthDate = atob(rawBirthDate); } catch { childBirthDate = rawBirthDate; }
        }
        updateChildData(user.uid, { childName, childBirthDate });
      }
    }
    window.addEventListener(WindowEvents.CHILD_DATA_CHANGED, handleChildDataChanged);
    return () => window.removeEventListener(WindowEvents.CHILD_DATA_CHANGED, handleChildDataChanged);
  }, [user]);

  // Auto-sync widget layout from localStorage to Firestore
  useEffect(() => {
    function handleWidgetLayoutChanged() {
      if (user) {
        try {
          const stored = localStorage.getItem(StorageKeys.WIDGET_LAYOUT);
          const layout = stored ? JSON.parse(stored) : null;
          updateWidgetLayout(user.uid, layout);
        } catch { /* ignore parse errors */ }
      }
    }
    window.addEventListener(WindowEvents.WIDGET_LAYOUT_CHANGED, handleWidgetLayoutChanged);
    return () => window.removeEventListener(WindowEvents.WIDGET_LAYOUT_CHANGED, handleWidgetLayoutChanged);
  }, [user]);

  // Auto-sync radio favorites from localStorage to Firestore
  useEffect(() => {
    function handleRadioChanged() {
      if (user) {
        try {
          const stored = localStorage.getItem(StorageKeys.RADIO_FAVORITES);
          const favorites = stored ? JSON.parse(stored) : [];
          updateRadioFavorites(user.uid, favorites);
        } catch { /* ignore parse errors */ }
      }
    }
    window.addEventListener(WindowEvents.RADIO_CHANGED, handleRadioChanged);
    return () => window.removeEventListener(WindowEvents.RADIO_CHANGED, handleRadioChanged);
  }, [user]);

  // Auto-sync book bookmarks from localStorage to Firestore
  useEffect(() => {
    function handleBookBookmarksChanged() {
      if (user) {
        try {
          const stored = localStorage.getItem(StorageKeys.BOOK_BOOKMARKS);
          const bookmarks = stored ? JSON.parse(stored) : [];
          updateBookBookmarks(user.uid, bookmarks);
        } catch { /* ignore parse errors */ }
      }
    }
    window.addEventListener(WindowEvents.BOOK_BOOKMARKS_CHANGED, handleBookBookmarksChanged);
    return () => window.removeEventListener(WindowEvents.BOOK_BOOKMARKS_CHANGED, handleBookBookmarksChanged);
  }, [user]);

  // Auto-sync book audio progress from localStorage to Firestore
  useEffect(() => {
    function handleBookAudioProgressChanged() {
      if (user) {
        try {
          const stored = localStorage.getItem(StorageKeys.BOOK_AUDIO_PROGRESS);
          const progress = stored ? JSON.parse(stored) : null;
          updateBookAudioProgress(user.uid, progress);
        } catch { /* ignore parse errors */ }
      }
    }
    // Listen for storage changes from the audio player (custom event)
    window.addEventListener('book-audio-progress-changed', handleBookAudioProgressChanged);
    return () => window.removeEventListener('book-audio-progress-changed', handleBookAudioProgressChanged);
  }, [user]);

  // Auto-sync book played chapters from localStorage to Firestore
  useEffect(() => {
    function handleBookPlayedChaptersChanged() {
      if (user) {
        try {
          const stored = localStorage.getItem(StorageKeys.BOOK_PLAYED_CHAPTERS);
          const playedChapters = stored ? JSON.parse(stored) : null;
          updateBookPlayedChapters(user.uid, playedChapters);
        } catch { /* ignore parse errors */ }
      }
    }
    window.addEventListener(WindowEvents.BOOK_PLAYED_CHAPTERS_CHANGED, handleBookPlayedChaptersChanged);
    return () => window.removeEventListener(WindowEvents.BOOK_PLAYED_CHAPTERS_CHANGED, handleBookPlayedChaptersChanged);
  }, [user]);

  // Auto-sync book last-played from localStorage to Firestore
  useEffect(() => {
    function handleBookLastPlayedChanged() {
      if (user) {
        try {
          const stored = localStorage.getItem(StorageKeys.BOOK_LAST_PLAYED);
          const data = stored ? JSON.parse(stored) : null;
          updateBookLastPlayed(user.uid, data);
        } catch { /* ignore parse errors */ }
      }
    }
    window.addEventListener(WindowEvents.BOOK_LAST_PLAYED_CHANGED, handleBookLastPlayedChanged);
    return () => window.removeEventListener(WindowEvents.BOOK_LAST_PLAYED_CHANGED, handleBookLastPlayedChanged);
  }, [user]);
}
