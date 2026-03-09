import { useCallback } from 'react';
import { useQuery, useMutation, useTranslation, WindowEvents, GET_SHARED_FILES, DELETE_SHARED_FILE } from '@mycircle/shared';
import type { SharedFileItem } from '../types';

export function useSharedFiles() {
  const { t } = useTranslation();
  const { data, loading, error, refetch } = useQuery(GET_SHARED_FILES);
  const [deleteSharedFileMutation] = useMutation(DELETE_SHARED_FILE, {
    refetchQueries: [{ query: GET_SHARED_FILES }],
  });

  const files: SharedFileItem[] = (data?.sharedFiles ?? []) as SharedFileItem[];

  const deleteSharedFile = useCallback(async (fileId: string) => {
    await deleteSharedFileMutation({ variables: { fileId } });
    window.dispatchEvent(new Event(WindowEvents.SHARED_FILES_CHANGED));
  }, [deleteSharedFileMutation]);

  return {
    files,
    loading,
    error: error ? t('cloudFiles.loadError') : null,
    deleteSharedFile,
    reload: refetch,
  };
}
