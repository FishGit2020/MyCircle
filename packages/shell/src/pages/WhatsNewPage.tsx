import React, { useEffect } from 'react';
import { useTranslation } from '@mycircle/shared';
import { useAnnouncements, type Announcement } from '../hooks/useAnnouncements';

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

export default function WhatsNewPage() {
  const { t } = useTranslation();
  const { announcements, loading, hasUnread, markAllSeen, lastSeenId } = useAnnouncements();

  // Mark as read on page visit
  useEffect(() => {
    if (!loading && hasUnread) {
      markAllSeen();
    }
  }, [loading, hasUnread, markAllSeen]);

  const isUnread = (item: Announcement): boolean => {
    if (!lastSeenId) return true; // never seen anything → all are new
    const seenIdx = announcements.findIndex((a) => a.id === lastSeenId);
    if (seenIdx === -1) return true;
    return announcements.indexOf(item) < seenIdx;
  };

  return (
    <div className="max-w-2xl mx-auto" data-testid="whats-new-page">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">{t('whatsNew.title')}</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : announcements.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-12" data-testid="no-announcements">
          {t('whatsNew.noAnnouncements')}
        </p>
      ) : (
        <div className="space-y-4">
          {announcements.map((item) => {
            const unread = isUnread(item);
            return (
              <article
                key={item.id}
                className={`p-4 rounded-lg border transition ${
                  unread
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500 border-blue-200 dark:border-blue-800'
                    : 'bg-gray-50 dark:bg-gray-700/50 border-gray-100 dark:border-gray-600'
                }`}
                data-testid="announcement-card"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0" aria-hidden="true">
                    {ICON_MAP[item.icon || ''] || ICON_MAP.announcement}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                        {item.title}
                      </h3>
                      {unread && (
                        <span
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500 text-white"
                          data-testid="new-badge"
                        >
                          {t('whatsNew.new')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                      {item.description}
                    </p>
                    <time
                      className="text-xs text-gray-400 dark:text-gray-500 mt-1 block"
                      dateTime={item.createdAt.toISOString()}
                    >
                      {formatDate(item.createdAt)}
                    </time>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
