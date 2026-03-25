import { useCallback } from 'react';
import { useMutation, useLazyQuery, useTranslation, SHARE_FILE_WITH, REVOKE_FILE_ACCESS, GET_FILE_SHARE_RECIPIENTS } from '@mycircle/shared';
import type { ShareRecipient } from '../types';

export function useTargetedSharing() {
  const { t } = useTranslation();
  const [shareFileWithMutation] = useMutation(SHARE_FILE_WITH);
  const [revokeFileAccessMutation] = useMutation(REVOKE_FILE_ACCESS);
  const [getRecipientsQuery] = useLazyQuery(GET_FILE_SHARE_RECIPIENTS);

  const shareFileWith = useCallback(async (fileId: string, recipientEmail: string) => {
    const result = await shareFileWithMutation({ variables: { fileId, recipientEmail } });
    return result.data?.shareFileWith as { ok: boolean; shareId: string } | undefined;
  }, [shareFileWithMutation]);

  const revokeFileAccess = useCallback(async (shareId: string) => {
    await revokeFileAccessMutation({ variables: { shareId } });
  }, [revokeFileAccessMutation]);

  const getRecipients = useCallback(async (fileId: string): Promise<ShareRecipient[]> => {
    const result = await getRecipientsQuery({ variables: { fileId } });
    return (result.data?.fileShareRecipients ?? []) as ShareRecipient[];
  }, [getRecipientsQuery]);

  return {
    shareFileWith,
    revokeFileAccess,
    getRecipients,
    loadError: t('cloudFiles.loadError'),
    recipientNotFoundError: t('cloudFiles.recipientNotFound'),
  };
}
