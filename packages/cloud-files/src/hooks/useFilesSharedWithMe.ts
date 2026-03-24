import { useQuery, useTranslation, GET_FILES_SHARED_WITH_ME } from '@mycircle/shared';
import type { TargetedSharedFile } from '../types';

export function useFilesSharedWithMe() {
  const { t } = useTranslation();
  const { data, loading, error, refetch } = useQuery(GET_FILES_SHARED_WITH_ME);

  const files: TargetedSharedFile[] = (data?.filesSharedWithMe ?? []) as TargetedSharedFile[];

  return {
    files,
    loading,
    error: error ? t('cloudFiles.loadError') : null,
    reload: refetch,
  };
}
