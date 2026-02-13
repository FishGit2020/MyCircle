import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing/react';
import BibleReader from './BibleReader';

// Mock @mycircle/shared
vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
  useQuery: vi.fn(),
  useLazyQuery: vi.fn(),
  GET_BIBLE_VOTD: { kind: 'Document', definitions: [] },
  GET_BIBLE_PASSAGE: { kind: 'Document', definitions: [] },
  StorageKeys: {
    BIBLE_BOOKMARKS: 'bible-bookmarks',
    BIBLE_LAST_READ: 'bible-last-read',
    BIBLE_FONT_SIZE: 'bible-font-size',
  },
}));

// Mock the hooks since they depend on Apollo
vi.mock('../hooks/useBibleData', async () => {
  const actual = await vi.importActual('../hooks/useBibleData');
  return {
    ...actual,
    useVotd: vi.fn(() => ({
      verse: {
        text: 'For God so loved the world that he gave his one and only Son.',
        reference: 'John 3:16',
        translation: 'NIV',
        copyright: null,
      },
      loading: false,
      error: null,
    })),
    useBiblePassage: vi.fn(() => ({
      passage: null,
      loading: false,
      error: null,
      selectedBook: '',
      selectedChapter: 0,
      loadPassage: vi.fn(),
    })),
  };
});

describe('BibleReader', () => {
  it('renders the Verse of the Day section', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <BibleReader />
      </MockedProvider>
    );

    expect(screen.getByText('bible.verseOfDay')).toBeInTheDocument();
    expect(screen.getByText(/For God so loved the world/)).toBeInTheDocument();
    expect(screen.getByText(/John 3:16/)).toBeInTheDocument();
  });

  it('renders the book selector with Old and New Testament sections', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <BibleReader />
      </MockedProvider>
    );

    expect(screen.getByText('bible.oldTestament')).toBeInTheDocument();
    expect(screen.getByText('bible.newTestament')).toBeInTheDocument();
    expect(screen.getByText('Genesis')).toBeInTheDocument();
    expect(screen.getByText('Revelation')).toBeInTheDocument();
  });

  it('renders search input for filtering books', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <BibleReader />
      </MockedProvider>
    );

    expect(screen.getByPlaceholderText('bible.searchBooks')).toBeInTheDocument();
  });

  it('filters books when searching', async () => {
    const user = userEvent.setup();
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <BibleReader />
      </MockedProvider>
    );

    await user.type(screen.getByPlaceholderText('bible.searchBooks'), 'john');
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('1 John')).toBeInTheDocument();
    expect(screen.queryByText('Genesis')).not.toBeInTheDocument();
  });

  it('shows chapter selector when a book is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <BibleReader />
      </MockedProvider>
    );

    await user.click(screen.getByText('Genesis'));

    expect(screen.getByText('Genesis')).toBeInTheDocument();
    // Genesis has 50 chapters
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('bible.allBooks')).toBeInTheDocument();
  });

  it('has back navigation from chapter selector', async () => {
    const user = userEvent.setup();
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <BibleReader />
      </MockedProvider>
    );

    await user.click(screen.getByText('Genesis'));
    expect(screen.getByText('bible.allBooks')).toBeInTheDocument();

    await user.click(screen.getByText('bible.allBooks'));
    expect(screen.getByText('bible.oldTestament')).toBeInTheDocument();
  });

  it('renders scripture attribution footer', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <BibleReader />
      </MockedProvider>
    );

    expect(screen.getByText('bible.attribution')).toBeInTheDocument();
  });

  it('renders VOTD loading state', async () => {
    const { useVotd } = await import('../hooks/useBibleData');
    vi.mocked(useVotd).mockReturnValue({
      verse: null,
      loading: true,
      error: null,
    });

    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <BibleReader />
      </MockedProvider>
    );

    // Should show loading skeleton, not the verse text
    expect(screen.queryByText('bible.verseOfDay')).not.toBeInTheDocument();
  });
});
