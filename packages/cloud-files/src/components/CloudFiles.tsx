import { useState, useCallback } from 'react';
import { useTranslation } from '@mycircle/shared';
import { useFiles } from '../hooks/useFiles';
import { useSharedFiles } from '../hooks/useSharedFiles';
import FileUpload from './FileUpload';
import FileList from './FileList';

type Tab = 'my' | 'shared';

export default function CloudFiles() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('my');
  const { files, loading, error, uploadFile, shareFile, deleteFile, reload } = useFiles();
  const { files: sharedFiles, loading: sharedLoading, error: sharedError, deleteSharedFile, reload: reloadShared } = useSharedFiles();

  // Auth check — shell exposes __getFirebaseIdToken when user is logged in
  const hasAuth = typeof (window as any).__getFirebaseIdToken === 'function';
  const hasApi = typeof (window as any).__cloudFiles !== 'undefined';

  const handleUpload = useCallback(async (file: File) => {
    await uploadFile(file);
  }, [uploadFile]);

  const handleShare = useCallback(async (fileId: string) => {
    if (!window.confirm(t('cloudFiles.shareConfirm'))) return;
    await shareFile(fileId);
  }, [shareFile, t]);

  const handleDelete = useCallback(async (fileId: string) => {
    if (!window.confirm(t('cloudFiles.deleteConfirm'))) return;
    await deleteFile(fileId);
  }, [deleteFile, t]);

  const handleDeleteShared = useCallback(async (fileId: string) => {
    if (!window.confirm(t('cloudFiles.deleteConfirm'))) return;
    await deleteSharedFile(fileId);
  }, [deleteSharedFile, t]);

  if (!hasAuth || !hasApi) {
    return (
      <div className="text-center py-16">
        <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
        <p className="text-gray-500 dark:text-gray-400">{t('cloudFiles.loginToUse')}</p>
      </div>
    );
  }

  const isLoading = tab === 'my' ? loading : sharedLoading;
  const currentError = tab === 'my' ? error : sharedError;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('cloudFiles.title')}</h1>
        <button
          type="button"
          onClick={() => tab === 'my' ? reload() : reloadShared()}
          className="text-sm text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 px-3 py-1.5 rounded-lg hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors min-h-[44px]"
          aria-label={t('cloudFiles.refresh')}
        >
          {t('cloudFiles.refresh')}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'my'}
          onClick={() => setTab('my')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors min-h-[44px] ${
            tab === 'my'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {t('cloudFiles.myFiles')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'shared'}
          onClick={() => setTab('shared')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors min-h-[44px] ${
            tab === 'shared'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {t('cloudFiles.sharedFiles')}
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16" role="status" aria-live="polite">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error */}
      {currentError && !isLoading && (
        <div className="text-center py-16">
          <p className="text-red-500 dark:text-red-400">{currentError}</p>
        </div>
      )}

      {/* Content */}
      {!isLoading && !currentError && (
        <>
          {tab === 'my' && (
            <>
              <FileUpload onUpload={handleUpload} />
              <FileList
                files={files}
                emptyMessage={t('cloudFiles.noFiles')}
                onShare={handleShare}
                onDelete={handleDelete}
              />
            </>
          )}
          {tab === 'shared' && (
            <FileList
              files={sharedFiles}
              emptyMessage={t('cloudFiles.noSharedFiles')}
              isShared
              onDelete={handleDeleteShared}
            />
          )}
        </>
      )}
    </div>
  );
}
