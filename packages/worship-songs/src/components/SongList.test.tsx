import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SongList from './SongList';
import type { WorshipSong } from '../types';

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

const makeSong = (overrides: Partial<WorshipSong> = {}): WorshipSong => ({
  id: '1',
  title: 'Amazing Grace',
  artist: 'John Newton',
  originalKey: 'G',
  format: 'chordpro',
  content: '[G]Amazing [C]grace',
  notes: '',
  tags: ['hymn'],
  createdAt: { seconds: 1700000000, nanoseconds: 0 },
  updatedAt: { seconds: 1700000000, nanoseconds: 0 },
  ...overrides,
});

const songs: WorshipSong[] = [
  makeSong({ id: '1', title: 'Amazing Grace', artist: 'John Newton', tags: ['hymn'] }),
  makeSong({ id: '2', title: 'How Great Thou Art', artist: 'Carl Boberg', format: 'text', tags: ['classic'] }),
  makeSong({ id: '3', title: '10000 Reasons', artist: 'Matt Redman', tags: ['worship'] }),
];

describe('SongList', () => {
  const onSelectSong = vi.fn();
  const onNewSong = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders song titles when given songs', () => {
    render(
      <SongList songs={songs} loading={false} isAuthenticated={true} onSelectSong={onSelectSong} onNewSong={onNewSong} />
    );
    expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
    expect(screen.getByText('How Great Thou Art')).toBeInTheDocument();
    expect(screen.getByText('10000 Reasons')).toBeInTheDocument();
  });

  it('renders song artists', () => {
    render(
      <SongList songs={songs} loading={false} isAuthenticated={true} onSelectSong={onSelectSong} onNewSong={onNewSong} />
    );
    expect(screen.getByText('John Newton')).toBeInTheDocument();
    expect(screen.getByText('Carl Boberg')).toBeInTheDocument();
    expect(screen.getByText('Matt Redman')).toBeInTheDocument();
  });

  it('shows loading skeletons when loading', () => {
    const { container } = render(
      <SongList songs={[]} loading={true} isAuthenticated={true} onSelectSong={onSelectSong} onNewSong={onNewSong} />
    );
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(3);
  });

  it('shows empty state when no songs', () => {
    render(
      <SongList songs={[]} loading={false} isAuthenticated={true} onSelectSong={onSelectSong} onNewSong={onNewSong} />
    );
    expect(screen.getByText('worship.noSongs')).toBeInTheDocument();
  });

  it('shows no-results state when search finds nothing', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <SongList songs={songs} loading={false} isAuthenticated={true} onSelectSong={onSelectSong} onNewSong={onNewSong} />
    );

    const input = screen.getByPlaceholderText('worship.searchPlaceholder');
    await user.type(input, 'zzzznonexistent');

    expect(screen.getByText('worship.noResults')).toBeInTheDocument();
  });

  it('filters songs by search query on title', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <SongList songs={songs} loading={false} isAuthenticated={true} onSelectSong={onSelectSong} onNewSong={onNewSong} />
    );

    const input = screen.getByPlaceholderText('worship.searchPlaceholder');
    await user.type(input, 'Amazing');

    expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
    expect(screen.queryByText('How Great Thou Art')).not.toBeInTheDocument();
    expect(screen.queryByText('10000 Reasons')).not.toBeInTheDocument();
  });

  it('filters songs by search query on artist', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <SongList songs={songs} loading={false} isAuthenticated={true} onSelectSong={onSelectSong} onNewSong={onNewSong} />
    );

    const input = screen.getByPlaceholderText('worship.searchPlaceholder');
    await user.type(input, 'Matt');

    expect(screen.getByText('10000 Reasons')).toBeInTheDocument();
    expect(screen.queryByText('Amazing Grace')).not.toBeInTheDocument();
  });

  it('filters songs by search query on tags', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <SongList songs={songs} loading={false} isAuthenticated={true} onSelectSong={onSelectSong} onNewSong={onNewSong} />
    );

    const input = screen.getByPlaceholderText('worship.searchPlaceholder');
    await user.type(input, 'classic');

    expect(screen.getByText('How Great Thou Art')).toBeInTheDocument();
    expect(screen.queryByText('Amazing Grace')).not.toBeInTheDocument();
  });

  it('calls onSelectSong when a song is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <SongList songs={songs} loading={false} isAuthenticated={true} onSelectSong={onSelectSong} onNewSong={onNewSong} />
    );

    await user.click(screen.getByText('Amazing Grace'));
    expect(onSelectSong).toHaveBeenCalledWith('1');
  });

  it('shows add song button when authenticated', () => {
    render(
      <SongList songs={songs} loading={false} isAuthenticated={true} onSelectSong={onSelectSong} onNewSong={onNewSong} />
    );
    expect(screen.getByText('worship.addSong')).toBeInTheDocument();
  });

  it('does not show add song button when not authenticated', () => {
    render(
      <SongList songs={songs} loading={false} isAuthenticated={false} onSelectSong={onSelectSong} onNewSong={onNewSong} />
    );
    expect(screen.queryByText('worship.addSong')).not.toBeInTheDocument();
  });

  it('calls onNewSong when add song button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <SongList songs={songs} loading={false} isAuthenticated={true} onSelectSong={onSelectSong} onNewSong={onNewSong} />
    );

    await user.click(screen.getByText('worship.addSong'));
    expect(onNewSong).toHaveBeenCalled();
  });

  it('shows login-to-edit message when not authenticated', () => {
    render(
      <SongList songs={songs} loading={false} isAuthenticated={false} onSelectSong={onSelectSong} onNewSong={onNewSong} />
    );
    expect(screen.getByText('worship.loginToEdit')).toBeInTheDocument();
  });

  it('does not show login-to-edit message when authenticated', () => {
    render(
      <SongList songs={songs} loading={false} isAuthenticated={true} onSelectSong={onSelectSong} onNewSong={onNewSong} />
    );
    expect(screen.queryByText('worship.loginToEdit')).not.toBeInTheDocument();
  });

  it('renders song tags', () => {
    render(
      <SongList songs={songs} loading={false} isAuthenticated={true} onSelectSong={onSelectSong} onNewSong={onNewSong} />
    );
    expect(screen.getByText('hymn')).toBeInTheDocument();
    expect(screen.getByText('classic')).toBeInTheDocument();
    expect(screen.getByText('worship')).toBeInTheDocument();
  });

  it('renders original key badges', () => {
    render(
      <SongList songs={songs} loading={false} isAuthenticated={true} onSelectSong={onSelectSong} onNewSong={onNewSong} />
    );
    // All songs have key 'G'
    const keyBadges = screen.getAllByText('G');
    expect(keyBadges.length).toBe(3);
  });

  it('renders format badges', () => {
    render(
      <SongList songs={songs} loading={false} isAuthenticated={true} onSelectSong={onSelectSong} onNewSong={onNewSong} />
    );
    // 2 chordpro songs + 1 toolbar filter button = 3 chordpro texts
    // 1 text song + 1 toolbar filter button = 2 text texts
    const chordproBadges = screen.getAllByText('worship.formatChordpro');
    const textBadges = screen.getAllByText('worship.formatText');
    expect(chordproBadges.length).toBe(3);
    expect(textBadges.length).toBe(2);
  });

  it('renders the title heading', () => {
    render(
      <SongList songs={songs} loading={false} isAuthenticated={true} onSelectSong={onSelectSong} onNewSong={onNewSong} />
    );
    expect(screen.getByText('worship.title')).toBeInTheDocument();
  });
});
