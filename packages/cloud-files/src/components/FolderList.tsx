import { useState, useCallback } from 'react';
import { useTranslation } from '@mycircle/shared';
import { useFolders } from '../hooks/useFolders';
import type { Folder } from '../types';

interface FolderListProps {
  currentFolderId: string | null;
  onNavigateInto: (folder: Folder) => void;
}

export default function FolderList({ currentFolderId, onNavigateInto }: FolderListProps) {
  const { t } = useTranslation();
  const { folders, createFolder, deleteFolder, renameFolder } = useFolders();
  const [showCreate, setShowCreate] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const currentFolders = folders.filter(f => f.parentFolderId === currentFolderId);

  const handleCreate = useCallback(async () => {
    const name = newFolderName.trim();
    if (!name) return;
    try {
      await createFolder(name, currentFolderId);
      setNewFolderName('');
      setShowCreate(false);
    } catch { /* error handled by GraphQL */ }
  }, [createFolder, newFolderName, currentFolderId]);

  const handleDelete = useCallback(async (folder: Folder) => {
    const msg = t('cloudFiles.deleteFolderWithContents');
    if (!window.confirm(msg)) return;
    await deleteFolder(folder.id, true);
  }, [deleteFolder, t]);

  const handleRenameStart = (folder: Folder) => {
    setRenamingId(folder.id);
    setRenameValue(folder.name);
  };

  const handleRenameSave = useCallback(async () => {
    if (!renamingId || !renameValue.trim()) { setRenamingId(null); return; }
    await renameFolder(renamingId, renameValue.trim());
    setRenamingId(null);
  }, [renameFolder, renamingId, renameValue]);

  if (currentFolders.length === 0 && !showCreate) {
    return (
      <div className="mb-2">
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline min-h-[44px] px-1"
        >
          + {t('cloudFiles.newFolder')}
        </button>
      </div>
    );
  }

  return (
    <div className="mb-4">
      {currentFolders.map(folder => (
        <div key={folder.id} className="flex items-center gap-2 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
          <svg className="w-5 h-5 text-yellow-500 dark:text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
          </svg>

          {renamingId === folder.id ? (
            <input
              type="text"
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onBlur={handleRenameSave}
              onKeyDown={e => {
                if (e.key === 'Enter') handleRenameSave();
                if (e.key === 'Escape') setRenamingId(null);
              }}
              className="flex-1 text-sm px-2 py-1 border border-cyan-500 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none"
              autoFocus
              aria-label={t('cloudFiles.renameFolder')}
            />
          ) : (
            <button
              type="button"
              onClick={() => onNavigateInto(folder)}
              className="flex-1 text-left text-sm font-medium text-gray-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-400 min-h-[44px]"
            >
              {folder.name}
            </button>
          )}

          <button
            type="button"
            onClick={() => handleRenameStart(folder)}
            aria-label={`${t('cloudFiles.renameFolder')} ${folder.name}`}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => handleDelete(folder)}
            aria-label={`${t('cloudFiles.deleteFolder')} ${folder.name}`}
            className="text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      ))}

      {showCreate ? (
        <div className="flex gap-2 items-center mt-2">
          <input
            type="text"
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            placeholder={t('cloudFiles.folderName')}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setShowCreate(false); }}
            autoFocus
            className="flex-1 text-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            aria-label={t('cloudFiles.folderName')}
          />
          <button type="button" onClick={handleCreate} className="px-3 py-2 text-sm bg-cyan-500 dark:bg-cyan-600 text-white rounded-lg min-h-[44px] hover:bg-cyan-600 dark:hover:bg-cyan-500">
            {t('cloudFiles.createFolder')}
          </button>
          <button type="button" onClick={() => setShowCreate(false)} className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 rounded-lg min-h-[44px]">
            {t('cloudFiles.renameCancel')}
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setShowCreate(true)} className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline mt-2 min-h-[44px] px-1">
          + {t('cloudFiles.newFolder')}
        </button>
      )}
    </div>
  );
}
