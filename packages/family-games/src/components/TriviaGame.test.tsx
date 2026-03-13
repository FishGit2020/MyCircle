import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TriviaGame from './TriviaGame';

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

vi.mock('./Timer', () => ({
  default: ({ durationMs, running }: any) => (
    <div data-testid="timer">Timer: {Math.ceil(durationMs / 1000)}s {running ? 'running' : 'stopped'}</div>
  ),
}));

vi.mock('../data/triviaQuestions', () => ({
  default: [
    {
      question: 'What is 2+2?',
      options: ['3', '4', '5', '6'],
      correctIndex: 1,
      category: 'science',
    },
    {
      question: 'Capital of France?',
      options: ['London', 'Paris', 'Berlin', 'Madrid'],
      correctIndex: 1,
      category: 'geography',
    },
  ],
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('TriviaGame', () => {
  it('renders the menu screen with title and category buttons', () => {
    const onBack = vi.fn();
    render(<TriviaGame onBack={onBack} />);
    expect(screen.getByText('games.trivia')).toBeInTheDocument();
    expect(screen.getByText('games.startGame')).toBeInTheDocument();
    expect(screen.getByText('games.allCategories')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked on menu', () => {
    const onBack = vi.fn();
    render(<TriviaGame onBack={onBack} />);
    fireEvent.click(screen.getByText('games.backToGames'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('transitions to playing phase and shows a question', () => {
    const onBack = vi.fn();
    render(<TriviaGame onBack={onBack} />);
    fireEvent.click(screen.getByText('games.startGame'));
    // Should show a question and options
    expect(screen.getByTestId('timer')).toBeInTheDocument();
    // One of our mock questions should be visible
    const hasQuestion = screen.queryByText('What is 2+2?') || screen.queryByText('Capital of France?');
    expect(hasQuestion).toBeInTheDocument();
  });

  it('shows scoring rules info on menu', () => {
    const onBack = vi.fn();
    render(<TriviaGame onBack={onBack} />);
    expect(screen.getByText('games.scoringRules')).toBeInTheDocument();
    expect(screen.getByText('games.triviaRules')).toBeInTheDocument();
  });
});
