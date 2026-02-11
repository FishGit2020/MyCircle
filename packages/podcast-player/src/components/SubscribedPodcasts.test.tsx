import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing/react';
import { MemoryRouter } from 'react-router';
import { GET_PODCAST_FEED } from '@weather/shared';
import SubscribedPodcasts from './SubscribedPodcasts';

const mockFeed = {
  id: '101',
  title: 'Tech Talk Daily',
  author: 'Tech Host',
  artwork: 'https://example.com/art.jpg',
  description: 'Daily tech news and interviews',
  categories: { Technology: 'Technology' },
  episodeCount: 42,
  language: 'en',
};

const mockFeed2 = {
  id: '202',
  title: 'Science Weekly',
  author: 'Science Team',
  artwork: 'https://example.com/science.jpg',
  description: 'Weekly science roundup',
  categories: { Science: 'Science' },
  episodeCount: 100,
  language: 'en',
};

function buildMock(feedId: string, feed: typeof mockFeed) {
  return {
    request: {
      query: GET_PODCAST_FEED,
      variables: { feedId },
    },
    result: {
      data: {
        podcastFeed: feed,
      },
    },
  };
}

const renderWithProviders = (
  ui: React.ReactElement,
  mocks: ReturnType<typeof buildMock>[] = []
) => {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <MemoryRouter>{ui}</MemoryRouter>
    </MockedProvider>
  );
};

describe('SubscribedPodcasts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when subscribedIds is empty', () => {
    renderWithProviders(
      <SubscribedPodcasts
        subscribedIds={new Set()}
        onSelectPodcast={vi.fn()}
        onUnsubscribe={vi.fn()}
      />
    );

    expect(screen.getByText('No subscriptions yet.')).toBeInTheDocument();
    expect(
      screen.getByText('Search or browse trending podcasts to subscribe.')
    ).toBeInTheDocument();
  });

  it('does not render heading when subscribedIds is empty', () => {
    renderWithProviders(
      <SubscribedPodcasts
        subscribedIds={new Set()}
        onSelectPodcast={vi.fn()}
        onUnsubscribe={vi.fn()}
      />
    );

    expect(screen.queryByText('My Subscriptions')).not.toBeInTheDocument();
  });

  it('renders podcast cards when feed data is loaded', async () => {
    const mocks = [buildMock('101', mockFeed)];

    renderWithProviders(
      <SubscribedPodcasts
        subscribedIds={new Set(['101'])}
        onSelectPodcast={vi.fn()}
        onUnsubscribe={vi.fn()}
      />,
      mocks
    );

    expect(screen.getByText('My Subscriptions')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Tech Talk Daily')).toBeInTheDocument();
    });

    expect(screen.getByText('Tech Host')).toBeInTheDocument();
    expect(screen.getByText('42 episodes')).toBeInTheDocument();
  });

  it('renders multiple podcast cards for multiple subscriptions', async () => {
    const mocks = [
      buildMock('101', mockFeed),
      buildMock('202', mockFeed2),
    ];

    renderWithProviders(
      <SubscribedPodcasts
        subscribedIds={new Set(['101', '202'])}
        onSelectPodcast={vi.fn()}
        onUnsubscribe={vi.fn()}
      />,
      mocks
    );

    await waitFor(() => {
      expect(screen.getByText('Tech Talk Daily')).toBeInTheDocument();
      expect(screen.getByText('Science Weekly')).toBeInTheDocument();
    });

    expect(screen.getByText('Tech Host')).toBeInTheDocument();
    expect(screen.getByText('Science Team')).toBeInTheDocument();
  });

  it('calls onUnsubscribe when Unsubscribe button is clicked', async () => {
    const user = userEvent.setup();
    const onUnsubscribe = vi.fn();
    const mocks = [buildMock('101', mockFeed)];

    renderWithProviders(
      <SubscribedPodcasts
        subscribedIds={new Set(['101'])}
        onSelectPodcast={vi.fn()}
        onUnsubscribe={onUnsubscribe}
      />,
      mocks
    );

    await waitFor(() => {
      expect(screen.getByText('Tech Talk Daily')).toBeInTheDocument();
    });

    const unsubscribeButton = screen.getByRole('button', {
      name: /Unsubscribe Tech Talk Daily/,
    });
    await user.click(unsubscribeButton);

    expect(onUnsubscribe).toHaveBeenCalledTimes(1);
    expect(onUnsubscribe).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '101',
        title: 'Tech Talk Daily',
      })
    );
  });

  it('calls onSelectPodcast when a podcast card is clicked', async () => {
    const user = userEvent.setup();
    const onSelectPodcast = vi.fn();
    const mocks = [buildMock('101', mockFeed)];

    renderWithProviders(
      <SubscribedPodcasts
        subscribedIds={new Set(['101'])}
        onSelectPodcast={onSelectPodcast}
        onUnsubscribe={vi.fn()}
      />,
      mocks
    );

    await waitFor(() => {
      expect(screen.getByText('Tech Talk Daily')).toBeInTheDocument();
    });

    const card = screen.getByRole('button', {
      name: 'Tech Talk Daily - Tech Host',
    });
    await user.click(card);

    expect(onSelectPodcast).toHaveBeenCalledTimes(1);
    expect(onSelectPodcast).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '101',
        title: 'Tech Talk Daily',
        author: 'Tech Host',
      })
    );
  });

  it('shows loading skeleton while feed data is loading', () => {
    const mocks = [
      {
        request: {
          query: GET_PODCAST_FEED,
          variables: { feedId: '101' },
        },
        delay: Infinity,
        result: {
          data: { podcastFeed: mockFeed },
        },
      },
    ];

    renderWithProviders(
      <SubscribedPodcasts
        subscribedIds={new Set(['101'])}
        onSelectPodcast={vi.fn()}
        onUnsubscribe={vi.fn()}
      />,
      mocks
    );

    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    expect(screen.queryByText('Tech Talk Daily')).not.toBeInTheDocument();
  });
});
