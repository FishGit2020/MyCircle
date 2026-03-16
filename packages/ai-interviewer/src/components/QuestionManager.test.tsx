import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import QuestionManager from './QuestionManager';
import type { BankQuestion } from '../hooks/useInterviewStateMachine';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockQuestions: BankQuestion[] = [
  {
    id: 'dynamic-arrays-medium-1',
    chapter: 'Dynamic Arrays',
    chapterSlug: 'dynamic-arrays',
    difficulty: 'medium',
    title: 'Two Sum',
    description: 'Find two numbers that add up to target.',
    tags: ['array', 'hash-map'],
  },
  {
    id: 'binary-search-easy-1',
    chapter: 'Binary Search',
    chapterSlug: 'binary-search',
    difficulty: 'easy',
    title: 'Search Insert',
    description: 'Find the insert position.',
    tags: ['binary-search'],
  },
  {
    id: 'dynamic-arrays-hard-1',
    chapter: 'Dynamic Arrays',
    chapterSlug: 'dynamic-arrays',
    difficulty: 'hard',
    title: 'Median of Two Sorted Arrays',
    description: 'Find the median.',
    tags: ['array', 'divide-conquer'],
  },
];

const defaultProps = {
  questions: mockQuestions,
  onBack: vi.fn(),
  onCreateQuestion: vi.fn().mockResolvedValue({ id: 'new-1', chapter: 'Trees', chapterSlug: 'trees', difficulty: 'easy' as const, title: 'Test', description: 'Test desc', tags: [] }),
  onUpdateQuestion: vi.fn().mockResolvedValue({ id: 'dynamic-arrays-medium-1', chapter: 'Dynamic Arrays', chapterSlug: 'dynamic-arrays', difficulty: 'medium' as const, title: 'Updated', description: 'Updated desc', tags: [] }),
  onDeleteQuestion: vi.fn().mockResolvedValue(true),
};

