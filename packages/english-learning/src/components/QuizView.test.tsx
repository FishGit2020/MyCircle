import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuizView from './QuizView';
import type { Phrase } from '../data/phrases';

const mockPhrases: Phrase[] = [
  { id: 'g01', english: 'Hi!', chinese: '嗨！', phonetic: 'hāi', category: 'greetings', difficulty: 1 },
  { id: 'g02', english: 'Bye bye!', chinese: '拜拜！', phonetic: 'bāibāi', category: 'greetings', difficulty: 1 },
  { id: 'g03', english: 'Please.', chinese: '请。', phonetic: 'plēez', category: 'greetings', difficulty: 1 },
  { id: 'g04', english: 'Thank you!', chinese: '谢谢你！', phonetic: 'thǐaŋk yōo', category: 'greetings', difficulty: 1 },
  { id: 'g05', english: 'Sorry.', chinese: '对不起。', phonetic: 'sǒrē', category: 'greetings', difficulty: 1 },
];

describe('QuizView', () => {
  it('shows a Chinese phrase as the question', () => {
    render(<QuizView phrases={mockPhrases} onQuizComplete={vi.fn()} />);
    expect(screen.getByTestId('quiz-question')).toBeInTheDocument();
  });

  it('shows 4 options', () => {
    render(<QuizView phrases={mockPhrases} onQuizComplete={vi.fn()} />);
    const options = screen.getAllByTestId('quiz-option');
    expect(options).toHaveLength(4);
  });

  it('shows correct/incorrect feedback after selecting an option', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<QuizView phrases={mockPhrases} onQuizComplete={vi.fn()} />);

    const options = screen.getAllByTestId('quiz-option');
    await user.click(options[0]);

    // Should show either "Correct!" or "Incorrect" feedback
    const feedback = screen.queryByText('Correct!') || screen.queryByText('Incorrect');
    expect(feedback).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('disables options after selection', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<QuizView phrases={mockPhrases} onQuizComplete={vi.fn()} />);

    const options = screen.getAllByTestId('quiz-option');
    await user.click(options[0]);

    options.forEach((option) => {
      expect(option).toBeDisabled();
    });

    vi.useRealTimers();
  });
});
