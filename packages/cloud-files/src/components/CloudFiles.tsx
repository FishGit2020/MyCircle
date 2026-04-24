import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation, useQuery, WindowEvents, PageContent, GET_NAS_CONNECTION_STATUS } from '@mycircle/shared';
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
import MoveToFolderModal from './MoveToFolderModal';
import { getFileTypeCategory } from '../utils/fileHelpers';
import type { FileTypeCategory } from '../utils/fileHelpers';
import type { FileItem, SharedFileItem, Folder } from '../types';

// Upload is blocked if local file sizes exceed the free tier (1 GB)
const UPLOAD_BLOCK_BYTES = 1_073_741_824;

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
  const [moveFileId, setMoveFileId] = useState<string | null>(null);

  const { files, loading, error, uploadFile, shareFile, deleteFile, renameFile, moveFile, offloadToNas, restoreFromNas, offloadAllToNas, reload } = useFiles();
  const { files: sharedFiles, loading: sharedLoading, error: sharedError, deleteSharedFile, reload: reloadShared } = useSharedFiles();
  const { files: sharedWithMeFiles, loading: sharedWithMeLoading, error: sharedWithMeError, reload: reloadSharedWithMe } = useFilesSharedWithMe();

  // NAS connection status
  const { data: nasData } = useQuery(GET_NAS_CONNECTION_STATUS);
  const nasConnected = nasData?.nasConnectionStatus?.status === 'connected';

  // NAS operation loading states
  const [nasOffloadingIds, setNasOffloadingIds] = useState<Set<string>>(new Set());
  const [nasRestoringIds, setNasRestoringIds] = useState<Set<string>>(new Set());
  const [batchOffloading, setBatchOffloading] = useState(false);
  const batchPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Block upload if local files already approach the free tier limit
  const usedBytes = useMemo(() => files.reduce((sum, f) => sum + f.size, 0), [files]);
  const storageFull = usedBytes >= UPLOAD_BLOCK_BYTES;

  // Filtered files for current folder + search + type
  const filteredMyFiles = useMemo(() => {
    return files.filter(f => {
      const inFolder = (f.folderId ?? null) === currentFolderId;
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

  const handleOffloadToNas = useCallback(async (fileId: string) => {
    if (!window.confirm(t('cloudFiles.offloadConfirm'))) return;
    setNasOffloadingIds(prev => new Set(prev).add(fileId));
    try {
      await offloadToNas(fileId);
    } finally {
      setNasOffloadingIds(prev => { const next = new Set(prev); next.delete(fileId); return next; });
    }
  }, [offloadToNas, t]);

  const handleRestoreFromNas = useCallback(async (fileId: string) => {
    setNasRestoringIds(prev => new Set(prev).add(fileId));
    try {
      await restoreFromNas(fileId);
    } finally {
      setNasRestoringIds(prev => { const next = new Set(prev); next.delete(fileId); return next; });
    }
  }, [restoreFromNas]);

  const handleOffloadAll = useCallback(async () => {
    if (!window.confirm(t('cloudFiles.offloadAllConfirm'))) return;
    setBatchOffloading(true);
    try {
      await offloadAllToNas();
      // Poll for completion every 10 seconds
      batchPollRef.current = setInterval(() => {
        reload().then(() => {
          // Stop polling when no more files have downloadUrl
          // (checked in next render cycle)
        });
      }, 10_000);
    } catch {
      setBatchOffloading(false);
    }
  }, [offloadAllToNas, reload, t]);

  // Stop batch polling when all cloud files are offloaded
  useEffect(() => {
    if (!batchOffloading) return;
    const hasCloudFiles = files.some(f => !!f.downloadUrl);
    if (!hasCloudFiles && batchPollRef.current) {
      clearInterval(batchPollRef.current);
      batchPollRef.current = null;
      setBatchOffloading(false);
    }
  }, [files, batchOffloading]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (batchPollRef.current) clearInterval(batchPollRef.current);
    };
  }, []);

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

      {/* Storage Quota Bar — always visible, fetches actual bucket usage */}
      <StorageQuotaBar />

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
              {/* NAS Batch Offload */}
              {nasConnected && files.some(f => !!f.downloadUrl) && (
                <div className="mb-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleOffloadAll}
                    disabled={batchOffloading}
                    className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 px-4 py-2 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors min-h-[44px] disabled:opacity-50"
                    aria-label={t('cloudFiles.offloadAll')}
                  >
                    {batchOffloading ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    )}
                    {batchOffloading ? t('cloudFiles.offloading') : t('cloudFiles.offloadAll')}
                  </button>
                  {batchOffloading && (
                    <span className="text-xs text-gray-500 dark:text-gray-400" role="status" aria-live="polite">
                      {t('cloudFiles.offloadingProgress')}
                    </span>
                  )}
                </div>
              )}
              {!nasConnected && files.length > 0 && (
                <p className="mb-4 text-xs text-gray-400 dark:text-gray-500">
                  {t('cloudFiles.nasNotConnected')}
                </p>
              )}
              <FolderBreadcrumb folderStack={folderStack} onNavigate={handleBreadcrumbNavigate} />
              <FolderList currentFolderId={currentFolderId} onNavigateInto={handleNavigateIntoFolder} />
              <FileList
                files={filteredMyFiles}
                emptyMessage={hasActiveFilter ? t('cloudFiles.noResults') : t('cloudFiles.noFiles')}
                nasConnected={nasConnected}
                nasOffloadingIds={nasOffloadingIds}
                nasRestoringIds={nasRestoringIds}
                onShare={handleShare}
                onDelete={handleDelete}
                onPreview={f => setPreviewFile(f)}
                onRename={handleRename}
                onShareWith={fileId => setShareWithFileId(fileId)}
                onMove={fileId => setMoveFileId(fileId)}
                onOffloadToNas={handleOffloadToNas}
                onRestoreFromNas={handleRestoreFromNas}
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

      {/* Move-to-folder modal */}
      {moveFileId && (
        <MoveToFolderModal
          fileId={moveFileId}
          currentFolderId={files.find(f => f.id === moveFileId)?.folderId ?? null}
          onMove={moveFile}
          onClose={() => setMoveFileId(null)}
        />
      )}
    </PageContent>
  );
}
