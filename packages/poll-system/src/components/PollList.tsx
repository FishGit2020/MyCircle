import { useTranslation } from '@mycircle/shared';
import type { Poll } from '../types';

interface PollListProps {
  polls: Poll[];
  onSelect: (poll: Poll) => void;
  onDelete: (id: string) => void;
}

function getTotalVotes(poll: Poll): number {
  return poll.options.reduce((sum, o) => sum + o.votes, 0);
}

function isExpired(poll: Poll): boolean {
  if (!poll.expiresAt) return false;
  return new Date(poll.expiresAt).getTime() < Date.now();
}

export default function PollList({ polls, onSelect, onDelete }: PollListProps) {
  const { t } = useTranslation();

  if (polls.length === 0) {
    return (
      <div className="text-center py-16">
        <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        <p className="text-gray-500 dark:text-gray-400">{t('pollSystem.noPolls')}</p>
      </div>
    );
  }

  const sorted = [...polls].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="space-y-3">
      {sorted.map(poll => {
        const totalVotes = getTotalVotes(poll);
        const expired = isExpired(poll);

        return (
          <button
            key={poll.id}
            type="button"
            onClick={() => onSelect(poll)}
            className="w-full text-left p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md hover:border-violet-300 dark:hover:border-violet-600 transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">{poll.question}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {poll.options.length} {t('pollSystem.options')} &middot; {totalVotes} {t('pollSystem.votes')}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
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
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {t('pollSystem.public')}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
