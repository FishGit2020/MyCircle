import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SongList from './SongList';
import type { WorshipSongListItem } from '../types';

vi.mock('@mycircle/shared', () => {
  const t = (key: string) => key;
  return {
    useTranslation: () => ({ t, i18n: { language: 'en', changeLanguage: vi.fn() } }),
    StorageKeys: {
      WORSHIP_FAVORITES: 'worship-favorites',
    },
    WindowEvents: {
      WORSHIP_FAVORITES_CHANGED: 'worship-favorites-changed',
    },
  };
});

const makeSong = (overrides: Partial<WorshipSongListItem> = {}): WorshipSongListItem => ({
  id: '1',
  title: 'Amazing Grace',
  artist: 'John Newton',
  originalKey: 'G',
  format: 'chordpro',
  tags: ['hymn'],
  updatedAt: new Date(1700000000000).toISOString(),
  ...overrides,
});

const songs: WorshipSongListItem[] = [
  makeSong({ id: '1', title: 'Amazing Grace', artist: 'John Newton', tags: ['hymn'] }),
  makeSong({ id: '2', title: 'How Great Thou Art', artist: 'Carl Boberg', format: 'text', tags: ['classic'] }),
  makeSong({ id: '3', title: '10000 Reasons', artist: 'Matt Redman', tags: ['worship'] }),
];

const defaultProps = {
  songs,
  totalCount: 3,
  totalPages: 1,
  page: 1,
  allArtists: ['Carl Boberg', 'John Newton', 'Matt Redman'],
  allTags: ['classic', 'hymn', 'worship'],
  loading: false,
  isAuthenticated: true,
  search: '',
  filterArtist: '',
  filterTag: '',
  filterFormat: 'all' as const,
  showFavoritesOnly: false,
  onSearchChange: vi.fn(),
  onFilterArtistChange: vi.fn(),
  onFilterTagChange: vi.fn(),
  onFilterFormatChange: vi.fn(),
  onFavoritesToggle: vi.fn(),
  onSelectSong: vi.fn(),
  onNewSong: vi.fn(),
  onPageChange: vi.fn(),
  onResetFilters: vi.fn(),
};

