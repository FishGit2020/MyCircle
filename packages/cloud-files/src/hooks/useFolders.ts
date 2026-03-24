import { useCallback } from 'react';
import { useQuery, useMutation, useTranslation, GET_FOLDERS, CREATE_FOLDER, DELETE_FOLDER, RENAME_FOLDER } from '@mycircle/shared';
import type { Folder } from '../types';

export function useFolders() {
  const { t } = useTranslation();
  const { data, loading, error, refetch } = useQuery(GET_FOLDERS);
  const [createFolderMutation] = useMutation(CREATE_FOLDER, {
    refetchQueries: [{ query: GET_FOLDERS }],
  });
  const [deleteFolderMutation] = useMutation(DELETE_FOLDER, {
    refetchQueries: [{ query: GET_FOLDERS }],
  });
  const [renameFolderMutation] = useMutation(RENAME_FOLDER, {
    refetchQueries: [{ query: GET_FOLDERS }],
  });

  const folders: Folder[] = (data?.folders ?? []) as Folder[];

  const createFolder = useCallback(async (name: string, parentFolderId?: string | null) => {
    await createFolderMutation({ variables: { name, parentFolderId: parentFolderId ?? null } });
  }, [createFolderMutation]);

  const deleteFolder = useCallback(async (folderId: string, deleteContents: boolean) => {
    await deleteFolderMutation({ variables: { folderId, deleteContents } });
  }, [deleteFolderMutation]);

  const renameFolder = useCallback(async (folderId: string, newName: string) => {
    await renameFolderMutation({ variables: { folderId, newName } });
  }, [renameFolderMutation]);

  return {
    folders,
    loading,
    error: error ? t('cloudFiles.loadError') : null,
    createFolder,
    deleteFolder,
    renameFolder,
    reload: refetch,
  };
}
