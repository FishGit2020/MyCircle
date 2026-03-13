import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import WorshipWidget from './WorshipWidget';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
  StorageKeys: { WORSHIP_FAVORITES: 'worship-favorites' },
  WindowEvents: { WORSHIP_FAVORITES_CHANGED: 'worship-favorites-changed' },
  useQuery: () => ({
    data: { worshipSongsList: { totalCount: 5 } },
    loading: false,
  }),
  GET_WORSHIP_SONGS_LIST: {},
}));

const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');

beforeEach(() => {
  getItemSpy.mockReturnValue(null);
});

describe('WorshipWidget', () => {
  it('renders worship title', () => {
    render(<WorshipWidget />);
    expect(screen.getByText('widgets.worship')).toBeInTheDocument();
  });

  it('shows song count text from GraphQL data', () => {
    render(<WorshipWidget />);
    expect(screen.getByText('widgets.worshipSongCount')).toBeInTheDocument();
  });

  it('shows favorite count text when favorites exist', () => {
    getItemSpy.mockImplementation((key: string) => {
      if (key === 'worship-favorites') return JSON.stringify(['s1', 's2', 's3']);
      return null;
    });
    render(<WorshipWidget />);
    expect(screen.getByText('widgets.worshipFavCount')).toBeInTheDocument();
  });

  it('updates when favorites change via window event', () => {
    render(<WorshipWidget />);

    getItemSpy.mockImplementation((key: string) => {
      if (key === 'worship-favorites') return JSON.stringify(['s1']);
      return null;
    });
    act(() => {
      window.dispatchEvent(new Event('worship-favorites-changed'));
    });
    expect(screen.getByText('widgets.worshipFavCount')).toBeInTheDocument();
  });
});