describe('SongList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders song titles when given songs', () => {
    render(<SongList {...defaultProps} />);
    expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
    expect(screen.getByText('How Great Thou Art')).toBeInTheDocument();
    expect(screen.getByText('10000 Reasons')).toBeInTheDocument();
  });

  it('renders song artists', () => {
    render(<SongList {...defaultProps} />);
    // Artists appear in both song cards and the artist filter dropdown
    expect(screen.getAllByText('John Newton').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Carl Boberg').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Matt Redman').length).toBeGreaterThanOrEqual(1);
  });

  it('shows loading skeletons when loading', () => {
    const { container } = render(<SongList {...defaultProps} songs={[]} loading={true} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(3);
  });

  it('shows empty state when no songs', () => {
    render(<SongList {...defaultProps} songs={[]} totalCount={0} />);
    expect(screen.getByText('worship.noSongs')).toBeInTheDocument();
  });

  it('shows no-results state when server returns empty songs for search', () => {
    render(<SongList {...defaultProps} songs={[]} search="zzzznonexistent" />);
    expect(screen.getByText('worship.noResults')).toBeInTheDocument();
  });

  it('calls onSearchChange when typing in search input', async () => {
    const user = userEvent.setup({ delay: null });
    const onSearchChange = vi.fn();
    render(<SongList {...defaultProps} onSearchChange={onSearchChange} />);
    const input = screen.getByPlaceholderText('worship.searchPlaceholder');
    await user.type(input, 'A');
    expect(onSearchChange).toHaveBeenCalled();
  });

  it('displays search value from prop in input', () => {
    render(<SongList {...defaultProps} search="Amazing" />);
    const input = screen.getByPlaceholderText('worship.searchPlaceholder') as HTMLInputElement;
    expect(input.value).toBe('Amazing');
  });

  it('calls onSelectSong when a song is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    const onSelectSong = vi.fn();
    render(<SongList {...defaultProps} onSelectSong={onSelectSong} />);
    await user.click(screen.getByText('Amazing Grace'));
    expect(onSelectSong).toHaveBeenCalledWith('1');
  });

  it('shows add song button when authenticated', () => {
    render(<SongList {...defaultProps} isAuthenticated={true} />);
    expect(screen.getByText('worship.addSong')).toBeInTheDocument();
  });

  it('does not show add song button when not authenticated', () => {
    render(<SongList {...defaultProps} isAuthenticated={false} />);
    expect(screen.queryByText('worship.addSong')).not.toBeInTheDocument();
  });

  it('calls onNewSong when add song button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    const onNewSong = vi.fn();
    render(<SongList {...defaultProps} onNewSong={onNewSong} />);
    await user.click(screen.getByText('worship.addSong'));
    expect(onNewSong).toHaveBeenCalled();
  });

  it('shows login-to-edit message when not authenticated', () => {
    render(<SongList {...defaultProps} isAuthenticated={false} />);
    expect(screen.getByText('worship.loginToEdit')).toBeInTheDocument();
  });

  it('does not show login-to-edit message when authenticated', () => {
    render(<SongList {...defaultProps} isAuthenticated={true} />);
    expect(screen.queryByText('worship.loginToEdit')).not.toBeInTheDocument();
  });

  it('renders song tags', () => {
    render(<SongList {...defaultProps} />);
    // Tags appear in both song cards and the tag filter dropdown
    expect(screen.getAllByText('hymn').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('classic').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('worship').length).toBeGreaterThanOrEqual(1);
  });

  it('renders original key badges', () => {
    render(<SongList {...defaultProps} />);
    const keyBadges = screen.getAllByText('G');
    expect(keyBadges.length).toBe(3);
  });

  it('renders format badges', () => {
    render(<SongList {...defaultProps} />);
    // 2 chordpro songs + 1 toolbar filter button = 3 chordpro texts
    // 1 text song + 1 toolbar filter button = 2 text texts
    const chordproBadges = screen.getAllByText('worship.formatChordpro');
    const textBadges = screen.getAllByText('worship.formatText');
    expect(chordproBadges.length).toBe(3);
    expect(textBadges.length).toBe(2);
  });

  it('renders the title heading', () => {
    render(<SongList {...defaultProps} />);
    expect(screen.getByText('worship.title')).toBeInTheDocument();
  });

  it('shows pagination when multiple pages', () => {
    render(<SongList {...defaultProps} totalPages={5} page={3} totalCount={120} />);
    expect(screen.getByLabelText('worship.prevPage')).toBeInTheDocument();
    expect(screen.getByLabelText('worship.nextPage')).toBeInTheDocument();
    expect(screen.getByText('3')).toHaveAttribute('aria-current', 'page');
  });

  it('disables previous button on first page', () => {
    render(<SongList {...defaultProps} totalPages={3} page={1} />);
    expect(screen.getByLabelText('worship.prevPage')).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(<SongList {...defaultProps} totalPages={3} page={3} />);
    expect(screen.getByLabelText('worship.nextPage')).toBeDisabled();
  });

  it('calls onPageChange when page button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    const onPageChange = vi.fn();
    render(<SongList {...defaultProps} totalPages={5} page={2} onPageChange={onPageChange} />);
    await user.click(screen.getByLabelText('worship.nextPage'));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('shows reset button when a filter is active', () => {
    render(<SongList {...defaultProps} search="grace" />);
    expect(screen.getByText('worship.resetFilters')).toBeInTheDocument();
  });

  it('does not show reset button when no filters active', () => {
    render(<SongList {...defaultProps} />);
    expect(screen.queryByText('worship.resetFilters')).not.toBeInTheDocument();
  });

  it('calls onResetFilters when reset button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    const onResetFilters = vi.fn();
    render(<SongList {...defaultProps} filterArtist="John Newton" onResetFilters={onResetFilters} />);
    await user.click(screen.getByText('worship.resetFilters'));
    expect(onResetFilters).toHaveBeenCalled();
  });

  it('shows reset button when favorites filter is active', () => {
    render(<SongList {...defaultProps} showFavoritesOnly={true} />);
    expect(screen.getByText('worship.resetFilters')).toBeInTheDocument();
  });

  it('shows reset button when format filter is active', () => {
    render(<SongList {...defaultProps} filterFormat="chordpro" />);
    expect(screen.getByText('worship.resetFilters')).toBeInTheDocument();
  });
});
