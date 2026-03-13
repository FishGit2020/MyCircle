import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MathGame from './MathGame';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('./GameOver', () => ({
  default: ({ score, onPlayAgain, onBack }: { score: number; onPlayAgain: () => void; onBack: () => void }) => (
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
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('MathGame', () => {
  it('renders the menu screen with title and difficulty buttons', () => {
    const onBack = vi.fn();
    render(<MathGame onBack={onBack} />);
    expect(screen.getByText('games.mathChallenge')).toBeInTheDocument();
    expect(screen.getByText('games.easy')).toBeInTheDocument();
    expect(screen.getByText('games.medium')).toBeInTheDocument();
    expect(screen.getByText('games.hard')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked on menu', () => {
    const onBack = vi.fn();
    render(<MathGame onBack={onBack} />);
    fireEvent.click(screen.getByText('games.backToGames'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('transitions to playing phase when difficulty is selected', () => {
    const onBack = vi.fn();
    render(<MathGame onBack={onBack} />);
    fireEvent.click(screen.getByText('games.easy'));
    // Playing phase shows the number pad and score
    expect(screen.getByText('=')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.getByText(/games\.score/)).toBeInTheDocument();
  });

  it('shows numpad keys in playing phase', () => {
    const onBack = vi.fn();
    render(<MathGame onBack={onBack} />);
    fireEvent.click(screen.getByText('games.easy'));
    for (const digit of ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']) {
      expect(screen.getByText(digit)).toBeInTheDocument();
    }
  });

  it('shows scoring rules info on menu', () => {
    const onBack = vi.fn();
    render(<MathGame onBack={onBack} />);
    expect(screen.getByText('games.scoringRules')).toBeInTheDocument();
    expect(screen.getByText('games.mathRules')).toBeInTheDocument();
  });
});
