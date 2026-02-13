import { describe, it, expect, vi, beforeEach } from 'vitest';
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
    BIBLE_NOTES: 'bible-notes',
    BIBLE_DEVOTIONAL_LOG: 'bible-devotional-log',
    BIBLE_TRANSLATION: 'bible-translation',
  },
  getDailyDevotional: () => ({ book: 'Psalms', chapter: 23, theme: 'The Lord is my shepherd' }),
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
  beforeEach(() => {
    localStorage.clear();
  });

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

describe('Community Notes', () => {
  beforeEach(async () => {
    localStorage.clear();
    vi.clearAllMocks();

    // Reset useBiblePassage to return a loaded passage
    const mod = await import('../hooks/useBibleData');
    vi.mocked(mod.useBiblePassage).mockReturnValue({
      passage: {
        text: 'In the beginning God created the heavens and the earth.',
        reference: 'Genesis 1',
        translation: 'WEB',
        verseCount: 31,
      },
      loading: false,
      error: null,
      selectedBook: 'Genesis',
      selectedChapter: 1,
      loadPassage: vi.fn(),
    });
    vi.mocked(mod.useVotd).mockReturnValue({
      verse: { text: 'Test verse', reference: 'Test 1:1', translation: 'NIV', copyright: null },
      loading: false,
      error: null,
    });
  });

  const navigateToPassage = async (user: ReturnType<typeof userEvent.setup>) => {
    // Click Genesis -> Chapter 1 (Genesis has 50 chapters, so it shows ChapterSelector first)
    await user.click(screen.getByText('Genesis'));
    await user.click(screen.getByText('1'));
  };

  it('shows notes toggle button on passage view', async () => {
    const user = userEvent.setup();
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <BibleReader />
      </MockedProvider>
    );

    await navigateToPassage(user);

    expect(screen.getByText('bible.notes')).toBeInTheDocument();
  });

  it('expands notes section when toggle is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <BibleReader />
      </MockedProvider>
    );

    await navigateToPassage(user);
    await user.click(screen.getByText('bible.notes'));

    expect(screen.getByPlaceholderText('bible.notesPlaceholder')).toBeInTheDocument();
  });

  it('saves note to localStorage with debounce', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <BibleReader />
      </MockedProvider>
    );

    await navigateToPassage(user);
    await user.click(screen.getByText('bible.notes'));

    const textarea = screen.getByPlaceholderText('bible.notesPlaceholder');
    await user.type(textarea, 'My personal note');

    // Advance past debounce
    vi.advanceTimersByTime(1000);

    const stored = JSON.parse(localStorage.getItem('bible-notes') || '{}');
    expect(stored['Genesis:1']).toBeDefined();
    expect(stored['Genesis:1'].text).toBe('My personal note');

    vi.useRealTimers();
  });

  it('loads existing note when navigating to passage', async () => {
    // Pre-populate a note
    localStorage.setItem('bible-notes', JSON.stringify({
      'Genesis:1': { text: 'Previously saved note', updatedAt: Date.now() },
    }));

    const user = userEvent.setup();
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <BibleReader />
      </MockedProvider>
    );

    await navigateToPassage(user);
    await user.click(screen.getByText('bible.notes'));

    const textarea = screen.getByPlaceholderText('bible.notesPlaceholder') as HTMLTextAreaElement;
    expect(textarea.value).toBe('Previously saved note');
  });

  it('has accessible notes textarea with aria-label', async () => {
    const user = userEvent.setup();
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <BibleReader />
      </MockedProvider>
    );

    await navigateToPassage(user);
    await user.click(screen.getByText('bible.notes'));

    expect(screen.getByLabelText('bible.notes')).toBeInTheDocument();
  });
});

