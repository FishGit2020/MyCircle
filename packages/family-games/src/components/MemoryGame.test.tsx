import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MemoryGame from './MemoryGame';

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

describe('MemoryGame', () => {
  it('renders the menu screen with title and difficulty buttons', () => {
    const onBack = vi.fn();
    render(<MemoryGame onBack={onBack} />);
    expect(screen.getByText('games.memoryMatch')).toBeInTheDocument();
    expect(screen.getByText('games.difficulty')).toBeInTheDocument();
    expect(screen.getByText('games.easy')).toBeInTheDocument();
    expect(screen.getByText('games.medium')).toBeInTheDocument();
    expect(screen.getByText('games.hard')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked on menu', () => {
    const onBack = vi.fn();
    render(<MemoryGame onBack={onBack} />);
    fireEvent.click(screen.getByText('games.backToGames'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('transitions to playing phase and shows card grid', () => {
    const onBack = vi.fn();
    render(<MemoryGame onBack={onBack} />);
    fireEvent.click(screen.getByText('games.easy'));
    // Easy mode: 4x4 = 16 cards, all showing "?"
    const hiddenCards = screen.getAllByText('?');
    expect(hiddenCards.length).toBe(16);
  });

  it('shows scoring rules info on menu', () => {
    const onBack = vi.fn();
    render(<MemoryGame onBack={onBack} />);
    expect(screen.getByText('games.scoringRules')).toBeInTheDocument();
    expect(screen.getByText('games.memoryRules')).toBeInTheDocument();
  });
});
