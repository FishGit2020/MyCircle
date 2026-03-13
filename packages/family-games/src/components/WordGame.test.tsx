import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import WordGame from './WordGame';

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

vi.mock('../data/wordList', () => ({
  default: ['apple', 'brain', 'chair', 'dance', 'eagle', 'flame', 'grape', 'house'],
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('WordGame', () => {
  it('renders the game title and back button', () => {
    const onBack = vi.fn();
    render(<WordGame onBack={onBack} />);
    expect(screen.getByText('games.wordGame')).toBeInTheDocument();
    expect(screen.getByText('games.backToGames')).toBeInTheDocument();
  });

  it('renders the keyboard with letter keys', () => {
    const onBack = vi.fn();
    render(<WordGame onBack={onBack} />);
    // Check a few keyboard keys
    expect(screen.getByText('q')).toBeInTheDocument();
    expect(screen.getByText('w')).toBeInTheDocument();
    expect(screen.getByText('e')).toBeInTheDocument();
    expect(screen.getByText('Enter')).toBeInTheDocument();
  });

  it('renders the 6-row grid for guesses', () => {
    const onBack = vi.fn();
    const { container } = render(<WordGame onBack={onBack} />);
    // 6 rows x 5 columns = 30 tile cells
    const tiles = container.querySelectorAll('.w-12');
    expect(tiles.length).toBe(30);
  });

  it('shows scoring rules', () => {
    const onBack = vi.fn();
    render(<WordGame onBack={onBack} />);
    expect(screen.getByText(/games\.scoringRules/)).toBeInTheDocument();
    expect(screen.getByText(/games\.wordRules/)).toBeInTheDocument();
  });
});
