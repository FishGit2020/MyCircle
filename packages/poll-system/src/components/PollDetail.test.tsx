import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PollDetail from './PollDetail';
import type { Poll } from '../types';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  PageContent: ({ children, className }: any) => <div className={className}>{children}</div>, // eslint-disable-line @typescript-eslint/no-explicit-any
}));

const basePoll: Poll = {
  id: 'poll-1',
  question: 'Favourite colour?',
  options: [
    { id: 'opt-a', text: 'Red', votes: 10 },
    { id: 'opt-b', text: 'Blue', votes: 5 },
    { id: 'opt-c', text: 'Green', votes: 2 },
  ],
  createdBy: 'user-creator',
  isPublic: true,
  expiresAt: null,
  createdAt: Date.now() - 10000,
  updatedAt: Date.now() - 10000,
};

const expiredPoll: Poll = {
  ...basePoll,
  id: 'poll-2',
  expiresAt: new Date(Date.now() - 1000).toISOString(),
};

const zeroVotePoll: Poll = {
  ...basePoll,
  id: 'poll-3',
  options: basePoll.options.map(o => ({ ...o, votes: 0 })),
};

const mockHandlers = {
  onVote: vi.fn(),
  onChangeVote: vi.fn(),
  onDelete: vi.fn(),
  onBack: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  (window as any).__currentUid = 'user-other'; // eslint-disable-line @typescript-eslint/no-explicit-any
});

describe('PollDetail — US1: Vote integrity', () => {
  it('shows voted badge on selected option when votedOptionId is set', () => {
    render(<PollDetail poll={basePoll} votedOptionId="opt-a" {...mockHandlers} />);
    expect(screen.getByText('pollSystem.voted')).toBeInTheDocument();
  });

  it('vote buttons are disabled for all options when user has already voted', () => {
    render(<PollDetail poll={basePoll} votedOptionId="opt-a" {...mockHandlers} />);
    const voteButtons = screen.getAllByRole('button', { name: /pollSystem\.voteFor/i });
    voteButtons.forEach(btn => {
      expect(btn).toBeDisabled();
    });
  });

  it('clicking an option calls onVote when user has not voted yet', () => {
    render(<PollDetail poll={basePoll} votedOptionId={undefined} {...mockHandlers} />);
    const buttons = screen.getAllByRole('button', { name: /pollSystem\.voteFor/i });
    fireEvent.click(buttons[0]);
    expect(mockHandlers.onVote).toHaveBeenCalledWith('poll-1', 'opt-a');
  });

  it('voting is disabled on expired polls regardless of voted state', () => {
    render(<PollDetail poll={expiredPoll} votedOptionId={undefined} {...mockHandlers} />);
    const voteButtons = screen.getAllByRole('button', { name: /pollSystem\.voteFor/i });
    voteButtons.forEach(btn => {
      expect(btn).toBeDisabled();
    });
    fireEvent.click(voteButtons[0]);
    expect(mockHandlers.onVote).not.toHaveBeenCalled();
  });
});

describe('PollDetail — US3: Results analytics', () => {
  it('shows Leading badge on the highest-vote option', () => {
    render(<PollDetail poll={basePoll} votedOptionId={undefined} {...mockHandlers} />);
    expect(screen.getByText('pollSystem.leadingOption')).toBeInTheDocument();
  });

  it('does not show Leading badge when all votes are zero', () => {
    render(<PollDetail poll={zeroVotePoll} votedOptionId={undefined} {...mockHandlers} />);
    expect(screen.queryByText('pollSystem.leadingOption')).not.toBeInTheDocument();
  });

  it('shows Final Results heading when poll is expired', () => {
    render(<PollDetail poll={expiredPoll} votedOptionId={undefined} {...mockHandlers} />);
    expect(screen.getByText('pollSystem.finalResults')).toBeInTheDocument();
  });

  it('shows No votes yet when totalVotes is zero', () => {
    render(<PollDetail poll={zeroVotePoll} votedOptionId={undefined} {...mockHandlers} />);
    expect(screen.getByText('pollSystem.noVotesYet')).toBeInTheDocument();
  });
});

describe('PollDetail — US4: Change vote', () => {
  it('shows Change Vote button when user has voted and poll is active', () => {
    render(<PollDetail poll={basePoll} votedOptionId="opt-a" {...mockHandlers} />);
    expect(screen.getByRole('button', { name: 'pollSystem.changeVote' })).toBeInTheDocument();
  });

  it('does not show Change Vote button when poll is expired', () => {
    render(<PollDetail poll={expiredPoll} votedOptionId="opt-a" {...mockHandlers} />);
    expect(screen.queryByRole('button', { name: 'pollSystem.changeVote' })).not.toBeInTheDocument();
  });

  it('does not show Change Vote button when user has not voted', () => {
    render(<PollDetail poll={basePoll} votedOptionId={undefined} {...mockHandlers} />);
    expect(screen.queryByRole('button', { name: 'pollSystem.changeVote' })).not.toBeInTheDocument();
  });

  it('cancelling change-vote flow leaves original vote unchanged', () => {
    render(<PollDetail poll={basePoll} votedOptionId="opt-a" {...mockHandlers} />);
    fireEvent.click(screen.getByRole('button', { name: 'pollSystem.changeVote' }));
    // Should see the cancel button now
    expect(screen.getByText('pollSystem.cancelChange')).toBeInTheDocument();
    fireEvent.click(screen.getByText('pollSystem.cancelChange'));
    // Change-vote mode exited — voted badge should still be there
    expect(screen.getByText('pollSystem.voted')).toBeInTheDocument();
    expect(mockHandlers.onChangeVote).not.toHaveBeenCalled();
  });
});

describe('PollDetail — US5: Export', () => {
  it('shows Download Results button to poll creator', () => {
    (window as any).__currentUid = 'user-creator'; // eslint-disable-line @typescript-eslint/no-explicit-any
    render(<PollDetail poll={basePoll} votedOptionId={undefined} {...mockHandlers} />);
    expect(screen.getByRole('button', { name: 'pollSystem.downloadResults' })).toBeInTheDocument();
  });

  it('does not show Download Results button to non-creator', () => {
    (window as any).__currentUid = 'user-other'; // eslint-disable-line @typescript-eslint/no-explicit-any
    render(<PollDetail poll={basePoll} votedOptionId={undefined} {...mockHandlers} />);
    expect(screen.queryByRole('button', { name: 'pollSystem.downloadResults' })).not.toBeInTheDocument();
  });
});
