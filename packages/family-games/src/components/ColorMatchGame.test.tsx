import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ColorMatchGame from './ColorMatchGame';

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

describe('ColorMatchGame', () => {
  it('renders the menu screen with title and start button', () => {
    const onBack = vi.fn();
    render(<ColorMatchGame onBack={onBack} />);
    expect(screen.getByText('games.colorMatch')).toBeInTheDocument();
    expect(screen.getByText('games.colorMatchDesc')).toBeInTheDocument();
    expect(screen.getByText('games.startGame')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked on menu', () => {
    const onBack = vi.fn();
    render(<ColorMatchGame onBack={onBack} />);
    fireEvent.click(screen.getByText('games.backToGames'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('transitions to playing phase and shows color buttons', () => {
    const onBack = vi.fn();
    render(<ColorMatchGame onBack={onBack} />);
    fireEvent.click(screen.getByText('games.startGame'));
    // Color names appear in both the challenge text and buttons, so use getAllByText
    expect(screen.getAllByText('games.colorRed').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('games.colorGreen').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('games.colorBlue').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('games.colorYellow').length).toBeGreaterThanOrEqual(1);
  });

  it('shows scoring rules info on menu', () => {
    const onBack = vi.fn();
    render(<ColorMatchGame onBack={onBack} />);
    expect(screen.getByText('games.scoringRules')).toBeInTheDocument();
    expect(screen.getByText('games.colorMatchRules')).toBeInTheDocument();
  });
});
