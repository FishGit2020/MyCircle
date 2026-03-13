import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SequenceGame from './SequenceGame';

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
});

describe('SequenceGame', () => {
  it('renders the menu screen with title and start button', () => {
    const onBack = vi.fn();
    render(<SequenceGame onBack={onBack} />);
    expect(screen.getByText('games.numberSequence')).toBeInTheDocument();
    expect(screen.getByText('games.sequenceDesc')).toBeInTheDocument();
    expect(screen.getByText('games.startGame')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked on menu', () => {
    const onBack = vi.fn();
    render(<SequenceGame onBack={onBack} />);
    fireEvent.click(screen.getByText('games.backToGames'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('transitions to playing phase and shows number sequence with numpad', () => {
    const onBack = vi.fn();
    render(<SequenceGame onBack={onBack} />);
    fireEvent.click(screen.getByText('games.startGame'));
    // Playing phase shows the numpad and score display
    expect(screen.getByText('=')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
    // Should show the "?" placeholder for the answer
    expect(screen.getByText(', ?')).toBeInTheDocument();
  });

  it('shows scoring rules info on menu', () => {
    const onBack = vi.fn();
    render(<SequenceGame onBack={onBack} />);
    expect(screen.getByText('games.scoringRules')).toBeInTheDocument();
    expect(screen.getByText('games.sequenceRules')).toBeInTheDocument();
  });
});
