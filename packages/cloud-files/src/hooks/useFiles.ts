import { useCallback } from 'react';
import { useQuery, useMutation, useTranslation, WindowEvents, GET_CLOUD_FILES, SHARE_FILE, DELETE_FILE, RENAME_FILE, MOVE_FILE } from '@mycircle/shared';
import type { FileItem } from '../types';
import { fileToBase64 } from '../utils/fileHelpers';

export function useFiles() {
  const { t } = useTranslation();
  const { data, loading, error, refetch } = useQuery(GET_CLOUD_FILES);
  const [shareFileMutation] = useMutation(SHARE_FILE, {
    refetchQueries: [{ query: GET_CLOUD_FILES }],
  });
  const [deleteFileMutation] = useMutation(DELETE_FILE, {
    refetchQueries: [{ query: GET_CLOUD_FILES }],
  });
  const [renameFileMutation] = useMutation(RENAME_FILE, {
    refetchQueries: [{ query: GET_CLOUD_FILES }],
  });
  const [moveFileMutation] = useMutation(MOVE_FILE, {
    refetchQueries: [{ query: GET_CLOUD_FILES }],
  });

  const files: FileItem[] = (data?.cloudFiles ?? []) as FileItem[];

  const uploadFile = useCallback(async (file: File, folderId?: string | null) => {
    const api = window.__cloudFiles;
    if (!api?.upload) throw new Error('Not authenticated');
    const base64 = await fileToBase64(file);
    const result = await api.upload(file.name, base64, file.type, folderId ?? null);
    await refetch();
    window.dispatchEvent(new Event(WindowEvents.CLOUD_FILES_CHANGED));
    return result;
  }, [refetch]);

  const shareFile = useCallback(async (fileId: string) => {
    await shareFileMutation({ variables: { fileId } });
    window.dispatchEvent(new Event(WindowEvents.SHARED_FILES_CHANGED));
  }, [shareFileMutation]);

  const deleteFile = useCallback(async (fileId: string) => {
    await deleteFileMutation({ variables: { fileId } });
    window.dispatchEvent(new Event(WindowEvents.CLOUD_FILES_CHANGED));
  }, [deleteFileMutation]);

  const renameFile = useCallback(async (fileId: string, newName: string) => {
    await renameFileMutation({ variables: { fileId, newName } });
  }, [renameFileMutation]);

  const moveFile = useCallback(async (fileId: string, targetFolderId: string | null) => {
    await moveFileMutation({ variables: { fileId, targetFolderId } });
  }, [moveFileMutation]);

  return {
    files,
    loading,
    error: error ? t('cloudFiles.loadError') : null,
    uploadFile,
    shareFile,
    deleteFile,
    renameFile,
    moveFile,
    reload: refetch,
  };
}
