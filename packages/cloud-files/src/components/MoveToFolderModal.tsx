import { useTranslation } from '@mycircle/shared';
import { useFolders } from '../hooks/useFolders';

interface MoveToFolderModalProps {
  fileId: string;
  currentFolderId: string | null;
  onMove: (fileId: string, targetFolderId: string | null) => Promise<void>;
  onClose: () => void;
}

export default function MoveToFolderModal({ fileId, currentFolderId, onMove, onClose }: MoveToFolderModalProps) {
  const { t } = useTranslation();
  const { folders } = useFolders();

  const handleMove = async (targetFolderId: string | null) => {
    await onMove(fileId, targetFolderId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-sm mx-4 max-h-[70vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('cloudFiles.moveTo')}</h3>

        <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
          {/* Root option */}
          <button
            type="button"
            onClick={() => handleMove(null)}
            disabled={currentFolderId === null}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
              currentFolderId === null
                ? 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 cursor-default'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            <span className="text-sm font-medium">{t('cloudFiles.rootFolder')}</span>
            {currentFolderId === null && (
              <span className="ml-auto text-xs text-cyan-500">{t('cloudFiles.currentLocation')}</span>
            )}
          </button>

          {/* Folders */}
          {folders.map(folder => {
            const isCurrent = folder.id === currentFolderId;
            return (
              <button
                key={folder.id}
                type="button"
                onClick={() => handleMove(folder.id)}
                disabled={isCurrent}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  isCurrent
                    ? 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 cursor-default'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <svg className="w-5 h-5 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                </svg>
                <span className="text-sm">{folder.name}</span>
                {isCurrent && (
                  <span className="ml-auto text-xs text-cyan-500">{t('cloudFiles.currentLocation')}</span>
                )}
              </button>
            );
          })}

          {folders.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">{t('cloudFiles.noFolders')}</p>
          )}
        </div>

        <div className="flex justify-end mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 min-h-[44px] transition-colors"
          >
            {t('cloudFiles.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
