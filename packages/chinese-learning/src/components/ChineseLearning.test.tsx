import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChineseLearning from './ChineseLearning';

describe('ChineseLearning', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the title and grid view by default', () => {
    render(<ChineseLearning />);
    expect(screen.getByText('Learn Chinese')).toBeInTheDocument();
    expect(screen.getByText('All Characters')).toBeInTheDocument();
    // Should show category headers
    expect(screen.getByText('Family')).toBeInTheDocument();
    expect(screen.getByText('Numbers')).toBeInTheDocument();
  });

  it('shows mastered count as 0/N initially', () => {
    render(<ChineseLearning />);
    expect(screen.getByText(/Mastered: 0 \//)).toBeInTheDocument();
  });

  it('switches to flashcard view', async () => {
    const user = userEvent.setup();
    render(<ChineseLearning />);

    await user.click(screen.getByText('Flashcards'));
    expect(screen.getByTestId('flashcard')).toBeInTheDocument();
  });

  it('clicking a character in grid switches to flashcard view', async () => {
    const user = userEvent.setup();
    render(<ChineseLearning />);

    // Click on the first character (妈妈)
    await user.click(screen.getAllByText('妈妈')[0]);
    expect(screen.getByTestId('flashcard')).toBeInTheDocument();
  });

  it('can mark a character as mastered from flashcard view', async () => {
    const user = userEvent.setup();
    render(<ChineseLearning />);

    await user.click(screen.getByText('Flashcards'));
    await user.click(screen.getByTestId('toggle-mastered'));
    expect(screen.getByText(/Mastered: 1 \//)).toBeInTheDocument();
  });

  it('persists progress to localStorage', async () => {
    const user = userEvent.setup();
    render(<ChineseLearning />);

    await user.click(screen.getByText('Flashcards'));
    await user.click(screen.getByTestId('toggle-mastered'));

    const stored = JSON.parse(localStorage.getItem('chinese-learning-progress')!);
    expect(stored.masteredIds).toHaveLength(1);
  });

  it('restores progress from localStorage', () => {
    localStorage.setItem('chinese-learning-progress', JSON.stringify({
      masteredIds: ['f01', 'f02'],
      lastDate: '2026-01-01',
    }));

    render(<ChineseLearning />);
    expect(screen.getByText(/Mastered: 2 \//)).toBeInTheDocument();
  });

  it('resets progress when reset is clicked', async () => {
    localStorage.setItem('chinese-learning-progress', JSON.stringify({
      masteredIds: ['f01'],
      lastDate: '2026-01-01',
    }));

    const user = userEvent.setup();
    render(<ChineseLearning />);
    expect(screen.getByText(/Mastered: 1 \//)).toBeInTheDocument();

    await user.click(screen.getByText('Reset Progress'));
    expect(screen.getByText(/Mastered: 0 \//)).toBeInTheDocument();
  });

  it('filters characters by category in flashcard view', async () => {
    const user = userEvent.setup();
    render(<ChineseLearning />);

    await user.click(screen.getByText('Flashcards'));
    // Click "Numbers" category filter
    await user.click(screen.getByText('Numbers'));
    // Should show 一 as first character
    expect(screen.getByTestId('flashcard-character')).toHaveTextContent('一');
  });
});
