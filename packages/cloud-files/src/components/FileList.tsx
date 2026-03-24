import { useTranslation } from '@mycircle/shared';
import type { FileItem, SharedFileItem, TargetedSharedFile } from '../types';
import FileCard from './FileCard';

interface FileListProps {
  files: (FileItem | SharedFileItem | TargetedSharedFile)[];
  emptyMessage: string;
  isShared?: boolean;
  isTargetedShared?: boolean;
  onShare?: (fileId: string) => void;
  onDelete?: (fileId: string) => void;
  onPreview?: (file: FileItem | SharedFileItem) => void;
  onRename?: (fileId: string, newName: string) => void;
  onShareWith?: (fileId: string) => void;
  onMove?: (fileId: string, targetFolderId: string | null) => void;
}

export default function FileList({ files, emptyMessage, isShared, isTargetedShared, onShare, onDelete, onPreview, onRename, onShareWith, onMove: _onMove }: FileListProps) {
  const { t } = useTranslation();

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
        </svg>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
        {t('cloudFiles.fileCount').replace('{count}', String(files.length))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {files.map((file) => {
          if (isTargetedShared) {
            const tf = file as TargetedSharedFile;
            return (
              <FileCard
                key={tf.shareId}
                fileName={tf.fileName}
                contentType={tf.contentType}
                size={tf.size}
                downloadUrl={tf.downloadUrl}
                date={tf.sharedAt}
                sharedBy={tf.ownerName}
              />
            );
          }
          const shared = file as SharedFileItem;
          const own = file as FileItem;
          return (
            <FileCard
              key={file.id}
              fileName={file.fileName}
              contentType={file.contentType}
              size={file.size}
              downloadUrl={file.downloadUrl}
              date={isShared ? shared.sharedAt : own.uploadedAt}
              sharedBy={isShared ? shared.sharedByName : undefined}
              onShare={!isShared && onShare ? () => onShare(file.id) : undefined}
              onDelete={onDelete ? () => onDelete(file.id) : undefined}
              onPreview={onPreview ? () => onPreview(file as FileItem | SharedFileItem) : undefined}
              onRename={!isShared && onRename ? (newName: string) => onRename(file.id, newName) : undefined}
              onShareWith={!isShared && onShareWith ? () => onShareWith(file.id) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