describe('Daily Devotional', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders the daily devotional card', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <BibleReader />
      </MockedProvider>
    );

    expect(screen.getByText('bible.dailyDevotional')).toBeInTheDocument();
    expect(screen.getByText('bible.devotionalRead')).toBeInTheDocument();
  });

  it('shows completed state after clicking Read Passage', async () => {
    const user = userEvent.setup();
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <BibleReader />
      </MockedProvider>
    );

    await user.click(screen.getByText('bible.devotionalRead'));

    expect(screen.getByText('bible.devotionalCompleted')).toBeInTheDocument();
  });

  it('saves completion to localStorage', async () => {
    const user = userEvent.setup();
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <BibleReader />
      </MockedProvider>
    );

    await user.click(screen.getByText('bible.devotionalRead'));

    const log = JSON.parse(localStorage.getItem('bible-devotional-log') || '[]');
    const d = new Date();
    const todayKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    expect(log).toContain(todayKey);
  });

  it('shows completed state when already completed today', () => {
    const d = new Date();
    const todayKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    localStorage.setItem('bible-devotional-log', JSON.stringify([todayKey]));

    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <BibleReader />
      </MockedProvider>
    );

    expect(screen.getByText('bible.devotionalCompleted')).toBeInTheDocument();
  });
});

describe('Bible Version Selector', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders the version selector dropdown', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <BibleReader />
      </MockedProvider>
    );

    expect(screen.getByLabelText('bible.versionSelect')).toBeInTheDocument();
  });

  it('defaults to WEB when no version is stored', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <BibleReader />
      </MockedProvider>
    );

    const select = screen.getByLabelText('bible.versionSelect') as HTMLSelectElement;
    expect(select.value).toBe('web');
  });

  it('restores saved version from localStorage', () => {
    localStorage.setItem('bible-translation', 'kjv');

    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <BibleReader />
      </MockedProvider>
    );

    const select = screen.getByLabelText('bible.versionSelect') as HTMLSelectElement;
    expect(select.value).toBe('kjv');
  });

  it('persists version selection to localStorage', async () => {
    const user = userEvent.setup();
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <BibleReader />
      </MockedProvider>
    );

    await user.selectOptions(screen.getByLabelText('bible.versionSelect'), 'kjv');
    expect(localStorage.getItem('bible-translation')).toBe('kjv');
  });

  it('shows all version options', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <BibleReader />
      </MockedProvider>
    );

    const select = screen.getByLabelText('bible.versionSelect') as HTMLSelectElement;
    expect(select.options.length).toBe(6);
    // Check a few
    expect(select.options[0].value).toBe('web');
    expect(select.options[1].value).toBe('kjv');
  });

  it('reloads passage with new version when changed during passage view', async () => {
    const mockLoadPassage = vi.fn();
    const mod = await import('../hooks/useBibleData');
    vi.mocked(mod.useBiblePassage).mockReturnValue({
      passage: {
        text: 'In the beginning God created the heavens and the earth.',
        reference: 'Genesis 1',
        translation: 'WEB',
        verseCount: 31,
      },
      loading: false,
      error: null,
      selectedBook: 'Genesis',
      selectedChapter: 1,
      loadPassage: mockLoadPassage,
    });
    vi.mocked(mod.useVotd).mockReturnValue({
      verse: { text: 'Test', reference: 'Test 1:1', translation: 'NIV', copyright: null },
      loading: false,
      error: null,
    });

    const user = userEvent.setup();
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <BibleReader />
      </MockedProvider>
    );

    // Navigate to Genesis chapter 1
    await user.click(screen.getByText('Genesis'));
    await user.click(screen.getByText('1'));

    // Clear mock calls from navigation
    mockLoadPassage.mockClear();

    // Change version to KJV
    await user.selectOptions(screen.getByLabelText('bible.versionSelect'), 'kjv');

    // Should reload passage with new translation
    expect(mockLoadPassage).toHaveBeenCalledWith('Genesis', 1, 'kjv');
  });

  it('has accessible label for version selector', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <BibleReader />
      </MockedProvider>
    );

    expect(screen.getByText('bible.version')).toBeInTheDocument();
    expect(screen.getByLabelText('bible.versionSelect')).toBeInTheDocument();
  });
});
