import { useState, useCallback } from 'react';
import { useTranslation, PageContent } from '@mycircle/shared';
import type { Poll } from '../types';

interface PollDetailProps {
  poll: Poll;
  votedOptionId?: string;
  onVote: (pollId: string, optionId: string) => void;
  onChangeVote: (pollId: string, oldOptionId: string, newOptionId: string) => void;
  onDelete: () => void;
  onBack: () => void;
}

function isExpired(poll: Poll): boolean {
  if (!poll.expiresAt) return false;
  return new Date(poll.expiresAt).getTime() < Date.now();
}

function exportToCsv(poll: Poll): void {
  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
  const expired = isExpired(poll);
  const status = expired ? 'Expired' : 'Active';
  const exportDate = new Date().toLocaleString();

  const lines: string[] = [
    `Question,"${poll.question.replace(/"/g, '""')}"`,
    `Status,${status}`,
    `Total Votes,${totalVotes}`,
    `Export Date,${exportDate}`,
    '',
    'Option,Votes,Percentage',
    ...poll.options.map(o => {
      const pct = totalVotes > 0 ? Math.round((o.votes / totalVotes) * 100) : 0;
      return `"${o.text.replace(/"/g, '""')}",${o.votes},${pct}%`;
    }),
  ];

  const csv = lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `poll-results-${poll.id}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PollDetail({ poll, votedOptionId, onVote, onChangeVote, onDelete, onBack }: PollDetailProps) {
  const { t } = useTranslation();
  const [changingVote, setChangingVote] = useState(false);
  const [pendingOptionId, setPendingOptionId] = useState<string | null>(null);

  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
  const expired = isExpired(poll);
  const maxVotes = Math.max(...poll.options.map(o => o.votes), 1);
  const currentUid = (window as any).__currentUid; // eslint-disable-line @typescript-eslint/no-explicit-any
  const isCreator = poll.createdBy === currentUid;

  const handleVoteClick = useCallback((optionId: string) => {
    if (expired) return;
    if (changingVote && votedOptionId) {
      // In change-vote mode — select the pending option
      if (optionId === votedOptionId) {
        // Clicked same option — cancel change
        setChangingVote(false);
        setPendingOptionId(null);
        return;
      }
      setPendingOptionId(optionId);
      return;
    }
    if (!votedOptionId) {
      onVote(poll.id, optionId);
    }
  }, [expired, changingVote, votedOptionId, poll.id, onVote]);

  const handleConfirmChange = useCallback(() => {
    if (!pendingOptionId || !votedOptionId) return;
    onChangeVote(poll.id, votedOptionId, pendingOptionId);
    setChangingVote(false);
    setPendingOptionId(null);
  }, [pendingOptionId, votedOptionId, poll.id, onChangeVote]);

  const handleCancelChange = useCallback(() => {
    setChangingVote(false);
    setPendingOptionId(null);
  }, []);

  return (
    <PageContent maxWidth="4xl" className="space-y-6">
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
        <div className="flex items-center gap-2">
          {isCreator && (
            <button
              type="button"
              onClick={() => exportToCsv(poll)}
              className="px-3 py-1.5 text-sm text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition"
              aria-label={t('pollSystem.downloadResults')}
            >
              {t('pollSystem.downloadResults')}
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
          >
            {t('pollSystem.delete')}
          </button>
        </div>
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

      {/* Final results heading for expired polls */}
      {expired && totalVotes > 0 && (
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t('pollSystem.finalResults')}
        </p>
      )}

      {/* Change-vote mode banner */}
      {changingVote && (
        <div className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg text-sm text-violet-700 dark:text-violet-300 flex items-center justify-between gap-3">
          <span>{t('pollSystem.changeVoteTitle')}</span>
          <button type="button" onClick={handleCancelChange} className="text-xs underline">
            {t('pollSystem.cancelChange')}
          </button>
        </div>
      )}

      {/* Confirmation for pending vote change */}
      {pendingOptionId && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-between gap-3">
          <span className="text-sm text-amber-800 dark:text-amber-200">
            {poll.options.find(o => o.id === pendingOptionId)?.text}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirmChange}
              className="px-3 py-1 text-xs font-medium bg-violet-500 hover:bg-violet-600 text-white rounded-lg transition"
            >
              {t('pollSystem.changeVoteConfirm')}
            </button>
            <button
              type="button"
              onClick={handleCancelChange}
              className="px-3 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100 rounded-lg transition"
            >
              {t('pollSystem.cancelChange')}
            </button>
          </div>
        </div>
      )}

      {/* Options */}
      <div className="space-y-3">
        {totalVotes === 0 && (
          <p className="text-sm text-center text-gray-400 dark:text-gray-500 py-2">
            {t('pollSystem.noVotesYet')}
          </p>
        )}
        {poll.options.map(option => {
          const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
          const barWidth = totalVotes > 0 ? (option.votes / maxVotes) * 100 : 0;
          const isLeading = option.votes === maxVotes && totalVotes > 0 && option.votes > 0;
          const isVotedOption = option.id === votedOptionId;
          const isPending = option.id === pendingOptionId;

          // Determine clickability
          const canClick = !expired && (!votedOptionId || changingVote) && option.id !== votedOptionId;

          return (
            <div key={option.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => handleVoteClick(option.id)}
                    disabled={!canClick}
                    className={`text-sm font-medium text-left transition min-h-[44px] py-2 ${
                      isVotedOption && !changingVote
                        ? 'text-violet-700 dark:text-violet-300 font-semibold'
                        : isPending
                        ? 'text-amber-700 dark:text-amber-300'
                        : canClick
                        ? 'text-gray-800 dark:text-white hover:text-violet-600 dark:hover:text-violet-400'
                        : 'text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    }`}
                    aria-label={`${t('pollSystem.voteFor')} ${option.text}`}
                  >
                    {option.text}
                  </button>
                  {isVotedOption && !changingVote && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 flex-shrink-0">
                      {t('pollSystem.voted')}
                    </span>
                  )}
                  {isLeading && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 flex-shrink-0">
                      {t('pollSystem.leadingOption')}
                    </span>
                  )}
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                  {option.votes} ({percentage}%)
                </span>
              </div>
              <div className="w-full h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isVotedOption
                      ? 'bg-violet-500 dark:bg-violet-400'
                      : isLeading
                      ? 'bg-violet-400 dark:bg-violet-500'
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
          {t('pollSystem.totalVoters').replace('{count}', String(totalVotes))}
        </p>
      </div>

      {/* Vote instruction / change-vote action */}
      {!expired && !votedOptionId && (
        <p className="text-xs text-center text-gray-400 dark:text-gray-500">
          {t('pollSystem.clickToVote')}
        </p>
      )}
      {!expired && votedOptionId && !changingVote && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setChangingVote(true)}
            className="text-xs text-violet-600 dark:text-violet-400 hover:underline"
            aria-label={t('pollSystem.changeVote')}
          >
            {t('pollSystem.changeVote')}
          </button>
        </div>
      )}
    </PageContent>
  );
}
