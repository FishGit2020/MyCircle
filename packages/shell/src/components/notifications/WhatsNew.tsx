import React, { useEffect, useRef } from 'react';
import { useTranslation } from '@mycircle/shared';
import { Announcement } from '../../hooks/useAnnouncements';

interface WhatsNewProps {
  announcements: Announcement[];
  open: boolean;
  onClose: () => void;
}

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

export default function WhatsNew({ announcements, open, onClose }: WhatsNewProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap + Escape key handling
  useEffect(() => {
    if (!open) return;

    // Focus the close button when modal opens
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Focus trap
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end md:items-center justify-center"
      onClick={onClose}
      role="presentation"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="whats-new-title"
        className="relative w-full md:max-w-lg md:mx-4 max-h-[85vh] md:max-h-[70vh] mb-[calc(3.5rem_+_env(safe-area-inset-bottom,0px))] md:mb-0 bg-white dark:bg-gray-800 rounded-t-2xl md:rounded-2xl shadow-xl flex flex-col animate-slide-up md:animate-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 id="whats-new-title" className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('whatsNew.title')}
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={t('whatsNew.close')}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {announcements.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              {t('whatsNew.noUpdates')}
            </p>
          ) : (
            announcements.map((item) => (
              <article
                key={item.id}
                className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0" aria-hidden="true">
                    {ICON_MAP[item.icon || ''] || ICON_MAP.announcement}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                      {item.title}
                    </h3>
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}
