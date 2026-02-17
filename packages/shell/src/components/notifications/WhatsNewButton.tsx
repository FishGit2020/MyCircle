import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from '@mycircle/shared';
import { useNavigate } from 'react-router';
import { useAnnouncements, type Announcement } from '../../hooks/useAnnouncements';

const ICON_MAP: Record<string, string> = {
  feature: '\u2728',
  fix: '\ud83d\udd27',
  improvement: '\ud83d\ude80',
  announcement: '\ud83d\udce2',
};

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getPopupShownKey(latestId: string) {
  return `announcement-popup-shown-${latestId}`;
}

/** Compact toast showing only new/unread announcements */
function AnnouncementPopup({
  announcements,
  onDismiss,
  onViewAll,
}: {
  announcements: Announcement[];
  onDismiss: () => void;
  onViewAll: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div
      className="fixed top-16 right-4 z-[70] w-80 max-h-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col animate-slide-up"
      role="alert"
      data-testid="announcement-popup"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-700">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{t('whatsNew.title')}</span>
        <button
          type="button"
          onClick={onDismiss}
          className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
          aria-label={t('whatsNew.dismiss')}
          data-testid="popup-dismiss"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {announcements.slice(0, 3).map((item) => (
          <div key={item.id} className="flex items-start gap-2">
            <span className="text-sm flex-shrink-0" aria-hidden="true">
              {ICON_MAP[item.icon || ''] || ICON_MAP.announcement}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{item.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onViewAll}
        className="px-3 py-2 text-xs text-blue-600 dark:text-blue-400 font-medium hover:bg-gray-50 dark:hover:bg-gray-700/50 transition border-t border-gray-100 dark:border-gray-700 text-center"
        data-testid="popup-view-all"
      >
        {t('whatsNew.viewAll')}
      </button>
    </div>
  );
}

export default function WhatsNewButton() {
  const { t } = useTranslation();
  const { announcements, hasUnread, markAllSeen, lastSeenId } = useAnnouncements();
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();
  const popupTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Auto-popup for unread announcements after 1.5s (once per new batch)
  useEffect(() => {
    if (!hasUnread || announcements.length === 0) return;

    const latestId = announcements[0].id;
    const key = getPopupShownKey(latestId);
    if (localStorage.getItem(key)) return; // already shown for this batch

    popupTimerRef.current = setTimeout(() => {
      setShowPopup(true);
      localStorage.setItem(key, '1');
    }, 1500);

    return () => {
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    };
  }, [hasUnread, announcements]);

  const handleDismiss = useCallback(() => {
    setShowPopup(false);
    markAllSeen();
  }, [markAllSeen]);

  const handleViewAll = useCallback(() => {
    setShowPopup(false);
    markAllSeen();
    navigate('/whats-new');
  }, [markAllSeen, navigate]);

  const handleButtonClick = useCallback(() => {
    setShowPopup(false);
    markAllSeen();
    navigate('/whats-new');
  }, [markAllSeen, navigate]);

  // Get only unread announcements for the popup
  const unreadAnnouncements = lastSeenId
    ? announcements.filter((a) => {
        const idx = announcements.findIndex((x) => x.id === lastSeenId);
        return idx === -1 || announcements.indexOf(a) < idx;
      })
    : announcements;

  return (
    <>
      <button
        onClick={handleButtonClick}
        className="relative p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label={t('whatsNew.title')}
        data-testid="whats-new-button"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
        {hasUnread && (
          <span
            className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"
            aria-label={t('whatsNew.newBadge')}
            data-testid="unread-badge"
          />
        )}
      </button>

      {showPopup && unreadAnnouncements.length > 0 && (
        <AnnouncementPopup
          announcements={unreadAnnouncements}
          onDismiss={handleDismiss}
          onViewAll={handleViewAll}
        />
      )}
    </>
  );
}
