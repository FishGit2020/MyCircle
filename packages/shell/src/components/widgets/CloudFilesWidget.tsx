import React, { useEffect } from 'react';
import { useTranslation, StorageKeys, WindowEvents } from '@mycircle/shared';

const CloudFilesWidget = React.memo(function CloudFilesWidget() {
  const { t } = useTranslation();
  const [fileCount, setFileCount] = React.useState(0);
  const [sharedCount, setSharedCount] = React.useState(0);

  useEffect(() => {
    function load() {
      try {
        const raw = localStorage.getItem(StorageKeys.CLOUD_FILES_CACHE);
        if (raw) {
          const files = JSON.parse(raw);
          setFileCount(Array.isArray(files) ? files.length : 0);
        } else {
          setFileCount(0);
        }
      } catch { setFileCount(0); }
    }
    load();
    // Also try the bridge API for fresh data
    const api = window.__cloudFiles;
    if (api?.getAll) {
      api.getAll().then((files: any[]) => {
        setFileCount(files.length);
        try { localStorage.setItem(StorageKeys.CLOUD_FILES_CACHE, JSON.stringify(files)); } catch { /* ignore */ }
      }).catch(() => { /* ignore */ });
    }
    if (api?.getAllShared) {
      api.getAllShared().then((files: any[]) => {
        setSharedCount(files.length);
      }).catch(() => { /* ignore */ });
    }
    window.addEventListener(WindowEvents.CLOUD_FILES_CHANGED, load);
    return () => window.removeEventListener(WindowEvents.CLOUD_FILES_CHANGED, load);
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.cloudFiles')}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.cloudFilesDesc')}</p>
        </div>
      </div>
      {fileCount > 0 || sharedCount > 0 ? (
        <div className="space-y-1">
          {fileCount > 0 && (
            <p className="text-xs text-cyan-600 dark:text-cyan-400/70">
              {t('cloudFiles.fileCount').replace('{count}', String(fileCount))}
            </p>
          )}
          {sharedCount > 0 && (
            <p className="text-xs text-cyan-500 dark:text-cyan-400/50">
              {t('widgets.sharedFileCount').replace('{count}', String(sharedCount))}
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.noCloudFiles')}</p>
      )}
    </div>
  );
});

export default CloudFilesWidget;
