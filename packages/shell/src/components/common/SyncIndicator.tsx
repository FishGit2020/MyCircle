import React, { useEffect, useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export default function SyncIndicator() {
  const { t } = useTranslation();
  const { isOnline } = useOnlineStatus();
  const [showSynced, setShowSynced] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setShowSynced(false);
    } else if (wasOffline) {
      // Just came back online — show "Synced" briefly
      setShowSynced(true);
      const timer = setTimeout(() => {
        setShowSynced(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (isOnline && !showSynced) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-sm font-medium transition-all ${
        isOnline
          ? 'bg-green-600 text-white'
          : 'bg-gray-800 dark:bg-gray-700 text-white'
      }`}
      style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {isOnline ? (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {t('sync.synced')}
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
          {t('sync.offline')}
        </>
      )}
    </div>
  );
}
