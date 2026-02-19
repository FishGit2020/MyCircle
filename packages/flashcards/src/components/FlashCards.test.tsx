import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

describe('FlashCards', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
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

  it('shows add custom card button', () => {
    render(<FlashCards />);
    expect(screen.getByText('flashcards.addCustomCard')).toBeInTheDocument();
  });

  it('shows add bible verses button', () => {
    render(<FlashCards />);
    expect(screen.getByText('flashcards.addBibleVerses')).toBeInTheDocument();
  });

  it('opens add card modal when button is clicked', async () => {
    const user = userEvent.setup();
    render(<FlashCards />);

    await user.click(screen.getByText('flashcards.addCustomCard'));
    // Modal should be visible
    expect(screen.getByText('flashcards.front')).toBeInTheDocument();
    expect(screen.getByText('flashcards.back')).toBeInTheDocument();
  });

  it('shows card thumbnails from bundled English cards', () => {
    render(<FlashCards />);
    // English phrases are bundled
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
});
