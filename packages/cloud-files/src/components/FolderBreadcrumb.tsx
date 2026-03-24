import { useTranslation } from '@mycircle/shared';
import type { Folder } from '../types';

interface FolderBreadcrumbProps {
  folderStack: Folder[];
  onNavigate: (index: number) => void;
}

export default function FolderBreadcrumb({ folderStack, onNavigate }: FolderBreadcrumbProps) {
  const { t } = useTranslation();

  if (folderStack.length === 0) return null;

  return (
    <nav aria-label="breadcrumb" className="flex items-center gap-1 mb-3 text-sm flex-wrap">
      <button
        type="button"
        onClick={() => onNavigate(-1)}
        className="text-cyan-600 dark:text-cyan-400 hover:underline min-h-[44px] px-1"
      >
        {t('cloudFiles.myFiles')}
      </button>
      {folderStack.map((folder, i) => (
        <span key={folder.id} className="flex items-center gap-1">
          <span className="text-gray-400 dark:text-gray-500">/</span>
          {i < folderStack.length - 1 ? (
            <button
              type="button"
              onClick={() => onNavigate(i)}
              className="text-cyan-600 dark:text-cyan-400 hover:underline min-h-[44px] px-1"
            >
              {folder.name}
            </button>
          ) : (
            <span className="text-gray-900 dark:text-white font-medium px-1">{folder.name}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
