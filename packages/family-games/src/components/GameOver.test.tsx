import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GameOver from './GameOver';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  (window as any).__familyGames = undefined;
});

describe('GameOver', () => {
  const defaultProps = {
    gameType: 'trivia' as const,
    score: 500,
    timeMs: 30000,
    difficulty: 'mixed',
    onPlayAgain: vi.fn(),
    onBack: vi.fn(),
  };

  it('renders game over text and score', () => {
    render(<GameOver {...defaultProps} />);
    expect(screen.getByText('games.gameOver')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
  });

  it('displays time and difficulty', () => {
    render(<GameOver {...defaultProps} />);
    // timeMs 30000 => 30.0s
    expect(screen.getByText(/30\.0s/)).toBeInTheDocument();
    expect(screen.getByText(/mixed/)).toBeInTheDocument();
  });

  it('renders play again and back buttons', () => {
    render(<GameOver {...defaultProps} />);
    expect(screen.getByText('games.playAgain')).toBeInTheDocument();
    expect(screen.getByText('games.backToGames')).toBeInTheDocument();
    expect(screen.getByText('games.shareScore')).toBeInTheDocument();
  });

  it('calls onPlayAgain when play again is clicked', () => {
    render(<GameOver {...defaultProps} />);
    fireEvent.click(screen.getByText('games.playAgain'));
    expect(defaultProps.onPlayAgain).toHaveBeenCalledTimes(1);
  });

  it('calls onBack when back button is clicked', () => {
    render(<GameOver {...defaultProps} />);
    fireEvent.click(screen.getByText('games.backToGames'));
    expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
  });

  it('shows scoring rules when toggle is clicked', () => {
    render(<GameOver {...defaultProps} />);
    fireEvent.click(screen.getByText('games.howScoringWorks'));
    expect(screen.getByText('games.scoringTrivia')).toBeInTheDocument();
  });

  it('auto-saves score when window.__familyGames is available', async () => {
    const saveScore = vi.fn().mockResolvedValue(undefined);
    (window as any).__familyGames = { saveScore };
    render(<GameOver {...defaultProps} />);
    await vi.waitFor(() => {
      expect(saveScore).toHaveBeenCalledWith({
        gameType: 'trivia',
        score: 500,
        timeMs: 30000,
        difficulty: 'mixed',
      });
    });
    await vi.waitFor(() => {
      expect(screen.getByText('games.scoreSubmitted')).toBeInTheDocument();
    });
  });

  it('shows error when save fails', async () => {
    const saveScore = vi.fn().mockRejectedValue(new Error('fail'));
    (window as any).__familyGames = { saveScore };
    render(<GameOver {...defaultProps} />);
    await vi.waitFor(() => {
      expect(screen.getByText('games.submitFailed')).toBeInTheDocument();
    });
  });
});
