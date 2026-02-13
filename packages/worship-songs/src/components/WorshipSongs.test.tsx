import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorshipSongs from './WorshipSongs';

const mockSongs = [
  {
    id: '1',
    title: 'Amazing Grace',
    artist: 'John Newton',
    lyrics: 'Amazing grace how sweet the sound',
    format: 'plain' as const,
    key: 'G',
    tags: ['hymn'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: '10000 Reasons',
    artist: 'Matt Redman',
    lyrics: '[G]Bless the [C]Lord',
    format: 'chordpro' as const,
    key: 'G',
    tags: ['worship'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

beforeEach(() => {
  window.__worshipSongs = {
    getAll: vi.fn().mockResolvedValue(mockSongs),
    get: vi.fn().mockImplementation((id: string) =>
      Promise.resolve(mockSongs.find((s) => s.id === id) ?? null)
    ),
    add: vi.fn().mockResolvedValue('3'),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  };
  window.__getFirebaseIdToken = vi.fn().mockResolvedValue('mock-token');
  localStorage.clear();
});

describe('WorshipSongs', () => {
  it('renders song list on mount', async () => {
    render(<WorshipSongs />);
    await waitFor(() => {
      expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
      expect(screen.getByText('10000 Reasons')).toBeInTheDocument();
    });
  });

  it('shows loading state then resolves', async () => {
    render(<WorshipSongs />);
    await waitFor(() => {
      expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
    });
  });

  it('navigates to song viewer when a song is clicked', async () => {
    const user = userEvent.setup();
    render(<WorshipSongs />);

    await waitFor(() => {
      expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Amazing Grace'));

    await waitFor(() => {
      expect(screen.getByText('Back to Songs')).toBeInTheDocument();
      expect(screen.getByText('John Newton')).toBeInTheDocument();
    });
  });
});
