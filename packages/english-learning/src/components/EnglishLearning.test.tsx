import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EnglishLearning from './EnglishLearning';

describe('EnglishLearning', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the title and lesson view by default', () => {
    render(<EnglishLearning />);
    expect(screen.getByText('Learn English')).toBeInTheDocument();
    expect(screen.getByText('Lessons')).toBeInTheDocument();
  });

  it('shows progress as 0/N initially', () => {
    render(<EnglishLearning />);
    expect(screen.getByText(/Progress: 0 \//)).toBeInTheDocument();
  });

  it('shows the first phrase in lesson view', () => {
    render(<EnglishLearning />);
    expect(screen.getByTestId('phrase-english')).toBeInTheDocument();
  });

  it('marks a phrase as completed', async () => {
    const user = userEvent.setup();
    render(<EnglishLearning />);

    await user.click(screen.getByTestId('got-it-btn'));
    expect(screen.getByText(/Progress: 1 \//)).toBeInTheDocument();
  });

  it('persists progress to localStorage', async () => {
    const user = userEvent.setup();
    render(<EnglishLearning />);

    await user.click(screen.getByTestId('got-it-btn'));

    const stored = JSON.parse(localStorage.getItem('english-learning-progress')!);
    expect(stored.completedIds).toHaveLength(1);
  });

  it('restores progress from localStorage', () => {
    localStorage.setItem('english-learning-progress', JSON.stringify({
      completedIds: ['g01', 'g02', 'g03'],
      quizScores: [],
      lastDate: '2026-01-01',
    }));

    render(<EnglishLearning />);
    expect(screen.getByText(/Progress: 3 \//)).toBeInTheDocument();
  });

  it('switches to quiz view', async () => {
    const user = userEvent.setup();
    render(<EnglishLearning />);

    await user.click(screen.getByText('Quiz'));
    expect(screen.getByTestId('quiz-question')).toBeInTheDocument();
  });

  it('switches to dashboard view', async () => {
    const user = userEvent.setup();
    render(<EnglishLearning />);

    await user.click(screen.getByText('Progress'));
    expect(screen.getByTestId('total-completed')).toBeInTheDocument();
    expect(screen.getByTestId('streak-count')).toBeInTheDocument();
  });

  it('resets progress when reset is clicked', async () => {
    localStorage.setItem('english-learning-progress', JSON.stringify({
      completedIds: ['g01'],
      quizScores: [],
      lastDate: '2026-01-01',
    }));

    const user = userEvent.setup();
    render(<EnglishLearning />);
    expect(screen.getByText(/Progress: 1 \//)).toBeInTheDocument();

    await user.click(screen.getByText('Reset Progress'));
    expect(screen.getByText(/Progress: 0 \//)).toBeInTheDocument();
  });

  it('filters phrases by category', async () => {
    const user = userEvent.setup();
    render(<EnglishLearning />);

    await user.click(screen.getByText('Emergencies'));
    expect(screen.getByTestId('phrase-english')).toHaveTextContent('Help!');
  });
});
