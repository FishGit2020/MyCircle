import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
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
  GET_BIBLE_VOTD_API: { kind: 'Document', definitions: [] },
  GET_BIBLE_PASSAGE: { kind: 'Document', definitions: [] },
  GET_BIBLE_VERSIONS: { kind: 'Document', definitions: [] },
  StorageKeys: {
    BIBLE_BOOKMARKS: 'bible-bookmarks',
    BIBLE_LAST_READ: 'bible-last-read',
    BIBLE_FONT_SIZE: 'bible-font-size',
    BIBLE_DEVOTIONAL_LOG: 'bible-devotional-log',
    BIBLE_TRANSLATION: 'bible-translation',
  },
  getDailyDevotional: () => ({ book: 'Psalms', chapter: 23, theme: 'The Lord is my shepherd' }),
}));

// Mock versions data
const MOCK_VERSIONS = [
  { id: 1, abbreviation: 'KJV', title: 'King James Version' },
  { id: 111, abbreviation: 'NIV', title: 'New International Version' },
  { id: 1588, abbreviation: 'AMP', title: 'Amplified Bible' },
];

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
    useBibleVersions: vi.fn(() => ({
      versions: MOCK_VERSIONS,
      loading: false,
      error: null,
    })),
  };
});

describe('BibleReader', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the Verse of the Day section', () => {
    render(
      <MemoryRouter>
        <MockedProvider mocks={[]} addTypename={false}>
          <BibleReader />
        </MockedProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('bible.verseOfDay')).toBeInTheDocument();
    expect(screen.getByText(/For God so loved the world/)).toBeInTheDocument();
    expect(screen.getByText(/John 3:16/)).toBeInTheDocument();
  });

  it('renders the book selector with Old and New Testament sections', () => {
    render(
      <MemoryRouter>
        <MockedProvider mocks={[]} addTypename={false}>
          <BibleReader />
        </MockedProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('bible.oldTestament')).toBeInTheDocument();
    expect(screen.getByText('bible.newTestament')).toBeInTheDocument();
    expect(screen.getByText('Genesis')).toBeInTheDocument();
    expect(screen.getByText('Revelation')).toBeInTheDocument();
  });

  it('renders search input for filtering books', () => {
    render(
      <MemoryRouter>
        <MockedProvider mocks={[]} addTypename={false}>
          <BibleReader />
        </MockedProvider>
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText('bible.searchBooks')).toBeInTheDocument();
  });

  it('filters books when searching', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <MockedProvider mocks={[]} addTypename={false}>
          <BibleReader />
        </MockedProvider>
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('bible.searchBooks'), 'john');
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('1 John')).toBeInTheDocument();
    expect(screen.queryByText('Genesis')).not.toBeInTheDocument();
  });

  it('shows chapter selector when a book is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <MockedProvider mocks={[]} addTypename={false}>
          <BibleReader />
        </MockedProvider>
      </MemoryRouter>
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
      <MemoryRouter>
        <MockedProvider mocks={[]} addTypename={false}>
          <BibleReader />
        </MockedProvider>
      </MemoryRouter>
    );

    await user.click(screen.getByText('Genesis'));
    expect(screen.getByText('bible.allBooks')).toBeInTheDocument();

    await user.click(screen.getByText('bible.allBooks'));
    expect(screen.getByText('bible.oldTestament')).toBeInTheDocument();
  });

  it('renders scripture attribution footer', () => {
    render(
      <MemoryRouter>
        <MockedProvider mocks={[]} addTypename={false}>
          <BibleReader />
        </MockedProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('bible.attributionYouVersion')).toBeInTheDocument();
  });

  it('renders VOTD loading state', async () => {
    const { useVotd } = await import('../hooks/useBibleData');
    vi.mocked(useVotd).mockReturnValue({
      verse: null,
      loading: true,
      error: null,
    });

    render(
      <MemoryRouter>
        <MockedProvider mocks={[]} addTypename={false}>
          <BibleReader />
        </MockedProvider>
      </MemoryRouter>
    );

    // Should show loading skeleton, not the verse text
    expect(screen.queryByText('bible.verseOfDay')).not.toBeInTheDocument();
  });
});

