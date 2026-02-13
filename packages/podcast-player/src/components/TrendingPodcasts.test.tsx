import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TrendingPodcasts from './TrendingPodcasts';

const mockPodcasts = [
  {
    id: 1,
    title: 'Tech Daily',
    author: 'Alice',
    artwork: 'https://example.com/1.jpg',
    description: 'Tech news',
    feedUrl: 'https://example.com/1.xml',
    episodeCount: 50,
    categories: 'Technology, Science',
  },
  {
    id: 2,
    title: 'History Hour',
    author: 'Bob',
    artwork: 'https://example.com/2.jpg',
    description: 'History stories',
    feedUrl: 'https://example.com/2.xml',
    episodeCount: 30,
    categories: 'History, Education',
  },
  {
    id: 3,
    title: 'Science Lab',
    author: 'Carol',
    artwork: 'https://example.com/3.jpg',
    description: 'Science podcast',
    feedUrl: 'https://example.com/3.xml',
    episodeCount: 25,
    categories: 'Science, Education',
  },
  {
    id: 4,
    title: 'Code Cast',
    author: 'Dave',
    artwork: 'https://example.com/4.jpg',
    description: 'Programming',
    feedUrl: 'https://example.com/4.xml',
    episodeCount: 15,
    categories: 'Technology',
  },
  {
    id: 5,
    title: 'No Category Pod',
    author: 'Eve',
    artwork: 'https://example.com/5.jpg',
    description: 'Misc',
    feedUrl: 'https://example.com/5.xml',
    episodeCount: 10,
    categories: '',
  },
];

vi.mock('../hooks/usePodcastData', () => ({
  useTrendingPodcasts: vi.fn(),
}));

import { useTrendingPodcasts } from '../hooks/usePodcastData';
const mockUseTrending = vi.mocked(useTrendingPodcasts);

/** Helper: get the category chip list element */
function getChipList() {
  return screen.getByRole('list', { name: /categories/i });
}

/** Helper: click a category chip inside the chip list */
async function clickChip(user: ReturnType<typeof userEvent.setup>, name: string) {
  const chipList = getChipList();
  await user.click(within(chipList).getByText(name));
}

describe('TrendingPodcasts', () => {
  const onSelectPodcast = vi.fn();
  const onToggleSubscribe = vi.fn();
  const subscribedIds = new Set<string>();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTrending.mockReturnValue({
      data: mockPodcasts as any,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  function renderComponent(initialCategory?: string | null) {
    return render(
      <TrendingPodcasts
        onSelectPodcast={onSelectPodcast}
        subscribedIds={subscribedIds}
        onToggleSubscribe={onToggleSubscribe}
        initialCategory={initialCategory}
      />
    );
  }

  it('renders trending heading', () => {
    renderComponent();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Trending');
  });

  it('renders all podcast cards', () => {
    renderComponent();
    expect(screen.getByText('Tech Daily')).toBeInTheDocument();
    expect(screen.getByText('History Hour')).toBeInTheDocument();
    expect(screen.getByText('Science Lab')).toBeInTheDocument();
    expect(screen.getByText('Code Cast')).toBeInTheDocument();
    expect(screen.getByText('No Category Pod')).toBeInTheDocument();
  });

  it('renders category filter chips', () => {
    renderComponent();
    const chipList = getChipList();
    // "All" button plus extracted categories
    expect(within(chipList).getByText('All')).toBeInTheDocument();
    expect(within(chipList).getByText('Technology')).toBeInTheDocument();
    expect(within(chipList).getByText('Science')).toBeInTheDocument();
    expect(within(chipList).getByText('Education')).toBeInTheDocument();
    expect(within(chipList).getByText('History')).toBeInTheDocument();
  });

  it('extracts categories sorted by frequency', () => {
    renderComponent();
    const chipList = getChipList();
    const buttons = within(chipList).getAllByRole('button');
    // First is "All", then categories sorted by frequency (Technology=2, Science=2, Education=2, History=1)
    expect(buttons[0]).toHaveTextContent('All');
    // History should be last since it only appears once
    expect(buttons[buttons.length - 1]).toHaveTextContent('History');
  });

  it('filters podcasts when a category chip is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Click "History" chip inside the chip list
    await clickChip(user, 'History');

    // Only History Hour has History category
    expect(screen.getByText('History Hour')).toBeInTheDocument();
    expect(screen.queryByText('Tech Daily')).not.toBeInTheDocument();
    expect(screen.queryByText('Science Lab')).not.toBeInTheDocument();
  });

  it('shows heading with selected category name', async () => {
    const user = userEvent.setup();
    renderComponent();

    await clickChip(user, 'Technology');
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Technology');
  });

  it('clears filter when "All" chip is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Filter to Technology
    await clickChip(user, 'Technology');
    expect(screen.queryByText('History Hour')).not.toBeInTheDocument();

    // Click "All" to clear
    await clickChip(user, 'All');
    expect(screen.getByText('History Hour')).toBeInTheDocument();
    expect(screen.getByText('Tech Daily')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Trending');
  });

  it('toggles category off when clicking the same chip again', async () => {
    const user = userEvent.setup();
    renderComponent();

    await clickChip(user, 'History');
    expect(screen.queryByText('Tech Daily')).not.toBeInTheDocument();

    // Click History again to deselect
    await clickChip(user, 'History');
    expect(screen.getByText('Tech Daily')).toBeInTheDocument();
  });

  it('respects initialCategory prop', () => {
    renderComponent('Technology');
    // Should show filtered results
    expect(screen.getByText('Tech Daily')).toBeInTheDocument();
    expect(screen.getByText('Code Cast')).toBeInTheDocument();
    expect(screen.queryByText('History Hour')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Technology');
  });

  it('shows loading skeleton', () => {
    mockUseTrending.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refetch: vi.fn(),
    });
    renderComponent();
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows error state', () => {
    mockUseTrending.mockReturnValue({
      data: null,
      loading: false,
      error: 'Network error',
      refetch: vi.fn(),
    });
    renderComponent();
    expect(screen.getByText('Failed to load podcasts')).toBeInTheDocument();
  });

  it('returns null when no podcasts are available', () => {
    mockUseTrending.mockReturnValue({
      data: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
    const { container } = renderComponent();
    expect(container.innerHTML).toBe('');
  });
});
