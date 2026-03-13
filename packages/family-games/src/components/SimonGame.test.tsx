import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import SimonGame from './SimonGame';

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

describe('SimonGame', () => {
  it('renders the menu screen with title and start button', () => {
    const onBack = vi.fn();
    render(<SimonGame onBack={onBack} />);
    expect(screen.getByText('games.simonSays')).toBeInTheDocument();
    expect(screen.getByText('games.simonDesc')).toBeInTheDocument();
    expect(screen.getByText('games.startGame')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked on menu', () => {
    const onBack = vi.fn();
    render(<SimonGame onBack={onBack} />);
    fireEvent.click(screen.getByText('games.backToGames'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('transitions to showing phase when start is clicked', async () => {
    const onBack = vi.fn();
    render(<SimonGame onBack={onBack} />);
    fireEvent.click(screen.getByText('games.startGame'));
    // startGame uses setTimeout(500) before playSequence sets phase to 'showing'
    await act(async () => { vi.advanceTimersByTime(600); });
    // Four color buttons should appear with aria-labels
    expect(screen.getByLabelText('red')).toBeInTheDocument();
    expect(screen.getByLabelText('green')).toBeInTheDocument();
    expect(screen.getByLabelText('blue')).toBeInTheDocument();
    expect(screen.getByLabelText('yellow')).toBeInTheDocument();
  });

  it('shows scoring rules info on menu', () => {
    const onBack = vi.fn();
    render(<SimonGame onBack={onBack} />);
    expect(screen.getByText('games.scoringRules')).toBeInTheDocument();
    expect(screen.getByText('games.simonRules')).toBeInTheDocument();
  });
});
