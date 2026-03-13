import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AnagramGame from './AnagramGame';

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

describe('AnagramGame', () => {
  it('renders the menu screen with start and back buttons', () => {
    const onBack = vi.fn();
    render(<AnagramGame onBack={onBack} />);
    expect(screen.getByText('games.anagram')).toBeInTheDocument();
    expect(screen.getByText('games.anagramDesc')).toBeInTheDocument();
    expect(screen.getByText('games.startGame')).toBeInTheDocument();
    expect(screen.getByText('games.backToGames')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked on menu', () => {
    const onBack = vi.fn();
    render(<AnagramGame onBack={onBack} />);
    fireEvent.click(screen.getByText('games.backToGames'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('transitions to playing phase when start is clicked', () => {
    const onBack = vi.fn();
    render(<AnagramGame onBack={onBack} />);
    fireEvent.click(screen.getByText('games.startGame'));
    // In playing phase, we should see the answer input and score
    expect(screen.getByLabelText('Answer')).toBeInTheDocument();
    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('shows scoring rules info on menu', () => {
    const onBack = vi.fn();
    render(<AnagramGame onBack={onBack} />);
    expect(screen.getByText('games.scoringRules')).toBeInTheDocument();
    expect(screen.getByText('games.anagramRules')).toBeInTheDocument();
  });
});
