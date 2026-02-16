import React, { useState, useCallback } from 'react';
import { useTranslation } from '@mycircle/shared';
import WhatsNew from './WhatsNew';
import { useAnnouncements } from '../../hooks/useAnnouncements';

export default function WhatsNewButton() {
  const { t } = useTranslation();
  const { announcements, hasUnread, markAllSeen } = useAnnouncements();
  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => {
    setOpen(true);
    markAllSeen();
  }, [markAllSeen]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label={t('whatsNew.title')}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
        {hasUnread && (
          <span
            className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"
            aria-label={t('whatsNew.newBadge')}
          />
        )}
      </button>

      <WhatsNew
        announcements={announcements}
        open={open}
        onClose={handleClose}
      />
    </>
  );
}