describe('QuestionManager', () => {
  it('renders list of questions grouped by chapter', () => {
    render(<QuestionManager {...defaultProps} />);

    expect(screen.getByText('Two Sum')).toBeInTheDocument();
    expect(screen.getByText('Search Insert')).toBeInTheDocument();
    expect(screen.getByText('Median of Two Sorted Arrays')).toBeInTheDocument();
    // Chapter headers
    expect(screen.getByText('Dynamic Arrays (2)')).toBeInTheDocument();
    expect(screen.getByText('Binary Search (1)')).toBeInTheDocument();
  });

  it('renders back and add buttons', () => {
    render(<QuestionManager {...defaultProps} />);

    expect(screen.getByText('aiInterviewer.backToSetup')).toBeInTheDocument();
    expect(screen.getByText('aiInterviewer.addQuestion')).toBeInTheDocument();
  });

  it('calls onBack when back button clicked', () => {
    const onBack = vi.fn();
    render(<QuestionManager {...defaultProps} onBack={onBack} />);

    fireEvent.click(screen.getByText('aiInterviewer.backToSetup'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('filters by search query', () => {
    render(<QuestionManager {...defaultProps} />);

    const searchInput = screen.getByRole('textbox', { name: /searchQuestions/i });
    fireEvent.change(searchInput, { target: { value: 'Two Sum' } });

    expect(screen.getByText('Two Sum')).toBeInTheDocument();
    expect(screen.queryByText('Search Insert')).not.toBeInTheDocument();
    expect(screen.queryByText('Median of Two Sorted Arrays')).not.toBeInTheDocument();
  });

  it('filters by chapter', () => {
    render(<QuestionManager {...defaultProps} />);

    const chapterSelect = screen.getByRole('combobox', { name: /chapter/i });
    fireEvent.change(chapterSelect, { target: { value: 'Binary Search' } });

    expect(screen.getByText('Search Insert')).toBeInTheDocument();
    expect(screen.queryByText('Two Sum')).not.toBeInTheDocument();
  });

  it('filters by difficulty', () => {
    render(<QuestionManager {...defaultProps} />);

    const difficultySelect = screen.getByRole('combobox', { name: /allDifficulties/i });
    fireEvent.change(difficultySelect, { target: { value: 'hard' } });

    expect(screen.getByText('Median of Two Sorted Arrays')).toBeInTheDocument();
    expect(screen.queryByText('Two Sum')).not.toBeInTheDocument();
    expect(screen.queryByText('Search Insert')).not.toBeInTheDocument();
  });

  it('shows empty state when no questions match filter', () => {
    render(<QuestionManager {...defaultProps} />);

    const searchInput = screen.getByRole('textbox', { name: /searchQuestions/i });
    fireEvent.change(searchInput, { target: { value: 'zzz nonexistent' } });

    expect(screen.getByText('aiInterviewer.noQuestionsFound')).toBeInTheDocument();
  });

  it('opens add form when Add Question clicked', () => {
    render(<QuestionManager {...defaultProps} />);

    fireEvent.click(screen.getByText('aiInterviewer.addQuestion'));

    // Form fields should be visible
    expect(screen.getByRole('textbox', { name: /questionTitle/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /questionDescription/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /questionTags/i })).toBeInTheDocument();
    expect(screen.getByText('aiInterviewer.save')).toBeInTheDocument();
    expect(screen.getByText('aiInterviewer.cancel')).toBeInTheDocument();
  });

  it('opens edit form pre-filled when a question is clicked', () => {
    render(<QuestionManager {...defaultProps} />);

    fireEvent.click(screen.getByText('Two Sum'));

    expect(screen.getByRole('textbox', { name: /questionTitle/i })).toHaveValue('Two Sum');
    expect(screen.getByRole('textbox', { name: /questionDescription/i })).toHaveValue(
      'Find two numbers that add up to target.',
    );
    expect(screen.getByRole('textbox', { name: /questionTags/i })).toHaveValue('array, hash-map');
  });

  it('calls onCreateQuestion when saving a new question', async () => {
    const onCreateQuestion = vi.fn().mockResolvedValue({ id: 'new-1' });
    render(<QuestionManager {...defaultProps} onCreateQuestion={onCreateQuestion} />);

    fireEvent.click(screen.getByText('aiInterviewer.addQuestion'));

    const titleInput = screen.getByRole('textbox', { name: /questionTitle/i });
    const descInput = screen.getByRole('textbox', { name: /questionDescription/i });

    fireEvent.change(titleInput, { target: { value: 'New Question Title' } });
    fireEvent.change(descInput, { target: { value: 'New question description' } });

    fireEvent.click(screen.getByText('aiInterviewer.save'));

    await waitFor(() => {
      expect(onCreateQuestion).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Question Title',
          description: 'New question description',
        }),
      );
    });
  });

  it('calls onUpdateQuestion when saving an existing question', async () => {
    const onUpdateQuestion = vi.fn().mockResolvedValue({ id: 'dynamic-arrays-medium-1' });
    render(<QuestionManager {...defaultProps} onUpdateQuestion={onUpdateQuestion} />);

    fireEvent.click(screen.getByText('Two Sum'));

    const titleInput = screen.getByRole('textbox', { name: /questionTitle/i });
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

    fireEvent.click(screen.getByText('aiInterviewer.save'));

    await waitFor(() => {
      expect(onUpdateQuestion).toHaveBeenCalledWith(
        'dynamic-arrays-medium-1',
        expect.objectContaining({
          title: 'Updated Title',
        }),
      );
    });
  });

  it('shows delete confirmation and calls onDeleteQuestion', async () => {
    const onDeleteQuestion = vi.fn().mockResolvedValue(true);
    render(<QuestionManager {...defaultProps} onDeleteQuestion={onDeleteQuestion} />);

    // Find the delete buttons (initially hidden, visible on hover — but in test they are rendered)
    const deleteButtons = screen.getAllByLabelText('aiInterviewer.deleteQuestion');
    expect(deleteButtons).toHaveLength(3);
    fireEvent.click(deleteButtons[0]);

    // Confirmation row replaces the first delete button; find it by className
    const confirmButton = screen.getAllByText('aiInterviewer.deleteQuestion').find(
      (el) => el.tagName === 'BUTTON' && el.className.includes('red-600'),
    );
    expect(confirmButton).toBeDefined();
    fireEvent.click(confirmButton!);

    await waitFor(() => {
      expect(onDeleteQuestion).toHaveBeenCalledWith('dynamic-arrays-medium-1');
    });
  });

  it('cancels delete confirmation', () => {
    render(<QuestionManager {...defaultProps} />);

    const deleteButtons = screen.getAllByLabelText('aiInterviewer.deleteQuestion');
    fireEvent.click(deleteButtons[0]);

    // Cancel the confirmation
    const cancelButton = screen.getAllByText('aiInterviewer.cancel');
    fireEvent.click(cancelButton[0]);

    // Should be back to normal state (delete button is an aria-label button again)
    expect(screen.getAllByLabelText('aiInterviewer.deleteQuestion')).toHaveLength(3);
  });

  it('returns to list when cancel is clicked in form', () => {
    render(<QuestionManager {...defaultProps} />);

    fireEvent.click(screen.getByText('aiInterviewer.addQuestion'));
    expect(screen.getByRole('textbox', { name: /questionTitle/i })).toBeInTheDocument();

    fireEvent.click(screen.getByText('aiInterviewer.cancel'));

    // Should be back to list view
    expect(screen.getByText('Two Sum')).toBeInTheDocument();
  });
});
