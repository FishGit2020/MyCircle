import { useState, useCallback } from 'react';
import { useTranslation, PageContent } from '@mycircle/shared';
import { usePolls } from '../hooks/usePolls';
import PollList from './PollList';
import PollForm from './PollForm';
import PollDetail from './PollDetail';
import type { Poll } from '../types';

type View = 'list' | 'new' | 'detail';

export default function PollSystem() {
  const { t } = useTranslation();
  const { polls, loading, error, addPoll, deletePoll, vote } = usePolls();
  const [view, setView] = useState<View>('list');
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);

  const handleSave = useCallback(async (data: Omit<Poll, 'id' | 'createdAt' | 'updatedAt'>) => {
    await addPoll(data);
    setView('list');
  }, [addPoll]);

  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm(t('pollSystem.deleteConfirm'))) return;
    await deletePoll(id);
    setView('list');
    setSelectedPoll(null);
  }, [deletePoll, t]);

  const handleSelect = useCallback((poll: Poll) => {
    setSelectedPoll(poll);
    setView('detail');
  }, []);

  const handleBack = useCallback(() => {
    setView('list');
    setSelectedPoll(null);
  }, []);

  const handleVote = useCallback(async (pollId: string, optionId: string) => {
    await vote(pollId, optionId);
  }, [vote]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16" role="status" aria-live="polite">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (view === 'new') {
    return (
      <PollForm
        onSave={handleSave}
        onCancel={handleBack}
      />
    );
  }

  if (view === 'detail' && selectedPoll) {
    const currentPoll = polls.find(p => p.id === selectedPoll.id) || selectedPoll;
    return (
      <PollDetail
        poll={currentPoll}
        onVote={handleVote}
        onDelete={() => handleDelete(currentPoll.id)}
        onBack={handleBack}
      />
    );
  }

  return (
    <PageContent className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <svg className="w-7 h-7 text-violet-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          {t('pollSystem.title')}
        </h1>
        <button
          type="button"
          onClick={() => setView('new')}
          className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium rounded-lg transition"
        >
          {t('pollSystem.newPoll')}
        </button>
      </div>
      <PollList polls={polls} onSelect={handleSelect} onDelete={handleDelete} />
    </PageContent>
  );
}
