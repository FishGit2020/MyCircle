import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FlashCards from './FlashCards';

// Mock @mycircle/shared
vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
  StorageKeys: {
    FLASHCARD_BIBLE_CARDS: 'flashcard-bible-cards',
    FLASHCARD_CUSTOM_CARDS: 'flashcard-custom-cards',
    FLASHCARD_PROGRESS: 'flashcard-progress',
  },
  WindowEvents: {
    FLASHCARD_PROGRESS_CHANGED: 'flashcard-progress-changed',
  },
  useLazyQuery: () => [vi.fn(), { data: null, loading: false }],
  GET_BIBLE_PASSAGE: 'GET_BIBLE_PASSAGE',
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Helper to set up custom cards in localStorage
function seedCustomCard() {
  localStorageMock.setItem(
    'flashcard-custom-cards',
    JSON.stringify([
      { id: 'custom-1', type: 'custom', category: 'test-category', front: 'Test Front', back: 'Test Back' },
    ])
  );
}

// Helper to set up bible cards in localStorage
function seedBibleCard() {
  localStorageMock.setItem(
    'flashcard-bible-cards',
    JSON.stringify([
      { id: 'bible-gen-1-1-fl', type: 'bible-first-letter', category: 'Genesis', front: 'I t b G c t h a t e.', back: 'In the beginning God created the heavens and the earth.', meta: { reference: 'Genesis 1:1' } },
    ])
  );
}

describe('FlashCards', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    delete (window as any).__getFirebaseIdToken;
    delete (window as any).__flashcards;
  });

  it('renders the title and subtitle', () => {
    render(<FlashCards />);
    expect(screen.getByText('flashcards.title')).toBeInTheDocument();
    expect(screen.getByText('flashcards.subtitle')).toBeInTheDocument();
  });

  it('shows card count stats', () => {
    render(<FlashCards />);
    // English cards are bundled, so there should be a count
    expect(screen.getByText(/flashcards\.cardsCount/)).toBeInTheDocument();
  });

  it('shows type filter chips', () => {
    render(<FlashCards />);
    expect(screen.getByText(/flashcards\.allCategories/)).toBeInTheDocument();
  });

  it('shows practice all button', () => {
    render(<FlashCards />);
    expect(screen.getByText('flashcards.practiceAll')).toBeInTheDocument();
  });

  it('hides add custom card button when not authenticated', () => {
    render(<FlashCards />);
    expect(screen.queryByText('flashcards.addCustomCard')).not.toBeInTheDocument();
  });

  it('hides add bible verses button when not authenticated', () => {
    render(<FlashCards />);
    expect(screen.queryByText('flashcards.addBibleVerses')).not.toBeInTheDocument();
  });

  it('shows card thumbnails from bundled English cards', () => {
    render(<FlashCards />);
    expect(screen.getByText('Hi!')).toBeInTheDocument();
    expect(screen.getByText('Thank you!')).toBeInTheDocument();
  });

  it('enters practice mode when a card is clicked', async () => {
    const user = userEvent.setup();
    render(<FlashCards />);

    // Click on a card thumbnail
    await user.click(screen.getByText('Hi!'));
    // Practice mode should show progress
    expect(screen.getByText('flashcards.done')).toBeInTheDocument();
  });

  it('shows category section headers for grouped cards', () => {
    render(<FlashCards />);
    // English cards have categories: greetings, feelings, food
    expect(screen.getByText('greetings')).toBeInTheDocument();
    expect(screen.getByText('feelings')).toBeInTheDocument();
    expect(screen.getByText('food')).toBeInTheDocument();
  });

  it('collapses and expands category sections', async () => {
    const user = userEvent.setup();
    render(<FlashCards />);

    // Find the greetings section header button
    const greetingsHeader = screen.getByText('greetings').closest('button')!;
    expect(greetingsHeader).toHaveAttribute('aria-expanded', 'true');

    // Collapse
    await user.click(greetingsHeader);
    expect(greetingsHeader).toHaveAttribute('aria-expanded', 'false');
    // Hi! should be hidden
    expect(screen.queryByText('Hi!')).not.toBeInTheDocument();

    // Expand again
    await user.click(greetingsHeader);
    expect(greetingsHeader).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Hi!')).toBeInTheDocument();
  });

  describe('when authenticated', () => {
    beforeEach(() => {
      (window as any).__getFirebaseIdToken = vi.fn().mockResolvedValue('mock-token');
    });

    it('shows add buttons when authenticated', async () => {
      render(<FlashCards />);
      // Wait for auth check (runs async)
      await screen.findByText('flashcards.addCustomCard');
      expect(screen.getByText('flashcards.addBibleVerses')).toBeInTheDocument();
    });

    it('shows delete button on custom cards but not on english cards', async () => {
      seedCustomCard();
      render(<FlashCards />);
      await screen.findByText('flashcards.addCustomCard');

      // Custom card should have delete button
      const customCard = screen.getByText('Test Front').closest('button')!;
      expect(within(customCard).getByLabelText('flashcards.delete')).toBeInTheDocument();

      // English card should NOT have delete button
      const englishCard = screen.getByText('Hi!').closest('button')!;
      expect(within(englishCard).queryByLabelText('flashcards.delete')).not.toBeInTheDocument();
    });

    it('shows edit button on custom cards but not on bible cards', async () => {
      seedCustomCard();
      seedBibleCard();
      render(<FlashCards />);
      await screen.findByText('flashcards.addCustomCard');

      // Custom card should have edit button
      const customCard = screen.getByText('Test Front').closest('button')!;
      expect(within(customCard).getByLabelText('flashcards.edit')).toBeInTheDocument();

      // Bible card should NOT have edit button (but may have delete)
      const bibleCard = screen.getByText(/I t b G c/).closest('button')!;
      expect(within(bibleCard).queryByLabelText('flashcards.edit')).not.toBeInTheDocument();
    });

    it('shows delete confirmation modal and deletes card', async () => {
      seedCustomCard();
      const user = userEvent.setup();
      render(<FlashCards />);
      await screen.findByText('flashcards.addCustomCard');

      // Click delete on custom card
      const customCard = screen.getByText('Test Front').closest('button')!;
      const deleteBtn = within(customCard).getByLabelText('flashcards.delete');
      await user.click(deleteBtn);

      // Confirmation modal should appear
      expect(screen.getByText('flashcards.deleteConfirm')).toBeInTheDocument();

      // Confirm delete
      await user.click(screen.getByText('flashcards.delete'));

      // Card should be gone
      expect(screen.queryByText('Test Front')).not.toBeInTheDocument();
    });

    it('opens add card modal when button is clicked', async () => {
      const user = userEvent.setup();
      render(<FlashCards />);
      await screen.findByText('flashcards.addCustomCard');

      await user.click(screen.getByText('flashcards.addCustomCard'));
      // Modal should be visible with Add title
      expect(screen.getByText('flashcards.front')).toBeInTheDocument();
      expect(screen.getByText('flashcards.back')).toBeInTheDocument();
    });

    it('opens edit modal with pre-filled values when edit is clicked', async () => {
      seedCustomCard();
      const user = userEvent.setup();
      render(<FlashCards />);
      await screen.findByText('flashcards.addCustomCard');

      // Click edit on custom card
      const customCard = screen.getByText('Test Front').closest('button')!;
      const editBtn = within(customCard).getByLabelText('flashcards.edit');
      await user.click(editBtn);

      // Edit modal should show with Edit title and pre-filled values
      expect(screen.getByText('flashcards.editCard')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Front')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Back')).toBeInTheDocument();
    });
  });
});
