import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@mycircle/shared';
import { useTargetedSharing } from '../hooks/useTargetedSharing';
import type { ShareRecipient } from '../types';

interface ShareRecipientsModalProps {
  fileId: string;
  onClose: () => void;
}

export default function ShareRecipientsModal({ fileId, onClose }: ShareRecipientsModalProps) {
  const { t } = useTranslation();
  const { shareFileWith, revokeFileAccess, getRecipients } = useTargetedSharing();
  const [email, setEmail] = useState('');
  const [recipients, setRecipients] = useState<ShareRecipient[]>([]);
  const [error, setError] = useState('');
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    getRecipients(fileId).then(setRecipients).catch(() => {});
  }, [fileId, getRecipients]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleShare = useCallback(async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    setError('');
    setSharing(true);
    try {
      await shareFileWith(fileId, trimmed);
      setEmail('');
      const updated = await getRecipients(fileId);
      setRecipients(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('cloudFiles.recipientNotFound'));
    } finally {
      setSharing(false);
    }
  }, [email, fileId, shareFileWith, getRecipients, t]);

  const handleRevoke = useCallback(async (shareId: string) => {
    if (!window.confirm(t('cloudFiles.revokeConfirm'))) return;
    await revokeFileAccess(shareId);
    setRecipients(prev => prev.filter(r => r.shareId !== shareId));
  }, [revokeFileAccess, t]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('cloudFiles.shareWith')}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">{t('cloudFiles.shareWith')}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('cloudFiles.renameCancel')}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Email input */}
        <div className="flex gap-2 mb-4">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleShare(); }}
            placeholder={t('cloudFiles.shareWithEmail')}
            aria-label={t('cloudFiles.shareWithEmail')}
            className="flex-1 text-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <button
            type="button"
            onClick={handleShare}
            disabled={sharing || !email.trim()}
            className="px-4 py-2 text-sm bg-cyan-500 dark:bg-cyan-600 text-white rounded-lg min-h-[44px] hover:bg-cyan-600 dark:hover:bg-cyan-500 disabled:opacity-50"
          >
            {t('cloudFiles.shareWithButton')}
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-500 dark:text-red-400 mb-3">{error}</p>
        )}

        {/* Recipients list */}
        {recipients.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t('cloudFiles.shareRecipients')}</p>
            <ul className="space-y-2">
              {recipients.map(r => (
                <li key={r.shareId} className="flex items-center justify-between">
                  <span className="text-sm text-gray-900 dark:text-white">{r.recipientName}</span>
                  <button
                    type="button"
                    onClick={() => handleRevoke(r.shareId)}
                    aria-label={`${t('cloudFiles.revokeAccess')} ${r.recipientName}`}
                    className="text-xs text-red-500 dark:text-red-400 hover:underline min-h-[44px] px-2"
                  >
                    {t('cloudFiles.revokeAccess')}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
