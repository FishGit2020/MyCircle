import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BibleVersePicker from './BibleVersePicker';

const mockFetchPassage = vi.fn();
vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  useLazyQuery: () => [mockFetchPassage, { data: null, loading: false }],
  GET_BIBLE_PASSAGE: 'GET_BIBLE_PASSAGE',
}));

vi.mock('./VersePicker', () => ({
  default: ({ onAddCards, onBack }: any) => (
    <div data-testid="verse-picker">
      <button onClick={onBack}>back</button>
      <button onClick={() => onAddCards([{ front: 'F', back: 'B', reference: 'Gen 1:1', verseRange: '1', type: 'bible-full' }])}>add</button>
    </div>
  ),
}));

describe('BibleVersePicker', () => {
  const onAddCards = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it('renders book selection step', () => {
    render(<BibleVersePicker onAddCards={onAddCards} onClose={onClose} />);
    expect(screen.getByText('flashcards.addBibleVerses')).toBeInTheDocument();
    expect(screen.getByText('flashcards.selectBook')).toBeInTheDocument();
    expect(screen.getByText('Genesis')).toBeInTheDocument();
    expect(screen.getByText('Revelation')).toBeInTheDocument();
  });

  it('navigates to chapter selection after book click', async () => {
    render(<BibleVersePicker onAddCards={onAddCards} onClose={onClose} />);
    fireEvent.click(screen.getByText('Genesis'));
    await waitFor(() => {
      expect(screen.getByText(/flashcards.selectChapter/)).toBeInTheDocument();
    });
  });

  it('navigates back to book selection', () => {
    render(<BibleVersePicker onAddCards={onAddCards} onClose={onClose} />);
    fireEvent.click(screen.getByText('Genesis'));
    fireEvent.click(screen.getByText(/flashcards.selectBook/));
    expect(screen.getByText('Revelation')).toBeInTheDocument();
  });

  it('fetches passage and shows verse step on chapter click', () => {
    render(<BibleVersePicker onAddCards={onAddCards} onClose={onClose} />);
    fireEvent.click(screen.getByText('Genesis'));
    fireEvent.click(screen.getByText('1'));
    expect(mockFetchPassage).toHaveBeenCalledWith({ variables: { reference: 'Genesis 1' } });
  });

  it('calls onClose when close button clicked', () => {
    render(<BibleVersePicker onAddCards={onAddCards} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });
});
