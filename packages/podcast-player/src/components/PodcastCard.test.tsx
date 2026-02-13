import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PodcastCard from './PodcastCard';
import type { Podcast } from '../hooks/usePodcastData';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const basePodcast: Podcast = {
  id: 1,
  title: 'Tech Talk Daily',
  author: 'John Smith',
  artwork: 'https://example.com/art.jpg',
  description: 'A daily podcast',
  feedUrl: 'https://example.com/feed.xml',
  episodeCount: 150,
  categories: 'Technology',
};

describe('PodcastCard', () => {
  const onSelect = vi.fn();
  const onToggleSubscribe = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders episode count badge when episodeCount is a valid number', () => {
    render(
      <PodcastCard
        podcast={basePodcast}
        onSelect={onSelect}
        isSubscribed={false}
        onToggleSubscribe={onToggleSubscribe}
      />
    );
    expect(screen.getByText('podcasts.episodeCount')).toBeInTheDocument();
  });

  it('renders episode count badge when episodeCount is 0', () => {
    const podcast = { ...basePodcast, episodeCount: 0 };
    render(
      <PodcastCard
        podcast={podcast}
        onSelect={onSelect}
        isSubscribed={false}
        onToggleSubscribe={onToggleSubscribe}
      />
    );
    expect(screen.getByText('podcasts.episodeCount')).toBeInTheDocument();
  });

  it('does not render episode count badge when episodeCount is null', () => {
    const podcast = { ...basePodcast, episodeCount: null as unknown as number };
    render(
      <PodcastCard
        podcast={podcast}
        onSelect={onSelect}
        isSubscribed={false}
        onToggleSubscribe={onToggleSubscribe}
      />
    );
    expect(screen.queryByText('podcasts.episodeCount')).not.toBeInTheDocument();
    // Should not display "null episodes"
    expect(screen.queryByText(/null/)).not.toBeInTheDocument();
  });

  it('does not render episode count badge when episodeCount is undefined', () => {
    const podcast = { ...basePodcast, episodeCount: undefined as unknown as number };
    render(
      <PodcastCard
        podcast={podcast}
        onSelect={onSelect}
        isSubscribed={false}
        onToggleSubscribe={onToggleSubscribe}
      />
    );
    expect(screen.queryByText('podcasts.episodeCount')).not.toBeInTheDocument();
    expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
  });

  it('renders podcast title and author', () => {
    render(
      <PodcastCard
        podcast={basePodcast}
        onSelect={onSelect}
        isSubscribed={false}
        onToggleSubscribe={onToggleSubscribe}
      />
    );
    expect(screen.getByText('Tech Talk Daily')).toBeInTheDocument();
    expect(screen.getByText('John Smith')).toBeInTheDocument();
  });

  it('episode count badge has aria-label when visible', () => {
    render(
      <PodcastCard
        podcast={basePodcast}
        onSelect={onSelect}
        isSubscribed={false}
        onToggleSubscribe={onToggleSubscribe}
      />
    );
    const badge = screen.getByText('podcasts.episodeCount');
    expect(badge).toHaveAttribute('aria-label', 'podcasts.episodeCount');
  });
});
