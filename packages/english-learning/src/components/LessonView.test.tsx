import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LessonView from './LessonView';
import type { Phrase } from '../data/phrases';

const mockPhrases: Phrase[] = [
  { id: 'g01', english: 'Hi!', chinese: '嗨！', phonetic: 'hāi', category: 'greetings', difficulty: 1 },
  { id: 'g02', english: 'Bye bye!', chinese: '拜拜！', phonetic: 'bāibāi', category: 'greetings', difficulty: 1 },
  { id: 'g03', english: 'Please.', chinese: '请。', phonetic: 'plēez', category: 'greetings', difficulty: 1 },
];

describe('LessonView', () => {
  const defaultProps = {
    phrases: mockPhrases,
    completedIds: new Set<string>(),
    onComplete: vi.fn(),
  };

  it('shows the first phrase', () => {
    render(<LessonView {...defaultProps} />);
    expect(screen.getByTestId('phrase-english')).toHaveTextContent('Hi!');
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('navigates to next phrase', async () => {
    const user = userEvent.setup();
    render(<LessonView {...defaultProps} />);

    await user.click(screen.getByText('Next'));
    expect(screen.getByTestId('phrase-english')).toHaveTextContent('Bye bye!');
  });

  it('navigates to previous phrase (wraps)', async () => {
    const user = userEvent.setup();
    render(<LessonView {...defaultProps} />);

    await user.click(screen.getByText('Previous'));
    expect(screen.getByTestId('phrase-english')).toHaveTextContent('Please.');
  });

  it('calls onComplete when Got It is clicked', async () => {
    const onComplete = vi.fn();
    const user = userEvent.setup();
    render(<LessonView {...defaultProps} onComplete={onComplete} />);

    await user.click(screen.getByTestId('got-it-btn'));
    expect(onComplete).toHaveBeenCalledWith('g01');
  });

  it('shows completion state when all phrases are done', () => {
    render(
      <LessonView
        {...defaultProps}
        completedIds={new Set(['g01', 'g02', 'g03'])}
      />
    );
    expect(screen.getByTestId('lesson-complete')).toBeInTheDocument();
  });

  it('shows checkmark for completed phrases', () => {
    render(
      <LessonView
        {...defaultProps}
        completedIds={new Set(['g01'])}
      />
    );
    // First phrase is completed, should show checkmark instead of button
    expect(screen.queryByTestId('got-it-btn')).not.toBeInTheDocument();
  });
});
