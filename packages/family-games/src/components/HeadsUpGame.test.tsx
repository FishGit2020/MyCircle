import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HeadsUpGame from './HeadsUpGame';

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

describe('HeadsUpGame', () => {
  it('renders the menu screen with title and description', () => {
    const onBack = vi.fn();
    render(<HeadsUpGame onBack={onBack} />);
    expect(screen.getByText('games.headsUp')).toBeInTheDocument();
    expect(screen.getByText('games.headsUpDesc')).toBeInTheDocument();
    expect(screen.getByText('games.startGame')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked on menu', () => {
    const onBack = vi.fn();
    render(<HeadsUpGame onBack={onBack} />);
    fireEvent.click(screen.getByText('games.backToGames'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('transitions to ready phase when start is clicked', () => {
    const onBack = vi.fn();
    render(<HeadsUpGame onBack={onBack} />);
    fireEvent.click(screen.getByText('games.startGame'));
    // Ready phase shows "hold up" instructions and a "Ready" button
    expect(screen.getByText('games.holdUp')).toBeInTheDocument();
    expect(screen.getByText('games.ready')).toBeInTheDocument();
  });

  it('transitions to playing phase when ready button is clicked', () => {
    const onBack = vi.fn();
    render(<HeadsUpGame onBack={onBack} />);
    fireEvent.click(screen.getByText('games.startGame'));
    fireEvent.click(screen.getByText('games.ready'));
    // Playing phase shows Got It and Pass buttons
    expect(screen.getByText('games.gotIt')).toBeInTheDocument();
    expect(screen.getByText('games.pass')).toBeInTheDocument();
  });

  it('shows scoring rules info on menu', () => {
    const onBack = vi.fn();
    render(<HeadsUpGame onBack={onBack} />);
    expect(screen.getByText('games.scoringRules')).toBeInTheDocument();
    expect(screen.getByText('games.headsUpRules')).toBeInTheDocument();
  });
});
