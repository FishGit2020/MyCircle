import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VersePicker from './VersePicker';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const verses = [
  { number: 1, text: 'In the beginning God created the heavens and the earth.' },
  { number: 2, text: 'Now the earth was formless and empty.' },
  { number: 3, text: 'And God said, Let there be light.' },
];

describe('VersePicker', () => {
  const onAddCards = vi.fn();
  const onBack = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it('renders verses as checkboxes', () => {
    render(<VersePicker passageText="" verses={verses} reference="Genesis 1" book="Genesis" chapter={1} onAddCards={onAddCards} onBack={onBack} />);
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    expect(screen.getByText(/In the beginning/)).toBeInTheDocument();
  });

  it('shows add button disabled when none selected', () => {
    render(<VersePicker passageText="" verses={verses} reference="Genesis 1" book="Genesis" chapter={1} onAddCards={onAddCards} onBack={onBack} />);
    expect(screen.getByText(/flashcards.addAsCards/)).toBeDisabled();
  });

  it('enables add button when verse selected', () => {
    render(<VersePicker passageText="" verses={verses} reference="Genesis 1" book="Genesis" chapter={1} onAddCards={onAddCards} onBack={onBack} />);
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    expect(screen.getByText(/flashcards.addAsCards/)).not.toBeDisabled();
  });

  it('creates both card types by default', () => {
    render(<VersePicker passageText="" verses={verses} reference="Genesis 1" book="Genesis" chapter={1} onAddCards={onAddCards} onBack={onBack} />);
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    fireEvent.click(screen.getByText(/flashcards.addAsCards/));
    expect(onAddCards).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ type: 'bible-first-letter' }),
        expect.objectContaining({ type: 'bible-full' }),
      ])
    );
  });

  it('creates only first-letter cards when selected', () => {
    render(<VersePicker passageText="" verses={verses} reference="Genesis 1" book="Genesis" chapter={1} onAddCards={onAddCards} onBack={onBack} />);
    fireEvent.click(screen.getByText('flashcards.firstLetterCard'));
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    fireEvent.click(screen.getByText(/flashcards.addAsCards/));
    const cards = onAddCards.mock.calls[0][0];
    expect(cards).toHaveLength(1);
    expect(cards[0].type).toBe('bible-first-letter');
  });

  it('selects all verses', () => {
    render(<VersePicker passageText="" verses={verses} reference="Genesis 1" book="Genesis" chapter={1} onAddCards={onAddCards} onBack={onBack} />);
    fireEvent.click(screen.getByText('flashcards.selectAll'));
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach(cb => expect(cb).toBeChecked());
  });

  it('calls onBack when back button clicked', () => {
    render(<VersePicker passageText="" verses={verses} reference="Genesis 1" book="Genesis" chapter={1} onAddCards={onAddCards} onBack={onBack} />);
    fireEvent.click(screen.getByText(/flashcards.selectChapter/));
    expect(onBack).toHaveBeenCalled();
  });

  it('toggles verse selection', () => {
    render(<VersePicker passageText="" verses={verses} reference="Genesis 1" book="Genesis" chapter={1} onAddCards={onAddCards} onBack={onBack} />);
    const cb = screen.getAllByRole('checkbox')[0];
    fireEvent.click(cb);
    expect(cb).toBeChecked();
    fireEvent.click(cb);
    expect(cb).not.toBeChecked();
  });

  it('falls back to splitting plain text when no verses provided', () => {
    render(<VersePicker passageText={'Line one\nLine two\nLine three'} reference="Genesis 1" book="Genesis" chapter={1} onAddCards={onAddCards} onBack={onBack} />);
    expect(screen.getAllByRole('checkbox').length).toBeGreaterThanOrEqual(1);
  });

  it('shows card count in add button', () => {
    render(<VersePicker passageText="" verses={verses} reference="Genesis 1" book="Genesis" chapter={1} onAddCards={onAddCards} onBack={onBack} />);
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    fireEvent.click(screen.getAllByRole('checkbox')[1]);
    // Default "both" mode: 2 selected × 2 types = 4
    expect(screen.getByText(/\(4\)/)).toBeInTheDocument();
  });
});
