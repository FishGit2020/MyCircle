import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation, WindowEvents, PageContent } from '@mycircle/shared';
import { useFiles } from '../hooks/useFiles';
import { useSharedFiles } from '../hooks/useSharedFiles';
import { useFilesSharedWithMe } from '../hooks/useFilesSharedWithMe';
import FileUpload from './FileUpload';
import FileList from './FileList';
import SearchFilterBar from './SearchFilterBar';
import FolderBreadcrumb from './FolderBreadcrumb';
import FolderList from './FolderList';
import FilePreviewModal from './FilePreviewModal';
import StorageQuotaBar from './StorageQuotaBar';
import ShareRecipientsModal from './ShareRecipientsModal';
import { getFileTypeCategory } from '../utils/fileHelpers';
import type { FileTypeCategory } from '../utils/fileHelpers';
import type { FileItem, SharedFileItem, Folder } from '../types';

const TOTAL_STORAGE_BYTES = 500 * 1024 * 1024; // 500 MB

type Tab = 'my' | 'shared' | 'sharedWithMe';

export default function CloudFiles() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('my');

  // Search & filter state
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<FileTypeCategory | null>(null);

  // Folder navigation state
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderStack, setFolderStack] = useState<Folder[]>([]);

  // Preview state
  const [previewFile, setPreviewFile] = useState<FileItem | SharedFileItem | null>(null);

  // Share-with modal state
  const [shareWithFileId, setShareWithFileId] = useState<string | null>(null);

  const { files, loading, error, uploadFile, shareFile, deleteFile, renameFile, moveFile, reload } = useFiles();
  const { files: sharedFiles, loading: sharedLoading, error: sharedError, deleteSharedFile, reload: reloadShared } = useSharedFiles();
  const { files: sharedWithMeFiles, loading: sharedWithMeLoading, error: sharedWithMeError, reload: reloadSharedWithMe } = useFilesSharedWithMe();

  // Auth check
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await window.__getFirebaseIdToken?.();
        setIsAuthenticated(!!token);
      } catch { setIsAuthenticated(false); }
    };
    checkAuth();
    window.addEventListener(WindowEvents.AUTH_STATE_CHANGED, checkAuth);
    return () => window.removeEventListener(WindowEvents.AUTH_STATE_CHANGED, checkAuth);
  }, []);

  // Storage quota
  const usedBytes = useMemo(() => files.reduce((sum, f) => sum + f.size, 0), [files]);
  const storageFull = usedBytes >= TOTAL_STORAGE_BYTES;

  // Filtered files for current folder + search + type
  const filteredMyFiles = useMemo(() => {
    return files.filter(f => {
      const inFolder = f.folderId === currentFolderId;
      const matchesQuery = !query.trim() || f.fileName.toLowerCase().includes(query.toLowerCase());
      const matchesType = !typeFilter || getFileTypeCategory(f.contentType) === typeFilter;
      return inFolder && matchesQuery && matchesType;
    });
  }, [files, currentFolderId, query, typeFilter]);

  const filteredSharedFiles = useMemo(() => {
    return sharedFiles.filter(f => {
      const matchesQuery = !query.trim() || f.fileName.toLowerCase().includes(query.toLowerCase());
      const matchesType = !typeFilter || getFileTypeCategory(f.contentType) === typeFilter;
      return matchesQuery && matchesType;
    });
  }, [sharedFiles, query, typeFilter]);

  const filteredSharedWithMe = useMemo(() => {
    return sharedWithMeFiles.filter(f => {
      const matchesQuery = !query.trim() || f.fileName.toLowerCase().includes(query.toLowerCase());
      const matchesType = !typeFilter || getFileTypeCategory(f.contentType) === typeFilter;
      return matchesQuery && matchesType;
    });
  }, [sharedWithMeFiles, query, typeFilter]);

  const handleUpload = useCallback(async (file: File) => {
    if (storageFull) return;
    window.__logAnalyticsEvent?.('file_upload', { file_type: file.type, file_size: file.size });
    await uploadFile(file, currentFolderId);
  }, [uploadFile, storageFull, currentFolderId]);

  const handleShare = useCallback(async (fileId: string) => {
    if (!window.confirm(t('cloudFiles.shareConfirm'))) return;
    await shareFile(fileId);
  }, [shareFile, t]);

  const handleDelete = useCallback(async (fileId: string) => {
    if (!window.confirm(t('cloudFiles.deleteConfirm'))) return;
    window.__logAnalyticsEvent?.('file_delete');
    await deleteFile(fileId);
  }, [deleteFile, t]);

  const handleDeleteShared = useCallback(async (fileId: string) => {
    if (!window.confirm(t('cloudFiles.deleteConfirm'))) return;
    await deleteSharedFile(fileId);
  }, [deleteSharedFile, t]);

  const handleRename = useCallback(async (fileId: string, newName: string) => {
    await renameFile(fileId, newName);
  }, [renameFile]);

  const handleNavigateIntoFolder = useCallback((folder: Folder) => {
    setFolderStack(prev => [...prev, folder]);
    setCurrentFolderId(folder.id);
  }, []);

  const handleBreadcrumbNavigate = useCallback((index: number) => {
    if (index < 0) {
      setFolderStack([]);
      setCurrentFolderId(null);
    } else {
      const newStack = folderStack.slice(0, index + 1);
      setFolderStack(newStack);
      setCurrentFolderId(newStack[newStack.length - 1].id);
    }
  }, [folderStack]);

  const handleReload = useCallback(() => {
    if (tab === 'my') reload();
    else if (tab === 'shared') reloadShared();
    else reloadSharedWithMe();
  }, [tab, reload, reloadShared, reloadSharedWithMe]);

  if (!isAuthenticated) {
    return (
      <div className="text-center py-16">
        <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
        <p className="text-gray-500 dark:text-gray-400">{t('cloudFiles.loginToUse')}</p>
      </div>
    );
  }

  const isLoading = tab === 'my' ? loading : tab === 'shared' ? sharedLoading : sharedWithMeLoading;
  const currentError = tab === 'my' ? error : tab === 'shared' ? sharedError : sharedWithMeError;

  const hasActiveFilter = !!query.trim() || typeFilter !== null;

  return (
    <PageContent maxWidth="5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('cloudFiles.title')}</h1>
        <button
          type="button"
          onClick={handleReload}
          className="text-sm text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 px-3 py-1.5 rounded-lg hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors min-h-[44px]"
          aria-label={t('cloudFiles.refresh')}
        >
          {t('cloudFiles.refresh')}
        </button>
      </div>

      {/* Storage Quota Bar (My Files only) */}
      {tab === 'my' && <StorageQuotaBar usedBytes={usedBytes} totalBytes={TOTAL_STORAGE_BYTES} />}

      {/* Search & Filter */}
      <SearchFilterBar
        query={query}
        typeFilter={typeFilter}
        onQueryChange={setQuery}
        onTypeFilterChange={setTypeFilter}
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1" role="tablist">
        {(['my', 'shared', 'sharedWithMe'] as Tab[]).map(tabId => (
          <button
            key={tabId}
            type="button"
            role="tab"
            aria-selected={tab === tabId}
            onClick={() => setTab(tabId)}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors min-h-[44px] ${
              tab === tabId
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tabId === 'my' ? t('cloudFiles.myFiles') : tabId === 'shared' ? t('cloudFiles.sharedFiles') : t('cloudFiles.sharedWithMe')}
          </button>
        ))}
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
              {storageFull ? (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{t('cloudFiles.uploadBlocked')}</p>
                </div>
              ) : (
                <FileUpload onUpload={handleUpload} />
              )}
              <FolderBreadcrumb folderStack={folderStack} onNavigate={handleBreadcrumbNavigate} />
              <FolderList currentFolderId={currentFolderId} onNavigateInto={handleNavigateIntoFolder} />
              <FileList
                files={filteredMyFiles}
                emptyMessage={hasActiveFilter ? t('cloudFiles.noResults') : t('cloudFiles.noFiles')}
                onShare={handleShare}
                onDelete={handleDelete}
                onPreview={f => setPreviewFile(f)}
                onRename={handleRename}
                onShareWith={fileId => setShareWithFileId(fileId)}
                onMove={moveFile}
              />
            </>
          )}
          {tab === 'shared' && (
            <FileList
              files={filteredSharedFiles}
              emptyMessage={hasActiveFilter ? t('cloudFiles.noResults') : t('cloudFiles.noSharedFiles')}
              isShared
              onDelete={handleDeleteShared}
              onPreview={f => setPreviewFile(f)}
            />
          )}
          {tab === 'sharedWithMe' && (
            <FileList
              files={filteredSharedWithMe}
              emptyMessage={hasActiveFilter ? t('cloudFiles.noResults') : t('cloudFiles.noSharedFiles')}
              isTargetedShared
            />
          )}
        </>
      )}

      {/* Preview modal */}
      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />

      {/* Share-with modal */}
      {shareWithFileId && (
        <ShareRecipientsModal
          fileId={shareWithFileId}
          onClose={() => setShareWithFileId(null)}
        />
      )}
    </PageContent>
  );
}
