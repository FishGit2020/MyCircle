import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ReactionGame from './ReactionGame';

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
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ReactionGame', () => {
  it('renders the menu screen with title and start button', () => {
    const onBack = vi.fn();
    render(<ReactionGame onBack={onBack} />);
    expect(screen.getByText('games.reactionTime')).toBeInTheDocument();
    expect(screen.getByText('games.startGame')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked on menu', () => {
    const onBack = vi.fn();
    render(<ReactionGame onBack={onBack} />);
    fireEvent.click(screen.getByText('games.backToGames'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('transitions to waiting phase when start is clicked', () => {
    const onBack = vi.fn();
    render(<ReactionGame onBack={onBack} />);
    fireEvent.click(screen.getByText('games.startGame'));
    // Waiting phase shows a red "wait" button
    expect(screen.getByText('games.reactionWait')).toBeInTheDocument();
  });

  it('shows too early message if tapped during waiting phase', () => {
    const onBack = vi.fn();
    render(<ReactionGame onBack={onBack} />);
    fireEvent.click(screen.getByText('games.startGame'));
    // Tap during waiting phase
    fireEvent.click(screen.getByText('games.reactionWait'));
    expect(screen.getByText('games.reactionTooEarly')).toBeInTheDocument();
  });

  it('shows scoring rules info on menu', () => {
    const onBack = vi.fn();
    render(<ReactionGame onBack={onBack} />);
    expect(screen.getByText('games.scoringRules')).toBeInTheDocument();
    expect(screen.getByText('games.reactionRules')).toBeInTheDocument();
  });
});
