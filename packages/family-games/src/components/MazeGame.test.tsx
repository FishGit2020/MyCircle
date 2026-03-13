import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MazeGame from './MazeGame';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('./GameOver', () => ({
  default: ({ score, onPlayAgain, onBack }: any) => (
    <div>
      <span>GameOver</span>
      <span>Score: {score}</span>
      <button type="button" onClick={onPlayAgain}>Play Again</button>
      <button type="button" onClick={onBack}>Back</button>
    </div>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('MazeGame', () => {
  it('renders the menu screen with title and difficulty buttons', () => {
    const onBack = vi.fn();
    render(<MazeGame onBack={onBack} />);
    expect(screen.getByText('games.mazeRunner')).toBeInTheDocument();
    expect(screen.getByText('games.mazeDesc')).toBeInTheDocument();
    expect(screen.getByText('games.easy')).toBeInTheDocument();
    expect(screen.getByText('games.medium')).toBeInTheDocument();
    expect(screen.getByText('games.hard')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked on menu', () => {
    const onBack = vi.fn();
    render(<MazeGame onBack={onBack} />);
    fireEvent.click(screen.getByText('games.backToGames'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('transitions to playing phase and shows directional controls', () => {
    const onBack = vi.fn();
    render(<MazeGame onBack={onBack} />);
    fireEvent.click(screen.getByText('games.easy'));
    // Playing phase shows D-pad controls
    expect(screen.getByLabelText('Up')).toBeInTheDocument();
    expect(screen.getByLabelText('Down')).toBeInTheDocument();
    expect(screen.getByLabelText('Left')).toBeInTheDocument();
    expect(screen.getByLabelText('Right')).toBeInTheDocument();
  });

  it('shows scoring rules info on menu', () => {
    const onBack = vi.fn();
    render(<MazeGame onBack={onBack} />);
    expect(screen.getByText('games.scoringRules')).toBeInTheDocument();
    expect(screen.getByText('games.mazeRules')).toBeInTheDocument();
  });
});
