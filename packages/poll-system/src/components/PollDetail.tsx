import { useCallback } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { Poll } from '../types';

interface PollDetailProps {
  poll: Poll;
  onVote: (pollId: string, optionId: string) => void;
  onDelete: () => void;
  onBack: () => void;
}

function isExpired(poll: Poll): boolean {
  if (!poll.expiresAt) return false;
  return new Date(poll.expiresAt).getTime() < Date.now();
}

export default function PollDetail({ poll, onVote, onDelete, onBack }: PollDetailProps) {
  const { t } = useTranslation();
  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
  const expired = isExpired(poll);
  const maxVotes = Math.max(...poll.options.map(o => o.votes), 1);

  const handleVote = useCallback((optionId: string) => {
    if (expired) return;
    onVote(poll.id, optionId);
  }, [poll.id, onVote, expired]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button type="button" onClick={onBack} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-2">
            &larr; {t('pollSystem.back')}
          </button>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{poll.question}</h2>
          <div className="flex items-center gap-2 mt-1">
            {expired ? (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                {t('pollSystem.expired')}
              </span>
            ) : (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                {t('pollSystem.active')}
              </span>
            )}
            {poll.isPublic && (
              <span className="text-xs text-gray-400 dark:text-gray-500">{t('pollSystem.public')}</span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
        >
          {t('pollSystem.delete')}
        </button>
      </div>

      {/* Expiration info */}
      {poll.expiresAt && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {expired
            ? `${t('pollSystem.expiredOn')} ${new Date(poll.expiresAt).toLocaleString()}`
            : `${t('pollSystem.expiresOn')} ${new Date(poll.expiresAt).toLocaleString()}`
          }
        </p>
      )}

      {/* Options with voting and bar chart */}
      <div className="space-y-3">
        {poll.options.map(option => {
          const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
          const barWidth = totalVotes > 0 ? (option.votes / maxVotes) * 100 : 0;
          const isLeading = option.votes === maxVotes && totalVotes > 0;

          return (
            <div key={option.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleVote(option.id)}
                  disabled={expired}
                  className={`text-sm font-medium text-left transition ${
                    expired
                      ? 'text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'text-gray-800 dark:text-white hover:text-violet-600 dark:hover:text-violet-400'
                  }`}
                  aria-label={`${t('pollSystem.voteFor')} ${option.text}`}
                >
                  {option.text}
                </button>
                <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                  {option.votes} ({percentage}%)
                </span>
              </div>
              <div className="w-full h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isLeading
                      ? 'bg-violet-500 dark:bg-violet-400'
                      : 'bg-purple-300 dark:bg-purple-600'
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Total votes */}
      <div className="text-center pt-2 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
          {t('pollSystem.totalVotes')}: {totalVotes}
        </p>
      </div>

      {/* Vote instruction */}
      {!expired && (
        <p className="text-xs text-center text-gray-400 dark:text-gray-500">
          {t('pollSystem.clickToVote')}
        </p>
      )}
    </div>
  );
}