describe('Daily Devotional', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders the daily devotional card', () => {
    render(
      <MemoryRouter>
        <MockedProvider mocks={[]} addTypename={false}>
          <BibleReader />
        </MockedProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('bible.dailyDevotional')).toBeInTheDocument();
    expect(screen.getByText('bible.devotionalRead')).toBeInTheDocument();
  });

  it('shows completed state after clicking Read Passage', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <MockedProvider mocks={[]} addTypename={false}>
          <BibleReader />
        </MockedProvider>
      </MemoryRouter>
    );

    await user.click(screen.getByText('bible.devotionalRead'));

    expect(screen.getByText('bible.devotionalCompleted')).toBeInTheDocument();
  });

  it('saves completion to localStorage', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <MockedProvider mocks={[]} addTypename={false}>
          <BibleReader />
        </MockedProvider>
      </MemoryRouter>
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
      <MemoryRouter>
        <MockedProvider mocks={[]} addTypename={false}>
          <BibleReader />
        </MockedProvider>
      </MemoryRouter>
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
      <MemoryRouter>
        <MockedProvider mocks={[]} addTypename={false}>
          <BibleReader />
        </MockedProvider>
      </MemoryRouter>
    );

    expect(screen.getByLabelText('bible.versionSelect')).toBeInTheDocument();
  });

  it('defaults to NIV (id=111) when no version is stored', () => {
    render(
      <MemoryRouter>
        <MockedProvider mocks={[]} addTypename={false}>
          <BibleReader />
        </MockedProvider>
      </MemoryRouter>
    );

    const select = screen.getByLabelText('bible.versionSelect') as HTMLSelectElement;
    expect(select.value).toBe('111');
  });

  it('restores saved version from localStorage', () => {
    localStorage.setItem('bible-translation', '111');

    render(
      <MemoryRouter>
        <MockedProvider mocks={[]} addTypename={false}>
          <BibleReader />
        </MockedProvider>
      </MemoryRouter>
    );

    const select = screen.getByLabelText('bible.versionSelect') as HTMLSelectElement;
    expect(select.value).toBe('111');
  });

  it('persists version selection to localStorage', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <MockedProvider mocks={[]} addTypename={false}>
          <BibleReader />
        </MockedProvider>
      </MemoryRouter>
    );

    await user.selectOptions(screen.getByLabelText('bible.versionSelect'), '111');
    expect(localStorage.getItem('bible-translation')).toBe('111');
  });

  it('shows dynamic version options from YouVersion API', () => {
    render(
      <MemoryRouter>
        <MockedProvider mocks={[]} addTypename={false}>
          <BibleReader />
        </MockedProvider>
      </MemoryRouter>
    );

    const select = screen.getByLabelText('bible.versionSelect') as HTMLSelectElement;
    expect(select.options.length).toBe(3);
    expect(select.options[0].value).toBe('1');
    expect(select.options[1].value).toBe('111');
    expect(select.options[2].value).toBe('1588');
  });

  it('shows loading state while versions are loading', async () => {
    const mod = await import('../hooks/useBibleData');
    vi.mocked(mod.useBibleVersions).mockReturnValue({
      versions: [],
      loading: true,
      error: null,
    });

    render(
      <MemoryRouter>
        <MockedProvider mocks={[]} addTypename={false}>
          <BibleReader />
        </MockedProvider>
      </MemoryRouter>
    );

    const select = screen.getByLabelText('bible.versionSelect') as HTMLSelectElement;
    expect(select.disabled).toBe(true);
  });

  it('shows fallback KJV option when API fails', async () => {
    const mod = await import('../hooks/useBibleData');
    vi.mocked(mod.useBibleVersions).mockReturnValue({
      versions: [],
      loading: false,
      error: new Error('API error'),
    });

    render(
      <MemoryRouter>
        <MockedProvider mocks={[]} addTypename={false}>
          <BibleReader />
        </MockedProvider>
      </MemoryRouter>
    );

    const select = screen.getByLabelText('bible.versionSelect') as HTMLSelectElement;
    expect(select.options.length).toBeGreaterThanOrEqual(1);
  });

  it('reloads passage with new version when changed during passage view', async () => {
    const mockLoadPassage = vi.fn();
    const mod = await import('../hooks/useBibleData');
    vi.mocked(mod.useBiblePassage).mockReturnValue({
      passage: {
        text: 'In the beginning God created the heavens and the earth.',
        reference: 'Genesis 1',
        translation: 'KJV',
        verseCount: 31,
        copyright: null,
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
    vi.mocked(mod.useBibleVersions).mockReturnValue({
      versions: MOCK_VERSIONS,
      loading: false,
      error: null,
    });

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <MockedProvider mocks={[]} addTypename={false}>
          <BibleReader />
        </MockedProvider>
      </MemoryRouter>
    );

    // Navigate to Genesis chapter 1
    await user.click(screen.getByText('Genesis'));
    await user.click(screen.getByText('1'));

    // Clear mock calls from navigation
    mockLoadPassage.mockClear();

    // Change version to NIV (id=111)
    await user.selectOptions(screen.getByLabelText('bible.versionSelect'), '111');

    // Should reload passage with new translation
    expect(mockLoadPassage).toHaveBeenCalledWith('Genesis', 1, '111');
  });

  it('displays copyright notice when passage has copyright', async () => {
    const mod = await import('../hooks/useBibleData');
    vi.mocked(mod.useBiblePassage).mockReturnValue({
      passage: {
        text: 'In the beginning God created the heavens and the earth.',
        reference: 'Genesis 1',
        translation: 'NIV',
        verseCount: 31,
        copyright: 'Copyright 2011 by Biblica, Inc.',
      },
      loading: false,
      error: null,
      selectedBook: 'Genesis',
      selectedChapter: 1,
      loadPassage: vi.fn(),
    });
    vi.mocked(mod.useVotd).mockReturnValue({
      verse: { text: 'Test', reference: 'Test 1:1', translation: 'NIV', copyright: null },
      loading: false,
      error: null,
    });
    vi.mocked(mod.useBibleVersions).mockReturnValue({
      versions: MOCK_VERSIONS,
      loading: false,
      error: null,
    });

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <MockedProvider mocks={[]} addTypename={false}>
          <BibleReader />
        </MockedProvider>
      </MemoryRouter>
    );

    await user.click(screen.getByText('Genesis'));
    await user.click(screen.getByText('1'));

    expect(screen.getByText('Copyright 2011 by Biblica, Inc.')).toBeInTheDocument();
  });

  it('has accessible label for version selector', () => {
    render(
      <MemoryRouter>
        <MockedProvider mocks={[]} addTypename={false}>
          <BibleReader />
        </MockedProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('bible.version')).toBeInTheDocument();
    expect(screen.getByLabelText('bible.versionSelect')).toBeInTheDocument();
  });
});
