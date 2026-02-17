import { useState, useEffect, useCallback } from 'react';
import { StorageKeys } from '@mycircle/shared';
import { getAnnouncements, updateLastSeenAnnouncement, Announcement } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

export type { Announcement };

export function useAnnouncements() {
  const { user, profile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasUnread, setHasUnread] = useState(false);
  const [lastSeenId, setLastSeenId] = useState<string | null>(null);

  // Determine the last-seen ID from profile (signed-in) or localStorage (anonymous)
  const getLastSeenId = useCallback((): string | null => {
    if (user && profile?.lastSeenAnnouncementId) {
      return profile.lastSeenAnnouncementId;
    }
    return localStorage.getItem(StorageKeys.LAST_SEEN_ANNOUNCEMENT);
  }, [user, profile?.lastSeenAnnouncementId]);

  // Fetch announcements on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const items = await getAnnouncements();
        if (!cancelled) {
          setAnnouncements(items);
          // Check for unread: if there are announcements and the first (newest) one
          // is not the last-seen one, there are unread announcements
          const seenId = getLastSeenId();
          setLastSeenId(seenId);
          const hasNew = items.length > 0 && items[0].id !== seenId;
          setHasUnread(hasNew);
        }
      } catch {
        // Silently fail — announcements are not critical
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [getLastSeenId]);

  // Mark all announcements as seen
  const markAllSeen = useCallback(async () => {
    if (announcements.length === 0) return;
    const latestId = announcements[0].id;

    // Persist to localStorage (works for everyone)
    localStorage.setItem(StorageKeys.LAST_SEEN_ANNOUNCEMENT, latestId);
    setLastSeenId(latestId);

    // If signed in, also persist to Firestore
    if (user) {
      try {
        await updateLastSeenAnnouncement(user.uid, latestId);
      } catch {
        // localStorage is the fallback
      }
    }

    setHasUnread(false);
  }, [announcements, user]);

  return { announcements, loading, hasUnread, markAllSeen, lastSeenId };
}
