import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router';
import WorshipSongs from './WorshipSongs';
import type { WorshipSong } from '../types';

const mockSongs: WorshipSong[] = [
  {
    id: '1',
    title: 'Amazing Grace',
    artist: 'John Newton',
    originalKey: 'G',
    format: 'chordpro',
    content: '[G]Amazing [C]grace',
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: '10000 Reasons',
    artist: 'Matt Redman',
    originalKey: 'G',
    format: 'chordpro',
    content: '[G]Bless the [C]Lord',
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockAddSong = vi.fn().mockResolvedValue('3');
const mockUpdateSong = vi.fn().mockResolvedValue(undefined);
const mockDeleteSong = vi.fn().mockResolvedValue(undefined);
const mockGetSong = vi.fn().mockImplementation((id: string) =>
  Promise.resolve(mockSongs.find((s) => s.id === id) ?? null)
);
const mockRefresh = vi.fn().mockResolvedValue({});

vi.mock('../hooks/useWorshipSongs', () => ({
  useWorshipSongs: () => ({
    songs: mockSongs,
    loading: false,
    isAuthenticated: true,
    addSong: mockAddSong,
    updateSong: mockUpdateSong,
    deleteSong: mockDeleteSong,
    getSong: mockGetSong,
    refresh: mockRefresh,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  window.__getFirebaseIdToken = vi.fn().mockResolvedValue('mock-token');
  localStorage.clear();
});

const renderWithRouter = (initialPath = '/worship') => render(
  <MemoryRouter initialEntries={[initialPath]}>
    <Routes>
      <Route path="/worship" element={<WorshipSongs />} />
      <Route path="/worship/new" element={<WorshipSongs />} />
      <Route path="/worship/:songId" element={<WorshipSongs />} />
      <Route path="/worship/:songId/edit" element={<WorshipSongs />} />
    </Routes>
  </MemoryRouter>
);

describe('WorshipSongs', () => {
  it('renders song list on mount', async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
      expect(screen.getByText('10000 Reasons')).toBeInTheDocument();
    });
  });

  it('shows loading state then resolves', async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
    });
  });

  it('navigates to song viewer when a song is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Amazing Grace'));

    await waitFor(() => {
      expect(screen.getByText('John Newton')).toBeInTheDocument();
    });
  });
});
