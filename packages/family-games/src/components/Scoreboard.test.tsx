import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Scoreboard from './Scoreboard';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  (window as any).__familyGames = undefined;
});

describe('Scoreboard', () => {
  it('renders the scoreboard heading', () => {
    render(<Scoreboard />);
    expect(screen.getByText('games.scoreboard')).toBeInTheDocument();
  });

  it('renders score cards for all game types', () => {
    render(<Scoreboard />);
    expect(screen.getByText('games.trivia')).toBeInTheDocument();
    expect(screen.getByText('games.mathChallenge')).toBeInTheDocument();
    expect(screen.getByText('games.wordGame')).toBeInTheDocument();
    expect(screen.getByText('games.memoryMatch')).toBeInTheDocument();
    expect(screen.getByText('games.headsUp')).toBeInTheDocument();
    expect(screen.getByText('games.reactionTime')).toBeInTheDocument();
    expect(screen.getByText('games.simonSays')).toBeInTheDocument();
    expect(screen.getByText('games.numberSequence')).toBeInTheDocument();
    expect(screen.getByText('games.colorMatch')).toBeInTheDocument();
    expect(screen.getByText('games.mazeRunner')).toBeInTheDocument();
    expect(screen.getByText('games.anagram')).toBeInTheDocument();
  });

  it('shows no scores message when no API is available', async () => {
    render(<Scoreboard />);
    // When __familyGames is undefined, loading goes to false and shows "no scores"
    await vi.waitFor(() => {
      const noScoresElements = screen.getAllByText('games.noScores');
      expect(noScoresElements.length).toBeGreaterThan(0);
    });
  });

  it('shows loading then scores when API provides data', async () => {
    const mockScores = [
      { id: '1', gameType: 'trivia', score: 500, timeMs: 30000, difficulty: 'mixed', playedBy: { uid: 'u1', displayName: 'Alice' }, playedAt: '2025-01-01T12:00:00Z' },
    ];
    (window as any).__familyGames = {
      getScores: vi.fn().mockResolvedValue(mockScores),
      subscribe: vi.fn().mockReturnValue(() => {}),
    };
    render(<Scoreboard />);
    await vi.waitFor(() => {
      // "Alice" appears in every game card since the same mock data is returned for all
      expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);
    });
  });
});
